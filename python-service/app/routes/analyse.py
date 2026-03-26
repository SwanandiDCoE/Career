"""
analyse.py  —  v2
─────────────────
Phase 1: No randomness · Skill graph · Section-aware parser · Date arithmetic
Phase 2: IDF-weighted scoring · Multi-signal formula · Catastrophic miss · Confidence
Phase 3: ROI-ordered strategy · Market data · Role family matching

POST /api/upload    — parse PDF → match DB jobs → feedback
POST /api/strategy  — apply strategy for a specific job
POST /api/email     — cold email generator
POST /api/linkedin  — LinkedIn post generator
"""

import io
import re
import math
import datetime
import logging
from flask import Blueprint, request, jsonify
import pdfplumber

from app.db.jobs_repo import search_jobs, get_skills_for_idf

log = logging.getLogger(__name__)
analyse_bp = Blueprint("analyse", __name__)


# ═══════════════════════════════════════════════════════════════════
# §1  SKILL GRAPH
#     canonical → {aliases, category, weight, related, implies, learn_weeks}
#     weight:   language=1.0  framework=0.9  cloud=0.95  db=0.85  tool=0.75  method=0.60
#     related:  {other_canonical: transfer_coefficient}  — partial credit on mismatch
#     implies:  skills a hiring manager can infer you have if you list this skill
# ═══════════════════════════════════════════════════════════════════

SKILL_GRAPH: dict[str, dict] = {
    # ── Languages ────────────────────────────────────────────────
    "python": {
        "aliases":     ["python3", "py", "cpython"],
        "category":    "language", "weight": 1.0, "learn_weeks": 10,
        "related":     {"django": 0.65, "flask": 0.65, "fastapi": 0.70,
                        "pandas": 0.60, "numpy": 0.60, "r": 0.30},
        "implies":     ["git", "linux"],
    },
    "javascript": {
        "aliases":     ["js", "es6", "es2015", "ecmascript", "vanilla js", "vanilla javascript"],
        "category":    "language", "weight": 1.0, "learn_weeks": 8,
        "related":     {"typescript": 0.80, "node.js": 0.75, "react": 0.70,
                        "vue": 0.65, "angular": 0.60},
        "implies":     ["html", "css", "git"],
    },
    "typescript": {
        "aliases":     ["ts"],
        "category":    "language", "weight": 0.95, "learn_weeks": 4,
        "related":     {"javascript": 0.95, "react": 0.80, "node.js": 0.75,
                        "angular": 0.75, "next.js": 0.75},
        "implies":     ["javascript", "git"],
    },
    "java": {
        "aliases":     ["java8", "java11", "java17", "java 8", "java 11"],
        "category":    "language", "weight": 1.0, "learn_weeks": 14,
        "related":     {"spring": 0.70, "kotlin": 0.65, "scala": 0.45,
                        "c#": 0.40},
        "implies":     ["git", "oop"],
    },
    "go": {
        "aliases":     ["golang"],
        "category":    "language", "weight": 1.0, "learn_weeks": 8,
        "related":     {"docker": 0.60, "kubernetes": 0.55, "microservices": 0.55},
        "implies":     ["git", "linux"],
    },
    "c++": {
        "aliases":     ["cpp", "c plus plus"],
        "category":    "language", "weight": 1.0, "learn_weeks": 20,
        "related":     {"c#": 0.50, "rust": 0.45, "java": 0.35},
        "implies":     ["git", "algorithms", "data structures"],
    },
    "c#": {
        "aliases":     ["csharp", "c sharp", "dotnet", ".net"],
        "category":    "language", "weight": 1.0, "learn_weeks": 12,
        "related":     {"java": 0.55, "asp.net": 0.85, "azure": 0.55},
        "implies":     ["git", "oop"],
    },
    "rust": {
        "aliases":     [],
        "category":    "language", "weight": 1.0, "learn_weeks": 20,
        "related":     {"c++": 0.50, "go": 0.40},
        "implies":     ["git", "systems programming"],
    },
    "kotlin": {
        "aliases":     [],
        "category":    "language", "weight": 0.95, "learn_weeks": 6,
        "related":     {"java": 0.80, "android": 0.75, "spring": 0.60},
        "implies":     ["git", "oop"],
    },
    "swift": {
        "aliases":     [],
        "category":    "language", "weight": 0.95, "learn_weeks": 8,
        "related":     {"ios": 0.90, "kotlin": 0.40},
        "implies":     ["xcode", "git"],
    },
    "r": {
        "aliases":     ["r language", "r programming"],
        "category":    "language", "weight": 0.85, "learn_weeks": 8,
        "related":     {"python": 0.50, "pandas": 0.55, "machine learning": 0.40},
        "implies":     ["statistics"],
    },
    "scala": {
        "aliases":     [],
        "category":    "language", "weight": 0.90, "learn_weeks": 14,
        "related":     {"java": 0.65, "spark": 0.75, "kafka": 0.55},
        "implies":     ["git", "functional programming"],
    },
    "php": {
        "aliases":     [],
        "category":    "language", "weight": 0.85, "learn_weeks": 8,
        "related":     {"laravel": 0.80, "mysql": 0.55, "javascript": 0.35},
        "implies":     ["git", "sql"],
    },
    "ruby": {
        "aliases":     [],
        "category":    "language", "weight": 0.85, "learn_weeks": 8,
        "related":     {"rails": 0.85, "javascript": 0.35},
        "implies":     ["git"],
    },
    "dart": {
        "aliases":     [],
        "category":    "language", "weight": 0.80, "learn_weeks": 6,
        "related":     {"flutter": 0.90},
        "implies":     ["git"],
    },
    # ── Frontend Frameworks ───────────────────────────────────────
    "react": {
        "aliases":     ["reactjs", "react.js", "react js", "react native web"],
        "category":    "framework", "weight": 0.95, "learn_weeks": 6,
        "related":     {"javascript": 0.95, "typescript": 0.75,
                        "next.js": 0.70, "vue": 0.40, "angular": 0.30,
                        "redux": 0.65},
        "implies":     ["javascript", "html", "css", "git"],
    },
    "next.js": {
        "aliases":     ["nextjs", "next js"],
        "category":    "framework", "weight": 0.90, "learn_weeks": 3,
        "related":     {"react": 0.90, "typescript": 0.70, "javascript": 0.85,
                        "vercel": 0.55},
        "implies":     ["react", "javascript", "css"],
    },
    "vue": {
        "aliases":     ["vuejs", "vue.js", "vue js"],
        "category":    "framework", "weight": 0.88, "learn_weeks": 5,
        "related":     {"javascript": 0.90, "typescript": 0.65,
                        "react": 0.45, "nuxt": 0.70},
        "implies":     ["javascript", "html", "css"],
    },
    "angular": {
        "aliases":     ["angularjs", "angular.js", "angular js"],
        "category":    "framework", "weight": 0.88, "learn_weeks": 8,
        "related":     {"typescript": 0.90, "javascript": 0.80,
                        "react": 0.35, "rxjs": 0.65},
        "implies":     ["typescript", "html", "css"],
    },
    "svelte": {
        "aliases":     ["sveltekit"],
        "category":    "framework", "weight": 0.80, "learn_weeks": 4,
        "related":     {"javascript": 0.90, "react": 0.45},
        "implies":     ["javascript", "html", "css"],
    },
    "redux": {
        "aliases":     ["redux toolkit", "zustand"],
        "category":    "tool", "weight": 0.72, "learn_weeks": 2,
        "related":     {"react": 0.85, "javascript": 0.70},
        "implies":     ["react"],
    },
    "html": {
        "aliases":     ["html5"],
        "category":    "tool", "weight": 0.65, "learn_weeks": 2,
        "related":     {"css": 0.90, "javascript": 0.70},
        "implies":     [],
    },
    "css": {
        "aliases":     ["css3", "scss", "sass", "tailwind", "tailwindcss", "bootstrap"],
        "category":    "tool", "weight": 0.65, "learn_weeks": 3,
        "related":     {"html": 0.90, "javascript": 0.60},
        "implies":     ["html"],
    },
    "graphql": {
        "aliases":     [],
        "category":    "tool", "weight": 0.78, "learn_weeks": 3,
        "related":     {"rest api": 0.65, "node.js": 0.55, "react": 0.45},
        "implies":     ["api design"],
    },
    # ── Backend Frameworks ────────────────────────────────────────
    "node.js": {
        "aliases":     ["nodejs", "node js"],
        "category":    "framework", "weight": 0.92, "learn_weeks": 5,
        "related":     {"javascript": 0.95, "typescript": 0.75,
                        "express": 0.80, "nestjs": 0.70},
        "implies":     ["javascript", "git"],
    },
    "express": {
        "aliases":     ["expressjs", "express.js"],
        "category":    "framework", "weight": 0.80, "learn_weeks": 2,
        "related":     {"node.js": 0.90, "javascript": 0.80},
        "implies":     ["node.js", "rest api"],
    },
    "fastapi": {
        "aliases":     ["fast api"],
        "category":    "framework", "weight": 0.85, "learn_weeks": 3,
        "related":     {"python": 0.90, "django": 0.60, "flask": 0.65},
        "implies":     ["python", "rest api"],
    },
    "django": {
        "aliases":     [],
        "category":    "framework", "weight": 0.88, "learn_weeks": 4,
        "related":     {"python": 0.90, "flask": 0.60, "fastapi": 0.55,
                        "postgresql": 0.55, "rest api": 0.65},
        "implies":     ["python", "sql", "rest api"],
    },
    "flask": {
        "aliases":     [],
        "category":    "framework", "weight": 0.82, "learn_weeks": 3,
        "related":     {"python": 0.90, "django": 0.60, "fastapi": 0.60},
        "implies":     ["python", "rest api"],
    },
    "spring": {
        "aliases":     ["spring boot", "springboot", "spring framework"],
        "category":    "framework", "weight": 0.90, "learn_weeks": 8,
        "related":     {"java": 0.90, "kotlin": 0.65, "microservices": 0.55},
        "implies":     ["java", "rest api"],
    },
    "rails": {
        "aliases":     ["ruby on rails", "ror"],
        "category":    "framework", "weight": 0.85, "learn_weeks": 6,
        "related":     {"ruby": 0.90, "postgresql": 0.55},
        "implies":     ["ruby", "sql"],
    },
    "laravel": {
        "aliases":     [],
        "category":    "framework", "weight": 0.82, "learn_weeks": 5,
        "related":     {"php": 0.90, "mysql": 0.55},
        "implies":     ["php", "sql"],
    },
    "nestjs": {
        "aliases":     ["nest.js", "nest js"],
        "category":    "framework", "weight": 0.85, "learn_weeks": 4,
        "related":     {"node.js": 0.90, "typescript": 0.85},
        "implies":     ["node.js", "typescript"],
    },
    "asp.net": {
        "aliases":     ["asp net", "aspnet", ".net core"],
        "category":    "framework", "weight": 0.85, "learn_weeks": 8,
        "related":     {"c#": 0.90, "azure": 0.55},
        "implies":     ["c#"],
    },
    # ── Databases ─────────────────────────────────────────────────
    "postgresql": {
        "aliases":     ["postgres", "psql", "pg"],
        "category":    "database", "weight": 0.88, "learn_weeks": 3,
        "related":     {"mysql": 0.75, "sqlite": 0.65, "sql": 0.90,
                        "oracle": 0.55, "mssql": 0.55},
        "implies":     ["sql"],
    },
    "mysql": {
        "aliases":     ["mariadb"],
        "category":    "database", "weight": 0.85, "learn_weeks": 3,
        "related":     {"postgresql": 0.75, "sqlite": 0.65, "sql": 0.90},
        "implies":     ["sql"],
    },
    "mongodb": {
        "aliases":     ["mongo"],
        "category":    "database", "weight": 0.85, "learn_weeks": 3,
        "related":     {"postgresql": 0.45, "redis": 0.45, "elasticsearch": 0.40},
        "implies":     [],
    },
    "redis": {
        "aliases":     [],
        "category":    "database", "weight": 0.82, "learn_weeks": 1,
        "related":     {"postgresql": 0.40, "mongodb": 0.40, "memcached": 0.70},
        "implies":     [],
    },
    "elasticsearch": {
        "aliases":     ["elastic", "elk", "opensearch"],
        "category":    "database", "weight": 0.85, "learn_weeks": 4,
        "related":     {"mongodb": 0.40, "kafka": 0.50},
        "implies":     [],
    },
    "sql": {
        "aliases":     ["structured query language"],
        "category":    "tool", "weight": 0.82, "learn_weeks": 4,
        "related":     {"postgresql": 0.80, "mysql": 0.80, "sqlite": 0.80},
        "implies":     [],
    },
    "sqlite": {
        "aliases":     [],
        "category":    "database", "weight": 0.65, "learn_weeks": 1,
        "related":     {"postgresql": 0.60, "mysql": 0.60, "sql": 0.85},
        "implies":     ["sql"],
    },
    "dynamodb": {
        "aliases":     ["dynamo"],
        "category":    "database", "weight": 0.82, "learn_weeks": 3,
        "related":     {"mongodb": 0.50, "aws": 0.60},
        "implies":     ["aws"],
    },
    "firebase": {
        "aliases":     ["firestore"],
        "category":    "database", "weight": 0.78, "learn_weeks": 2,
        "related":     {"mongodb": 0.45, "react": 0.40},
        "implies":     [],
    },
    "cassandra": {
        "aliases":     ["apache cassandra"],
        "category":    "database", "weight": 0.82, "learn_weeks": 6,
        "related":     {"mongodb": 0.45, "dynamodb": 0.50},
        "implies":     ["distributed systems"],
    },
    "snowflake": {
        "aliases":     [],
        "category":    "database", "weight": 0.85, "learn_weeks": 4,
        "related":     {"postgresql": 0.55, "dbt": 0.70, "spark": 0.45},
        "implies":     ["sql"],
    },
    "clickhouse": {
        "aliases":     [],
        "category":    "database", "weight": 0.80, "learn_weeks": 4,
        "related":     {"postgresql": 0.50, "elasticsearch": 0.45},
        "implies":     ["sql"],
    },
    # ── Cloud & Infrastructure ────────────────────────────────────
    "aws": {
        "aliases":     ["amazon web services", "amazon aws"],
        "category":    "cloud", "weight": 0.95, "learn_weeks": 12,
        "related":     {"gcp": 0.55, "azure": 0.50, "docker": 0.65,
                        "kubernetes": 0.60, "terraform": 0.60},
        "implies":     ["linux", "docker"],
    },
    "gcp": {
        "aliases":     ["google cloud", "google cloud platform"],
        "category":    "cloud", "weight": 0.92, "learn_weeks": 10,
        "related":     {"aws": 0.55, "azure": 0.50, "kubernetes": 0.65,
                        "terraform": 0.55},
        "implies":     ["linux", "docker"],
    },
    "azure": {
        "aliases":     ["microsoft azure"],
        "category":    "cloud", "weight": 0.92, "learn_weeks": 10,
        "related":     {"aws": 0.50, "gcp": 0.50, "c#": 0.45,
                        "kubernetes": 0.55, "terraform": 0.55},
        "implies":     ["docker"],
    },
    "docker": {
        "aliases":     ["dockerfile", "docker compose", "docker-compose"],
        "category":    "tool", "weight": 0.88, "learn_weeks": 2,
        "related":     {"kubernetes": 0.75, "aws": 0.55, "linux": 0.65,
                        "ci/cd": 0.60},
        "implies":     ["linux"],
    },
    "kubernetes": {
        "aliases":     ["k8s", "k 8 s"],
        "category":    "tool", "weight": 0.90, "learn_weeks": 10,
        "related":     {"docker": 0.85, "aws": 0.60, "gcp": 0.60,
                        "helm": 0.70, "terraform": 0.55},
        "implies":     ["docker", "linux"],
    },
    "terraform": {
        "aliases":     ["tf", "opentofu"],
        "category":    "tool", "weight": 0.85, "learn_weeks": 5,
        "related":     {"aws": 0.70, "gcp": 0.65, "azure": 0.65,
                        "kubernetes": 0.55, "ansible": 0.50},
        "implies":     ["linux"],
    },
    "linux": {
        "aliases":     ["unix", "bash", "shell scripting", "shell", "bash scripting"],
        "category":    "tool", "weight": 0.80, "learn_weeks": 4,
        "related":     {"docker": 0.55, "aws": 0.45},
        "implies":     [],
    },
    "ci/cd": {
        "aliases":     ["cicd", "continuous integration", "continuous deployment",
                        "github actions", "gitlab ci", "jenkins", "circleci", "travis"],
        "category":    "tool", "weight": 0.82, "learn_weeks": 3,
        "related":     {"docker": 0.65, "kubernetes": 0.50, "git": 0.70},
        "implies":     ["git", "docker"],
    },
    "ansible": {
        "aliases":     [],
        "category":    "tool", "weight": 0.78, "learn_weeks": 4,
        "related":     {"terraform": 0.60, "linux": 0.65},
        "implies":     ["linux"],
    },
    "nginx": {
        "aliases":     ["apache"],
        "category":    "tool", "weight": 0.72, "learn_weeks": 2,
        "related":     {"linux": 0.65, "docker": 0.55},
        "implies":     ["linux"],
    },
    "kafka": {
        "aliases":     ["apache kafka"],
        "category":    "tool", "weight": 0.88, "learn_weeks": 4,
        "related":     {"spark": 0.55, "elasticsearch": 0.45,
                        "microservices": 0.55},
        "implies":     ["distributed systems"],
    },
    # ── Data / ML ─────────────────────────────────────────────────
    "machine learning": {
        "aliases":     ["ml", "statistical learning", "predictive modeling", "predictive modelling"],
        "category":    "domain", "weight": 0.95, "learn_weeks": 24,
        "related":     {"deep learning": 0.70, "python": 0.80,
                        "tensorflow": 0.65, "pytorch": 0.65,
                        "pandas": 0.75, "numpy": 0.70},
        "implies":     ["python", "statistics"],
    },
    "deep learning": {
        "aliases":     ["dl", "neural networks", "neural network"],
        "category":    "domain", "weight": 0.92, "learn_weeks": 20,
        "related":     {"machine learning": 0.80, "tensorflow": 0.80,
                        "pytorch": 0.80, "python": 0.75},
        "implies":     ["machine learning", "python"],
    },
    "tensorflow": {
        "aliases":     ["tf", "tensorflow2", "tensorflow 2"],
        "category":    "framework", "weight": 0.88, "learn_weeks": 10,
        "related":     {"pytorch": 0.70, "keras": 0.80, "python": 0.80,
                        "machine learning": 0.75},
        "implies":     ["python", "machine learning"],
    },
    "pytorch": {
        "aliases":     ["torch"],
        "category":    "framework", "weight": 0.90, "learn_weeks": 10,
        "related":     {"tensorflow": 0.70, "python": 0.85,
                        "machine learning": 0.80, "deep learning": 0.85},
        "implies":     ["python", "machine learning"],
    },
    "pandas": {
        "aliases":     [],
        "category":    "tool", "weight": 0.78, "learn_weeks": 3,
        "related":     {"numpy": 0.80, "python": 0.85, "spark": 0.50},
        "implies":     ["python"],
    },
    "numpy": {
        "aliases":     [],
        "category":    "tool", "weight": 0.75, "learn_weeks": 2,
        "related":     {"pandas": 0.80, "python": 0.85},
        "implies":     ["python"],
    },
    "spark": {
        "aliases":     ["apache spark", "pyspark"],
        "category":    "framework", "weight": 0.88, "learn_weeks": 8,
        "related":     {"kafka": 0.55, "python": 0.65, "scala": 0.70,
                        "hadoop": 0.60, "databricks": 0.65},
        "implies":     ["distributed systems"],
    },
    "dbt": {
        "aliases":     ["data build tool"],
        "category":    "tool", "weight": 0.82, "learn_weeks": 3,
        "related":     {"snowflake": 0.70, "postgresql": 0.55, "sql": 0.75},
        "implies":     ["sql"],
    },
    "airflow": {
        "aliases":     ["apache airflow"],
        "category":    "tool", "weight": 0.82, "learn_weeks": 4,
        "related":     {"python": 0.75, "kafka": 0.40, "spark": 0.45},
        "implies":     ["python"],
    },
    "databricks": {
        "aliases":     [],
        "category":    "platform", "weight": 0.85, "learn_weeks": 6,
        "related":     {"spark": 0.75, "python": 0.65, "snowflake": 0.55},
        "implies":     ["spark", "sql"],
    },
    "nlp": {
        "aliases":     ["natural language processing"],
        "category":    "domain", "weight": 0.88, "learn_weeks": 16,
        "related":     {"machine learning": 0.80, "python": 0.75,
                        "pytorch": 0.65, "transformers": 0.75},
        "implies":     ["machine learning"],
    },
    "computer vision": {
        "aliases":     ["cv", "image processing", "object detection"],
        "category":    "domain", "weight": 0.88, "learn_weeks": 16,
        "related":     {"deep learning": 0.80, "pytorch": 0.65,
                        "tensorflow": 0.65, "opencv": 0.75},
        "implies":     ["deep learning"],
    },
    # ── Mobile ───────────────────────────────────────────────────
    "react native": {
        "aliases":     ["react-native"],
        "category":    "framework", "weight": 0.88, "learn_weeks": 6,
        "related":     {"react": 0.85, "javascript": 0.80,
                        "typescript": 0.70, "flutter": 0.35},
        "implies":     ["react", "javascript"],
    },
    "flutter": {
        "aliases":     [],
        "category":    "framework", "weight": 0.88, "learn_weeks": 6,
        "related":     {"dart": 0.90, "react native": 0.35},
        "implies":     ["dart"],
    },
    "android": {
        "aliases":     ["android sdk", "android development"],
        "category":    "platform", "weight": 0.88, "learn_weeks": 12,
        "related":     {"kotlin": 0.80, "java": 0.70, "flutter": 0.40},
        "implies":     ["kotlin"],
    },
    "ios": {
        "aliases":     ["ios development", "ios sdk"],
        "category":    "platform", "weight": 0.88, "learn_weeks": 12,
        "related":     {"swift": 0.90, "xcode": 0.80, "flutter": 0.40},
        "implies":     ["swift"],
    },
    # ── Engineering Practices ─────────────────────────────────────
    "git": {
        "aliases":     ["github", "gitlab", "bitbucket", "version control"],
        "category":    "tool", "weight": 0.60, "learn_weeks": 1,
        "related":     {"ci/cd": 0.55, "linux": 0.40},
        "implies":     [],
    },
    "rest api": {
        "aliases":     ["restful", "rest", "restful api", "api design", "rest apis"],
        "category":    "method", "weight": 0.75, "learn_weeks": 2,
        "related":     {"graphql": 0.60, "microservices": 0.55},
        "implies":     [],
    },
    "microservices": {
        "aliases":     ["microservice", "service oriented", "soa"],
        "category":    "method", "weight": 0.82, "learn_weeks": 8,
        "related":     {"docker": 0.70, "kubernetes": 0.65, "kafka": 0.55,
                        "rest api": 0.65},
        "implies":     ["docker", "rest api"],
    },
    "system design": {
        "aliases":     ["systems design", "distributed system design"],
        "category":    "method", "weight": 0.88, "learn_weeks": 16,
        "related":     {"microservices": 0.65, "distributed systems": 0.80},
        "implies":     ["distributed systems"],
    },
    "distributed systems": {
        "aliases":     ["distributed computing"],
        "category":    "method", "weight": 0.85, "learn_weeks": 16,
        "related":     {"kafka": 0.60, "kubernetes": 0.55, "system design": 0.80},
        "implies":     [],
    },
    "algorithms": {
        "aliases":     ["data structures and algorithms", "dsa"],
        "category":    "method", "weight": 0.80, "learn_weeks": 12,
        "related":     {"data structures": 0.90, "system design": 0.55},
        "implies":     ["data structures"],
    },
    "data structures": {
        "aliases":     [],
        "category":    "method", "weight": 0.75, "learn_weeks": 10,
        "related":     {"algorithms": 0.90},
        "implies":     [],
    },
    "agile": {
        "aliases":     ["scrum", "kanban", "sprint", "jira"],
        "category":    "method", "weight": 0.60, "learn_weeks": 1,
        "related":     {"tdd": 0.40},
        "implies":     [],
    },
    "tdd": {
        "aliases":     ["test driven development", "bdd", "unit testing",
                        "jest", "pytest", "testing"],
        "category":    "method", "weight": 0.72, "learn_weeks": 3,
        "related":     {"agile": 0.40},
        "implies":     [],
    },
    "oop": {
        "aliases":     ["object oriented", "object-oriented programming",
                        "object oriented programming"],
        "category":    "method", "weight": 0.68, "learn_weeks": 4,
        "related":     {"design patterns": 0.70},
        "implies":     [],
    },
    # ── Specialised ───────────────────────────────────────────────
    "blockchain": {
        "aliases":     ["web3", "defi", "solidity", "smart contracts", "ethereum"],
        "category":    "domain", "weight": 0.85, "learn_weeks": 16,
        "related":     {"javascript": 0.45, "python": 0.35},
        "implies":     [],
    },
    "figma": {
        "aliases":     ["adobe xd", "sketch", "ui design"],
        "category":    "tool", "weight": 0.70, "learn_weeks": 3,
        "related":     {"css": 0.50, "html": 0.45},
        "implies":     [],
    },
    "llm": {
        "aliases":     ["large language models", "langchain", "rag",
                        "retrieval augmented generation", "openai api",
                        "hugging face", "transformers"],
        "category":    "domain", "weight": 0.90, "learn_weeks": 10,
        "related":     {"python": 0.80, "nlp": 0.75, "machine learning": 0.65,
                        "pytorch": 0.55},
        "implies":     ["python", "nlp"],
    },
    "selenium": {
        "aliases":     ["cypress", "playwright", "webdriver"],
        "category":    "tool", "weight": 0.72, "learn_weeks": 3,
        "related":     {"tdd": 0.55, "javascript": 0.45, "python": 0.40},
        "implies":     ["tdd"],
    },
}

# Build reverse alias map once at import time
ALIAS_MAP: dict[str, str] = {}
for _canonical, _data in SKILL_GRAPH.items():
    for _alias in _data.get("aliases", []):
        ALIAS_MAP[_alias.lower()] = _canonical

# ── IDF cache (populated lazily on first request) ─────────────────
_IDF_CACHE:  dict[str, float] = {}
_IDF_LOADED: bool = False

def _get_skill_idf(skill: str) -> float:
    global _IDF_CACHE, _IDF_LOADED
    if not _IDF_LOADED:
        _load_idf()
    return _IDF_CACHE.get(skill, 1.5)   # default: moderately rare

def _load_idf():
    global _IDF_CACHE, _IDF_LOADED
    try:
        total, counts = get_skills_for_idf()
        if total > 0:
            for skill, count in counts.items():
                _IDF_CACHE[skill] = math.log((total + 1) / (count + 1))
        _IDF_LOADED = True
        log.info(f"[IDF] loaded {len(_IDF_CACHE)} skill weights from {total} jobs")
    except Exception as e:
        log.warning(f"[IDF] failed to load — using defaults: {e}")
        _IDF_LOADED = True   # don't retry on every request


# ═══════════════════════════════════════════════════════════════════
# §2  ROLE FAMILIES  (title → canonical skill cluster)
# ═══════════════════════════════════════════════════════════════════

ROLE_FAMILIES: dict[str, list[str]] = {
    "frontend":    ["react", "typescript", "javascript", "css", "html", "next.js", "vue", "angular"],
    "backend":     ["python", "java", "node.js", "postgresql", "rest api", "docker", "redis"],
    "fullstack":   ["react", "node.js", "postgresql", "typescript", "docker", "rest api"],
    "devops":      ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux", "ansible"],
    "sre":         ["kubernetes", "linux", "prometheus", "docker", "python", "aws", "ci/cd"],
    "data":        ["python", "sql", "spark", "kafka", "airflow", "postgresql", "dbt"],
    "ml":          ["python", "machine learning", "tensorflow", "pytorch", "pandas", "numpy"],
    "ai":          ["python", "machine learning", "llm", "pytorch", "nlp", "deep learning"],
    "mobile":      ["react native", "flutter", "android", "ios", "kotlin", "swift"],
    "android":     ["android", "kotlin", "java", "rest api", "git"],
    "ios":         ["ios", "swift", "xcode", "rest api", "git"],
    "security":    ["linux", "python", "aws", "docker", "kubernetes", "ci/cd"],
    "qa":          ["selenium", "tdd", "python", "javascript", "ci/cd", "git"],
    "blockchain":  ["blockchain", "solidity", "javascript", "python", "node.js"],
    "embedded":    ["c++", "rust", "linux", "python", "git"],
    "database":    ["postgresql", "mysql", "mongodb", "redis", "sql", "elasticsearch"],
    "cloud":       ["aws", "gcp", "azure", "terraform", "kubernetes", "docker"],
}

def _role_family_skills(title: str) -> list[str]:
    tl = title.lower()
    # Multi-word matches first (more specific)
    for kw in ["full stack", "fullstack", "full-stack", "machine learning",
               "deep learning", "computer vision", "react native"]:
        if kw in tl:
            family = {
                "full stack": "fullstack", "fullstack": "fullstack",
                "full-stack": "fullstack", "machine learning": "ml",
                "deep learning": "ml", "computer vision": "ml",
                "react native": "mobile",
            }.get(kw)
            if family:
                return ROLE_FAMILIES.get(family, [])

    for family, keywords in [
        ("frontend",   ["frontend", "front-end", "front end", "ui developer", "ux developer"]),
        ("backend",    ["backend", "back-end", "back end", "server side", "api developer"]),
        ("devops",     ["devops", "dev ops", "platform engineer", "infrastructure"]),
        ("sre",        ["sre", "site reliability", "reliability engineer"]),
        ("data",       ["data engineer", "data pipeline", "etl"]),
        ("ml",         ["ml engineer", "machine learning", "data scientist"]),
        ("ai",         ["ai engineer", "llm", "generative"]),
        ("mobile",     ["mobile", "cross platform"]),
        ("android",    ["android"]),
        ("ios",        ["ios"]),
        ("security",   ["security", "appsec", "cybersecurity"]),
        ("qa",         ["qa ", "quality assurance", "test engineer", "sdet", "automation engineer"]),
        ("cloud",      ["cloud engineer", "cloud architect"]),
        ("embedded",   ["embedded", "firmware", "systems programmer"]),
    ]:
        if any(kw in tl for kw in keywords):
            return ROLE_FAMILIES.get(family, [])

    return []  # unknown family — no inference


# ═══════════════════════════════════════════════════════════════════
# §3  SENIORITY
# ═══════════════════════════════════════════════════════════════════

SENIORITY_SIGNALS: dict[str, int] = {
    "intern": 0, "internship": 0, "trainee": 0, "apprentice": 0,
    "fresher": 1, "graduate": 1, "entry": 1, "junior": 1, "jr": 1, "associate": 1,
    "mid": 2, "mid-level": 2, "intermediate": 2,
    "senior": 3, "sr": 3, "lead": 3,
    "principal": 4, "staff": 4, "architect": 4,
    "head": 5, "director": 5, "vp": 6, "cto": 6, "cpo": 6,
}

def _detect_seniority(text: str) -> int:
    tl = text.lower()
    # Longest match first for compound titles
    for signal in sorted(SENIORITY_SIGNALS, key=len, reverse=True):
        if re.search(r"\b" + re.escape(signal) + r"\b", tl):
            return SENIORITY_SIGNALS[signal]
    return 2  # default: mid-level


# ═══════════════════════════════════════════════════════════════════
# §4  DOMAIN ALIGNMENT
# ═══════════════════════════════════════════════════════════════════

DOMAIN_SIGNALS: dict[str, list[str]] = {
    "fintech":    ["fintech", "payments", "banking", "trading", "finance", "insurance",
                   "lending", "neobank", "wealth management"],
    "saas":       ["saas", "b2b", "enterprise software", "multi-tenant"],
    "ecommerce":  ["ecommerce", "e-commerce", "marketplace", "retail", "shopify"],
    "healthtech": ["health", "medical", "healthcare", "pharma", "biotech", "clinical"],
    "edtech":     ["edtech", "education", "e-learning", "learning platform"],
    "ai_ml":      ["ai", "artificial intelligence", "machine learning", "llm", "generative ai"],
    "gaming":     ["gaming", "game", "unity", "unreal"],
    "media":      ["media", "streaming", "content", "entertainment", "broadcast"],
    "security":   ["cybersecurity", "infosec", "security software"],
    "web3":       ["web3", "blockchain", "crypto", "defi", "nft"],
    "logistics":  ["logistics", "supply chain", "fleet", "delivery"],
}

def _infer_domain(text: str) -> str | None:
    tl = text.lower()
    for domain, signals in DOMAIN_SIGNALS.items():
        if any(s in tl for s in signals):
            return domain
    return None


# ═══════════════════════════════════════════════════════════════════
# §5  SECTION-AWARE RESUME PARSER
# ═══════════════════════════════════════════════════════════════════

_SECTION_HEADERS = {
    "skills": re.compile(
        r"^(technical\s+)?skills?(\s+&\s+\w+)?|^core\s+(competenc|skills)|"
        r"^tools?\s+(and\s+tech|&\s+tech)|^technologies|^tech\s+stack",
        re.I
    ),
    "experience": re.compile(
        r"^(work\s+)?experience|^professional\s+experience|"
        r"^employment(\s+history)?|^career(\s+history)?|^work\s+history",
        re.I
    ),
    "projects": re.compile(
        r"^projects?|^personal\s+projects?|^open[\s-]source|^portfolio",
        re.I
    ),
    "education": re.compile(
        r"^education|^academic(\s+background)?|^qualification|^degrees?",
        re.I
    ),
    "summary": re.compile(
        r"^(professional\s+)?(summary|profile|objective|about(\s+me)?)",
        re.I
    ),
    "certifications": re.compile(
        r"^certifications?|^awards?|^achievements?|^honors?|^courses?",
        re.I
    ),
}

_SECTION_CONFIDENCE = {
    "skills":          1.00,
    "experience":      0.90,
    "projects":        0.88,
    "certifications":  0.75,
    "education":       0.50,
    "summary":         0.40,   # aspirational — lower weight
    "unknown":         0.65,
}

def _split_sections(text: str) -> dict[str, str]:
    lines = text.splitlines()
    sections: dict[str, list[str]] = {}
    current = "unknown"

    for line in lines:
        stripped = line.strip()
        matched = None
        if stripped and len(stripped) < 60:  # section headers are short
            for sname, pattern in _SECTION_HEADERS.items():
                if pattern.match(stripped):
                    matched = sname
                    break
        if matched:
            current = matched
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(stripped)

    return {k: "\n".join(v) for k, v in sections.items()}


def _extract_skills_with_confidence(text: str) -> dict[str, float]:
    """
    Section-aware skill extraction.
    Returns {canonical_skill: confidence} where confidence ∈ [0, 1].
    Eliminates skills found only in aspirational/negation contexts.
    """
    sections = _split_sections(text)
    confidence_map: dict[str, float] = {}

    for section_name, section_text in sections.items():
        section_weight = _SECTION_CONFIDENCE.get(section_name, 0.65)
        tl = section_text.lower()

        # Aliases (longer first → avoid partial matches)
        for alias, canonical in sorted(ALIAS_MAP.items(), key=lambda x: -len(x[0])):
            pattern = r"(?<![a-z0-9\-])" + re.escape(alias) + r"(?![a-z0-9\-])"
            if re.search(pattern, tl):
                current = confidence_map.get(canonical, 0.0)
                confidence_map[canonical] = max(current, section_weight * 0.90)

        # Canonical names
        for canonical in SKILL_GRAPH:
            if canonical in confidence_map and confidence_map[canonical] >= section_weight:
                continue   # already recorded at higher confidence
            pattern = r"(?<![a-z0-9\-])" + re.escape(canonical) + r"(?![a-z0-9\-])"
            if re.search(pattern, tl):
                current = confidence_map.get(canonical, 0.0)
                confidence_map[canonical] = max(current, section_weight * 1.00)

    # Add implied skills at low confidence (0.35)
    direct = set(k for k, v in confidence_map.items() if v >= 0.65)
    for skill in list(direct):
        for implied in SKILL_GRAPH.get(skill, {}).get("implies", []):
            if implied not in confidence_map:
                confidence_map[implied] = 0.35

    # Filter: minimum meaningful confidence
    return {k: round(v, 3) for k, v in confidence_map.items() if v >= 0.38}


def _skills_list(confidence_map: dict[str, float], min_conf: float = 0.50) -> list[str]:
    """Return skills sorted by confidence desc, filtered to min_conf."""
    return [s for s, c in sorted(confidence_map.items(), key=lambda x: -x[1]) if c >= min_conf]


# ═══════════════════════════════════════════════════════════════════
# §6  EXPERIENCE YEAR COMPUTATION  (date arithmetic, not counters)
# ═══════════════════════════════════════════════════════════════════

_MONTH_MAP = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"]
)}
_PRESENT_RE = re.compile(r"\b(present|current|now|ongoing|today)\b", re.I)
_NOW = datetime.date.today()

def _parse_date(month_str: str | None, year_str: str) -> datetime.date:
    year  = int(year_str)
    month = _MONTH_MAP.get((month_str or "jan")[:3].lower(), 1)
    return datetime.date(year, month, 1)

def _compute_experience_years(text: str) -> int:
    # Pattern A: "Jan 2020 – Mar 2023" or "January 2020 to Present"
    pat_a = re.compile(
        r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*"
        r"[\s,./]+(\d{4})"
        r"\s*[–\-—/]+\s*"
        r"(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s,./]+(\d{4})"
        r"|(" + _PRESENT_RE.pattern + r"))",
        re.I
    )
    # Pattern B: "2019 – 2022" or "2021 - Present"
    pat_b = re.compile(
        r"(?<!\d)(\d{4})\s*[–\-—]+\s*(?:(\d{4})|(" + _PRESENT_RE.pattern + r"))",
        re.I
    )

    total_months = 0
    covered: list[tuple[datetime.date, datetime.date]] = []

    for m in pat_a.finditer(text.lower()):
        try:
            start = _parse_date(m.group(1), m.group(2))
            if m.group(5):  # present
                end = _NOW
            else:
                end = _parse_date(m.group(3), m.group(4))
            if start <= end:
                covered.append((start, end))
        except (ValueError, TypeError):
            pass

    # Pat B only for years not already covered
    for m in pat_b.finditer(text.lower()):
        try:
            start = datetime.date(int(m.group(1)), 1, 1)
            end   = _NOW if m.group(3) else datetime.date(int(m.group(2)), 12, 31)
            # Only add if not overlapping an already richer match
            if not any(abs((s - start).days) < 60 for s, _ in covered):
                covered.append((start, end))
        except (ValueError, TypeError):
            pass

    # Sum non-overlapping months
    covered.sort(key=lambda x: x[0])
    merged: list[tuple[datetime.date, datetime.date]] = []
    for start, end in covered:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))

    for start, end in merged:
        months = (end.year - start.year) * 12 + end.month - start.month
        total_months += max(0, months)

    if total_months > 0:
        return max(0, min(round(total_months / 12), 40))

    # Fallback: explicit statement
    m = re.search(r"(\d+)\+?\s+years?\s+of\s+(?:professional\s+)?experience", text, re.I)
    if m:
        return min(int(m.group(1)), 40)

    return 1   # genuinely unknown — don't fabricate


# ═══════════════════════════════════════════════════════════════════
# §7  NAME / EMAIL / EDUCATION  (improved)
# ═══════════════════════════════════════════════════════════════════

def _extract_email(text: str) -> str:
    m = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else ""

def _extract_name(text: str) -> str:
    """
    Improved: handles accented chars, pipe-separated headers, title prefixes.
    Scans first 15 non-empty lines only.
    """
    # Strip prefixes like "Dr.", "Mr.", "Ms.", "Prof."
    prefix_re = re.compile(r"^(dr|mr|mrs|ms|miss|prof)\.?\s+", re.I)
    # Valid name chars: letters, accented letters, hyphens, apostrophes, dots
    word_re = re.compile(r"^[\w\u00C0-\u017E'\-\.]+$", re.UNICODE)
    # Separators people use in headers
    sep_re = re.compile(r"[|•·\u2022/]")

    lines_checked = 0
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        lines_checked += 1
        if lines_checked > 15:
            break

        # Remove common header separators — take only first segment
        line = sep_re.split(line)[0].strip()
        if not line or "@" in line or "http" in line.lower():
            continue

        # Strip prefix
        line = prefix_re.sub("", line).strip()

        words = line.split()
        if 2 <= len(words) <= 4 and all(word_re.match(w) for w in words):
            return line

    return "Candidate"

def _extract_education(text: str) -> str:
    degrees = [
        (r"\bph\.?d\b", "PhD"),
        (r"\bm\.?tech\b|\bmaster[s]?\s+of\s+(engineering|technology)\b", "M.Tech"),
        (r"\bm\.?s\.?\b|\bmaster[s]?\s+of\s+science\b", "M.S."),
        (r"\bmba\b", "MBA"),
        (r"\bmca\b", "MCA"),
        (r"\bb\.?tech\b|\bbachelor[s]?\s+of\s+(engineering|technology)\b", "B.Tech"),
        (r"\bb\.?s\.?\b|\bbachelor[s]?\s+of\s+science\b", "B.S."),
        (r"\bbca\b", "BCA"),
        (r"\bb\.?e\.?\b|\bbachelor[s]?\s+of\s+engineering\b", "B.E."),
    ]
    for pattern, label in degrees:
        if re.search(pattern, text, re.I):
            return label
    return "Bachelor's"


# ═══════════════════════════════════════════════════════════════════
# §8  TRANSFER SCORING
# ═══════════════════════════════════════════════════════════════════

def _get_transfer_score(candidate_skill: str, required_skill: str) -> float:
    """
    Bidirectional: check both related dicts.
    Returns 0.0–1.0 transfer coefficient.
    """
    # Direct: required_skill's related map says how much candidate_skill transfers
    v1 = SKILL_GRAPH.get(required_skill, {}).get("related", {}).get(candidate_skill, 0.0)
    # Reverse: candidate_skill's related map (slightly penalised — less precise)
    v2 = SKILL_GRAPH.get(candidate_skill, {}).get("related", {}).get(required_skill, 0.0) * 0.85
    return max(v1, v2)

def _best_transfer(candidate_set: set[str], required_skill: str) -> float:
    return max((_get_transfer_score(cs, required_skill) for cs in candidate_set), default=0.0)


# ═══════════════════════════════════════════════════════════════════
# §9  TITLE FAMILY SIMILARITY
# ═══════════════════════════════════════════════════════════════════

def _title_similarity(target: str, job_title: str) -> float:
    t1 = set(re.findall(r"\b[a-z]{3,}\b", target.lower()))
    t2 = set(re.findall(r"\b[a-z]{3,}\b", job_title.lower()))
    if not t1 or not t2:
        return 0.5

    # Remove seniority words — match on role, not level
    stop = {"senior","junior","lead","principal","staff","associate","head","mid","entry"}
    t1 -= stop
    t2 -= stop

    if not t1 or not t2:
        return 0.6

    jaccard = len(t1 & t2) / len(t1 | t2)

    # Role-family bonus: if both titles map to same family
    fam1 = next((f for f, kws in ROLE_FAMILIES.items()
                 if any(k in target.lower() for k in [f, f.replace("_","")])), None)
    fam2 = next((f for f, kws in ROLE_FAMILIES.items()
                 if any(k in job_title.lower() for k in [f, f.replace("_","")])), None)
    family_bonus = 0.25 if fam1 and fam1 == fam2 else 0.0

    return min(1.0, jaccard + family_bonus)


# ═══════════════════════════════════════════════════════════════════
# §10  MULTI-SIGNAL JOB SCORER  (deterministic, no randomness)
# ═══════════════════════════════════════════════════════════════════

def _score_job(
    job: dict,
    candidate_confidence: dict[str, float],
    candidate_seniority: int,
    candidate_exp_years: int,
    target_title: str,
    candidate_domain: str | None,
) -> dict:

    job_skills_raw: list[str] = [s.lower() for s in (job.get("skills") or [])]
    candidate_set  = set(candidate_confidence.keys())

    # ── Component 1: IDF-weighted skill overlap  (weight 0.45) ────
    if job_skills_raw:
        total_idf = sum(
            _get_skill_idf(s) * SKILL_GRAPH.get(s, {}).get("weight", 0.80)
            for s in job_skills_raw
        )
        earned = 0.0
        matched_exact:   list[str] = []
        matched_partial: list[str] = []
        missing:         list[str] = []

        for js in job_skills_raw:
            idf_w = _get_skill_idf(js) * SKILL_GRAPH.get(js, {}).get("weight", 0.80)
            if js in candidate_set:
                conf = candidate_confidence[js]
                earned += idf_w * conf
                matched_exact.append(js)
            else:
                t = _best_transfer(candidate_set, js)
                if t >= 0.40:
                    earned += idf_w * t * 0.60   # partial credit, penalised
                    matched_partial.append(js)
                else:
                    missing.append(js)

        skill_overlap = min(earned / max(total_idf, 0.001), 1.0)

        # Catastrophic miss: ALL top-3 IDF skills absent → hard cap
        top3 = sorted(job_skills_raw, key=lambda s: -_get_skill_idf(s))[:3]
        if len(top3) >= 2 and sum(1 for s in top3 if s in candidate_set) == 0:
            skill_overlap *= 0.50

        data_completeness = min(len(job_skills_raw) / 6.0, 1.0)
    else:
        # No skills listed: fall back to title-only with low confidence
        skill_overlap    = 0.42
        matched_exact    = []
        matched_partial  = []
        missing          = []
        data_completeness = 0.25

    # ── Component 2: Seniority alignment  (weight 0.20) ──────────
    job_seniority  = _detect_seniority(job.get("title", ""))
    delta          = abs(candidate_seniority - job_seniority)
    if candidate_seniority < job_seniority:
        seniority_score = max(0.0, 1.0 - delta * 0.28)   # under-qualified: steep
    else:
        seniority_score = max(0.6, 1.0 - delta * 0.10)   # over-qualified: gentler

    # ── Component 3: Title family similarity  (weight 0.20) ──────
    title_score = _title_similarity(target_title, job.get("title", ""))

    # ── Component 4: Domain alignment  (weight 0.15) ─────────────
    job_domain_text = (job.get("company_domain") or "") + " " + (job.get("title") or "")
    job_domain      = _infer_domain(job_domain_text)
    if candidate_domain and job_domain:
        domain_score = 1.0 if candidate_domain == job_domain else 0.72
    else:
        domain_score = 0.80   # unknown — neutral

    # ── Final score ───────────────────────────────────────────────
    raw = (
        skill_overlap   * 0.45 +
        seniority_score * 0.20 +
        title_score     * 0.20 +
        domain_score    * 0.15
    )
    score      = max(5, min(98, int(round(raw * 100))))
    confidence = max(10, min(100, int(round(data_completeness * 100))))

    # ── Reason (explainable) ──────────────────────────────────────
    top_match = matched_exact[0] if matched_exact else None
    top_miss  = missing[0] if missing else None
    if score >= 80:
        reason = (f"Strong fit — you match {len(matched_exact)} core skills"
                  + (f" including {top_match}" if top_match else "") + ".")
    elif score >= 65:
        reason = (f"Good match on {len(matched_exact)} skills"
                  + (f"; closing the gap on {top_miss} would strengthen your application" if top_miss else "") + ".")
    elif score >= 45:
        reason = (f"Partial match — {len(missing)} key skills are missing"
                  + (f", notably {top_miss}" if top_miss else "") + ".")
    else:
        reason = ("Low overlap. This role needs skills you haven't demonstrated yet"
                  + (f" — {top_miss} is critical" if top_miss else "") + ".")

    verdict_map = [(80, "Strong Match"), (65, "Good Match"), (45, "Partial Match"), (0, "Weak Match")]
    verdict = next(v for threshold, v in verdict_map if score >= threshold)

    # ── Salary raw ────────────────────────────────────────────────
    salary_raw = job.get("salary_raw")
    if not salary_raw and job.get("salary_min"):
        lo = int(job["salary_min"])
        hi = int(job.get("salary_max") or lo)
        currency = job.get("salary_currency") or "INR"
        period   = job.get("salary_period") or "yearly"
        salary_raw = f"{lo:,}–{hi:,} {currency}/{period}"

    # ── Freshness decay ───────────────────────────────────────────
    # Stale jobs score slightly lower — they may already be filled
    scraped = job.get("scraped_at") or ""
    if scraped:
        try:
            scraped_date = datetime.date.fromisoformat(scraped[:10])
            days_old     = (_NOW - scraped_date).days
            if days_old > 30:
                decay = max(0.75, 1.0 - (days_old - 30) / 200)
                score = max(5, int(score * decay))
        except ValueError:
            pass

    all_matched = sorted(set(matched_exact + matched_partial),
                         key=lambda s: -candidate_confidence.get(s, 0.5))

    return {
        "title":          job.get("title", ""),
        "company":        job.get("company", ""),
        "location":       job.get("location", ""),
        "job_url":        job.get("job_url", "#"),
        "match_score":    score,
        "confidence":     confidence,
        "matched_skills": all_matched[:10],
        "missing_skills": missing[:8],
        "reason":         reason,
        "verdict":        verdict,
        "work_mode":      job.get("work_mode"),
        "salary_raw":     salary_raw,
        "company_domain": job.get("company_domain"),
        "source":         job.get("source"),
        "date_posted":    job.get("date_posted") or (scraped[:10] if scraped else None),
        # Score components — available for debugging / future UI
        "_components": {
            "skill_overlap":    int(skill_overlap * 100),
            "seniority_fit":    int(seniority_score * 100),
            "title_match":      int(title_score * 100),
            "domain_alignment": int(domain_score * 100),
            "data_confidence":  confidence,
        },
    }


# ═══════════════════════════════════════════════════════════════════
# §11  RESUME FEEDBACK  (section-aware scoring)
# ═══════════════════════════════════════════════════════════════════

def _resume_feedback(
    text: str,
    skill_confidence: dict[str, float],
    exp_years: int,
) -> dict:
    sections = _split_sections(text)

    # High-confidence skills: actually demonstrated, not aspirational
    proven_skills = _skills_list(skill_confidence, min_conf=0.80)
    claimed_skills = _skills_list(skill_confidence, min_conf=0.38)

    score = 50

    # Contact completeness
    if _extract_email(text):              score += 8
    if re.search(r"\+?\d[\d\s\-]{7,}\d", text): score += 4

    # Skills in dedicated skills section (ATS reads this first)
    if "skills" in sections and len(proven_skills) >= 5:
        score += 15
    elif len(proven_skills) >= 3:
        score += 8

    # Quantified impact in experience section
    exp_text = sections.get("experience", "")
    qty_hits  = len(re.findall(
        r"\d+\s*%|\d+x|\$[\d,]+|₹[\d,]+|"
        r"\d+\s*(users?|customers?|engineers?|team members?|projects?|ms\b|seconds?|requests?|rps)",
        exp_text, re.I
    ))
    score += min(qty_hits * 4, 18)

    # Action verbs (diversity matters — count distinct)
    ACTION_VERBS = {"led","built","designed","developed","implemented","optimised",
                    "optimized","launched","scaled","reduced","increased","delivered",
                    "architected","managed","shipped","migrated","refactored","automated",
                    "deployed","integrated","owned","drove","created","established"}
    found_verbs = {v for v in ACTION_VERBS
                   if re.search(r"\b" + v + r"\b", text, re.I)}
    score += min(len(found_verbs) * 2, 12)

    # Portfolio / social proof
    if re.search(r"github\.com|gitlab\.com|portfolio|bitbucket\.org", text, re.I):
        score += 5

    # Professional summary present
    if "summary" in sections and len(sections["summary"].split()) >= 20:
        score += 4

    # Resume length (substance without padding)
    wc = len(text.split())
    if 350 < wc < 1000:  score += 5
    elif wc >= 1000:      score += 2   # verbose — not necessarily better
    elif wc < 200:        score -= 8

    score = max(10, min(97, score))

    # ── Build feedback lists ──────────────────────────────────────
    strengths    = []
    suggestions  = []
    ats_tips     = []

    if len(proven_skills) >= 8:
        strengths.append(f"Strong technical breadth — {len(proven_skills)} verified skills across experience and projects.")
    elif len(proven_skills) >= 4:
        strengths.append(f"Core skills ({', '.join(proven_skills[:4])}) are well-evidenced in your experience section.")

    if exp_years >= 4:
        strengths.append(f"{exp_years} years of experience puts you in the mid-to-senior candidate pool for most roles.")
    elif exp_years >= 1:
        strengths.append("Work experience is included — ensure each role has 3–5 achievement-focused bullets.")

    if qty_hits >= 4:
        strengths.append(f"Quantified impact with {qty_hits} measurable results — this is what separates top resumes.")
    if len(found_verbs) >= 6:
        strengths.append(f"Strong action vocabulary ({len(found_verbs)} distinct verbs) — bullets read as results-driven.")
    if re.search(r"github\.com", text, re.I):
        strengths.append("GitHub profile linked — gives recruiters immediate proof of your work.")

    if not strengths:
        strengths.append("Resume submitted — focus on the improvements below to reach the top 10% of applicants.")

    # Suggestions (specific, prioritised)
    if qty_hits < 3:
        suggestions.append(
            "Add numbers to at least 3 work bullets: 'reduced API latency by 40%', "
            "'onboarded 12 engineers', 'scaled service to 1M requests/day'. "
            "This single change raises ATS and recruiter scores significantly."
        )
    if len(found_verbs) < 4:
        suggestions.append("Start every bullet with a strong action verb: Built, Led, Architected, Reduced, Launched.")
    if "skills" not in sections or len(proven_skills) < 5:
        suggestions.append(
            "Add a dedicated 'Technical Skills' section near the top listing 8–12 skills. "
            "ATS systems scan this section first before reading experience."
        )
    if "summary" not in sections:
        suggestions.append(
            "Add a 2-line professional summary tailored to your target role. "
            "Example: 'Backend engineer with 4 years building distributed systems in Python and Go. "
            "Focused on high-throughput APIs and data pipelines.'"
        )
    if not re.search(r"github\.com|portfolio|gitlab\.com", text, re.I):
        suggestions.append("Include your GitHub or portfolio URL — it's the fastest way to prove skills without adding more text.")
    if wc < 300:
        suggestions.append("Resume is too brief. Expand each role to 3–5 bullet points focused on what you built and its impact.")

    # ATS tips
    ats_tips.append(
        "Use standard section headers exactly: 'Experience', 'Education', 'Skills', 'Projects'. "
        "Creative labels like 'My Journey' are invisible to ATS parsers."
    )
    ats_tips.append(
        "Single-column layout only. Two-column resumes parsed by ATS often lose half the content."
    )
    if len(claimed_skills) > len(proven_skills) + 4:
        ats_tips.append(
            f"You have {len(claimed_skills) - len(proven_skills)} skills mentioned only in your summary "
            "but not evidenced in experience. ATS systems weight skills lower when they only appear in objectives."
        )
    ats_tips.append("Avoid tables, text boxes, and graphics — ATS parsers skip them entirely.")
    ats_tips.append(
        "Mirror the exact skill names from job descriptions. If a job says 'PostgreSQL', "
        "ensure your resume says 'PostgreSQL' not just 'SQL databases'."
    )

    return {
        "overall_score": score,
        "strengths":     strengths[:4],
        "suggestions":   suggestions[:4],
        "ats_tips":      ats_tips[:4],
    }


# ═══════════════════════════════════════════════════════════════════
# §12  ROUTES
# ═══════════════════════════════════════════════════════════════════

@analyse_bp.post("/api/upload")
def upload():
    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400

    file      = request.files["resume"]
    job_title = request.form.get("job_title", "Software Engineer").strip()
    location  = request.form.get("location", "").strip()

    try:
        pdf_bytes = file.read()
        parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    parts.append(t)
        text = "\n".join(parts)
    except Exception as e:
        return jsonify({"error": f"Failed to parse PDF: {e}"}), 400

    if not text.strip():
        return jsonify({"error": "Could not extract text. Ensure the PDF is not a scanned image."}), 400

    # ── Profile extraction ────────────────────────────────────────
    skill_confidence = _extract_skills_with_confidence(text)
    skills_list      = _skills_list(skill_confidence, min_conf=0.50)
    exp_years        = _compute_experience_years(text)
    seniority        = _detect_seniority(text + " " + job_title)
    candidate_domain = _infer_domain(text)

    profile = {
        "name":             _extract_name(text),
        "email":            _extract_email(text),
        "skills":           skills_list,
        "experience_years": exp_years,
        "education":        _extract_education(text),
        "target_role":      job_title,
    }

    # ── Fetch jobs from DB ────────────────────────────────────────
    # Broad fetch — let the scorer rank, not the DB filter
    db_filters: dict = {"keywords": job_title, "limit": 120, "offset": 0}
    if location:
        db_filters["location"] = location

    raw_jobs = search_jobs(db_filters)

    # Fallback: skill-only search if keyword search is too narrow
    if len(raw_jobs) < 10 and skills_list:
        raw_jobs = search_jobs({"skills": skills_list[:10], "limit": 120})

    # Second fallback: broad unfiltered
    if not raw_jobs:
        raw_jobs = search_jobs({"limit": 80})

    # ── Score and rank ────────────────────────────────────────────
    # Augment candidate skills with role-family inferred skills for title matching
    role_skills = _role_family_skills(job_title)
    augmented_confidence = dict(skill_confidence)
    for rs in role_skills:
        if rs not in augmented_confidence:
            augmented_confidence[rs] = 0.0   # present in profile context but not extracted

    scored = [
        _score_job(j, skill_confidence, seniority, exp_years, job_title, candidate_domain)
        for j in raw_jobs
    ]
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    matches = scored[:20]

    # ── Resume feedback ───────────────────────────────────────────
    feedback = _resume_feedback(text, skill_confidence, exp_years)

    return jsonify({
        "success": True,
        "data": {
            "profile":     profile,
            "matches":     matches,
            "feedback":    feedback,
            "resume_text": text,   # full text — strategy engine needs it
        },
    })


# ─────────────────────────────────────────────────────────────────
# §13  STRATEGY  (ROI-ordered, deterministic)
# ─────────────────────────────────────────────────────────────────

def _roi_ordered_skills(
    missing: list[str],
    candidate_set: set[str],
    market_data: dict[str, dict],
) -> list[dict]:
    results = []
    for skill in missing:
        md          = market_data.get(skill, {})
        job_count   = md.get("job_count", 1)
        salary      = md.get("median_salary", 0)
        base_weeks  = SKILL_GRAPH.get(skill, {}).get("learn_weeks", 8)

        # Discount learning time if candidate has transferable skills
        best_t = _best_transfer(candidate_set, skill)
        adj_weeks = max(0.5, base_weeks * (1.0 - best_t * 0.55))

        roi = (job_count * 0.6 + salary * 0.00008) / max(adj_weeks, 0.5)

        # Importance: based on IDF weight + job count, not positional
        idf_w = _get_skill_idf(skill)
        graph_w = SKILL_GRAPH.get(skill, {}).get("weight", 0.80)
        if idf_w >= 2.0 and graph_w >= 0.90 and job_count >= 30:
            importance = "critical"
        elif job_count >= 15 or graph_w >= 0.85:
            importance = "important"
        else:
            importance = "nice-to-have"

        context_parts = [f"Required in {job_count} active jobs."]
        if best_t >= 0.40:
            transfer_from = next(
                (cs for cs in candidate_set if _get_transfer_score(cs, skill) >= best_t - 0.05),
                None
            )
            if transfer_from:
                context_parts.append(
                    f"Your {transfer_from} experience transfers at {int(best_t*100)}% — "
                    f"estimated {adj_weeks:.0f} weeks (not {base_weeks})."
                )
        else:
            context_parts.append(f"Estimated {base_weeks} weeks to reach productive proficiency.")

        results.append({
            "skill":        skill,
            "importance":   importance,
            "roi_score":    round(roi, 2),
            "jobs_unlocked": job_count,
            "learn_weeks":  round(adj_weeks, 1),
            "context":      " ".join(context_parts),
        })

    results.sort(key=lambda x: -x["roi_score"])
    return results


_INTERVIEW_BANK: list[dict] = [
    {
        "likely_question": "Tell me about yourself.",
        "why_they_ask":    "Tests communication clarity and whether your career narrative is coherent and relevant.",
        "how_to_answer":   "Present–Past–Future: current skills/role → how you built them → why this role excites you. Keep it under 90 seconds.",
    },
    {
        "likely_question": "Why do you want to work at {company}?",
        "why_they_ask":    "Filters out mass-applicants. They want evidence of genuine interest, not template answers.",
        "how_to_answer":   "Reference something specific: a product, engineering blog post, or business model. Tie it to a concrete reason it aligns with your goals.",
    },
    {
        "likely_question": "Describe the most complex system you have built.",
        "why_they_ask":    "Assesses depth of engineering experience, trade-off reasoning, and ability to communicate technical decisions.",
        "how_to_answer":   "Use: Problem → Constraints → Design choices → Trade-offs → Outcome. Mention scale (users, RPS, data volume) and what you would do differently now.",
    },
    {
        "likely_question": "How do you handle disagreement with a technical decision?",
        "why_they_ask":    "Tests collaboration, ego management, and whether you can influence without authority.",
        "how_to_answer":   "Describe a real situation. Show you raised the concern with data, understood the other view, and either changed your mind or escalated respectfully.",
    },
    {
        "likely_question": "Where do you see yourself in 3 years?",
        "why_they_ask":    "Checks if your trajectory aligns with what this role and company can offer — and whether you will stay.",
        "how_to_answer":   "Be genuine but company-aligned. Show ambition (technical depth or leadership) that this specific role can enable.",
    },
]

def _skill_interview_question(skill: str, company: str) -> dict:
    return {
        "likely_question": f"Walk me through a project where you used {skill} in production.",
        "why_they_ask":    f"{company} listed {skill} as a requirement. They need to verify real depth, not just awareness.",
        "how_to_answer":   (
            f"Choose your best {skill} project. Structure: what problem it solved, "
            f"why you chose {skill}, what you built specifically, the scale/outcome, "
            "and one technical decision you made (and why). Avoid vague summaries."
        ),
    }


@analyse_bp.post("/api/strategy")
def strategy():
    body        = request.get_json(silent=True) or {}
    resume_text = body.get("resume_text", "")
    job         = body.get("job", {})

    if not job.get("title"):
        return jsonify({"error": "job.title is required"}), 400

    title   = job.get("title", "")
    company = job.get("company", "the company")

    # Extract skills from resume text
    skill_confidence = _extract_skills_with_confidence(resume_text) if resume_text else {}
    candidate_set    = set(skill_confidence.keys())
    candidate_seniority = _detect_seniority(resume_text + " " + title)

    # Job's required skills: from role family + any passed in job object
    role_required = _role_family_skills(title)
    job_skills    = list(dict.fromkeys(role_required))   # deduplicated, order preserved

    # Compute match
    matched = [s for s in job_skills if s in candidate_set]
    missing_skills_raw = [s for s in job_skills if s not in candidate_set]

    # Score
    if job_skills:
        total_idf = sum(_get_skill_idf(s) * SKILL_GRAPH.get(s, {}).get("weight", 0.8) for s in job_skills)
        earned    = sum(
            _get_skill_idf(s) * SKILL_GRAPH.get(s, {}).get("weight", 0.8) * skill_confidence.get(s, 0.85)
            for s in matched
        )
        # Partial credit for transferable skills
        for ms in missing_skills_raw:
            t = _best_transfer(candidate_set, ms)
            if t >= 0.40:
                earned += _get_skill_idf(ms) * SKILL_GRAPH.get(ms, {}).get("weight", 0.8) * t * 0.60
        match_score = max(10, min(97, int(round((earned / max(total_idf, 0.001)) * 100))))
    else:
        match_score = 50   # unknown role — neutral

    # Seniority alignment
    job_seniority = _detect_seniority(title)
    s_delta = abs(candidate_seniority - job_seniority)
    if candidate_seniority < job_seniority:
        match_score = int(match_score * max(0.65, 1.0 - s_delta * 0.15))

    # Market data from IDF cache
    market_data = {
        skill: {
            "job_count":     max(1, int(math.exp(max(0, 3.5 - _get_skill_idf(skill))) * 10)),
            "median_salary": 0,
        }
        for skill in (job_skills + list(candidate_set))
    }

    # Priority
    if match_score >= 78:
        priority = "apply_now"
        p_reason = f"Your profile strongly aligns with {title} at {company}. Apply now — good matches move fast."
    elif match_score >= 55:
        priority = "apply_after_improvements"
        p_reason = (
            f"Close. Address the top 1–2 skill gaps below and rewrite 2 bullets with metrics. "
            f"That should push your match above 80% for {company}."
        )
    else:
        priority = "long_term_goal"
        p_reason = (
            f"Significant gaps exist for {title} at {company}. "
            "Prioritise the 'Learn first' actions below — revisit in 6–8 weeks."
        )

    # Summary
    summary = (
        f"Your resume demonstrates {len(matched)} of {len(job_skills)} required skills for {title} at {company}. "
        + (f"Core strengths: {', '.join(matched[:3])}. " if matched else "")
        + (f"Primary gaps: {', '.join(missing_skills_raw[:3])}." if missing_skills_raw else "No critical skill gaps detected.")
    )

    # Strengths
    strengths = []
    if matched:
        strengths.append(f"Demonstrated proficiency in {matched[0]} — a primary requirement for this role.")
    if len(matched) >= 3:
        strengths.append(f"Coverage across {', '.join(matched[1:4])} shows the breadth {company} looks for.")
    if candidate_seniority >= job_seniority:
        strengths.append("Your seniority level is aligned with (or exceeds) what this role requires.")
    strengths.append(
        "Hands-on project experience is valued — ensure your best work is visible and linked."
    )

    # ROI-ordered missing skills
    roi_skills = _roi_ordered_skills(missing_skills_raw, candidate_set, market_data)

    # Improvement actions (specific, not generic)
    actions = []
    if roi_skills:
        top_skill = roi_skills[0]
        actions.append({
            "type":   "skill_to_learn",
            "action": (
                f"Learn {top_skill['skill']} first — "
                f"highest ROI at ~{top_skill['learn_weeks']} weeks. "
                f"{top_skill['context']} "
                "Build one deployable project with it and push to GitHub before applying."
            ),
            "impact": "high",
        })
    if len(roi_skills) > 1:
        s2 = roi_skills[1]
        actions.append({
            "type":   "project_to_build",
            "action": (
                f"Build a small project combining {roi_skills[0]['skill']} + {s2['skill']}. "
                "End-to-end matters more than polish — deploy it and write a 3-line README explaining what it does."
            ),
            "impact": "high",
        })
    actions.append({
        "type":   "resume_edit",
        "action": (
            f"Rewrite your top 2 work experience bullets for {title} alignment. "
            "Format: [Action verb] + [what you built] + [measurable outcome]. "
            "Example: 'Reduced API p99 latency by 38% by migrating synchronous calls to a Kafka event queue.'"
        ),
        "impact": "high",
    })
    actions.append({
        "type":   "resume_edit",
        "action": (
            f"Add a 2-line summary at the top of your resume targeting {title} at {company} specifically. "
            f"Mention your strongest 2 matched skills ({', '.join(matched[:2]) if matched else 'core skills'}) and years of experience."
        ),
        "impact": "medium",
    })
    actions.append({
        "type":   "skill_to_learn",
        "action": (
            f"Research {company}'s engineering blog, GitHub repos, or recent job postings. "
            "Identify the exact tools they use and verify they appear in your resume using their exact names."
        ),
        "impact": "medium",
    })

    # Interview tips
    tips = [
        {
            "likely_question": q["likely_question"].replace("{company}", company),
            "why_they_ask":    q["why_they_ask"],
            "how_to_answer":   q["how_to_answer"].replace("{company}", company),
        }
        for q in _INTERVIEW_BANK[:4]
    ]
    if matched:
        tips.append(_skill_interview_question(matched[0], company))
    if len(matched) > 1:
        tips.append(_skill_interview_question(matched[1], company))

    # Format missing_skills for frontend (MissingSkill type)
    missing_skills_out = [
        {"skill": s["skill"], "importance": s["importance"], "context": s["context"]}
        for s in roi_skills[:6]
    ]

    return jsonify({"success": True, "data": {
        "match_score":          match_score,
        "match_summary":        summary,
        "strengths":            strengths,
        "missing_skills":       missing_skills_out,
        "improvement_actions":  actions,
        "interview_tips":       tips,
        "application_priority": priority,
        "priority_reason":      p_reason,
    }})


# ─────────────────────────────────────────────────────────────────
# §14  COLD EMAIL
# ─────────────────────────────────────────────────────────────────

_EMAIL_TEMPLATES = [
    """\
Subject: {title} — {name}

Hi [Hiring Manager's Name],

I came across the {title} role at {company} and it's the kind of opportunity I've been looking for.

I bring hands-on experience in {skill1} and {skill2} — both central to this position. {value_prop}

I'd appreciate a 15-minute conversation to explore whether there's a mutual fit. Resume attached.

Best,
{name}\
""",
    """\
Subject: {title} Application — {name}

Hi [Hiring Manager],

Your posting for {title} caught my attention immediately. The combination of {skill1} and {domain} work is exactly the problem space I want to be in.

{value_prop} I'm confident I can contribute meaningfully from day one.

Open to a quick call this week or next — whichever works for you.

{name}\
""",
]

_DOMAIN_LABELS = {
    "frontend": "frontend engineering", "backend": "backend systems",
    "data": "data infrastructure", "ml": "machine learning",
    "devops": "platform and infrastructure", "mobile": "mobile development",
    "fullstack": "full-stack development", "cloud": "cloud engineering",
    "ai": "AI/LLM engineering",
}

@analyse_bp.post("/api/email")
def cold_email():
    body            = request.get_json(silent=True) or {}
    job             = body.get("job", {})
    matched_skills  = body.get("matched_skills", [])
    profile_summary = body.get("profile_summary", "")

    title   = job.get("title", "Software Engineer")
    company = job.get("company", "your company")

    name = body.get("candidate_name", "").strip()
    if not name:
        name_m = re.match(r"^([A-Za-z\u00C0-\u017E '\-]+),", profile_summary)
        name   = name_m.group(1).strip() if name_m else "Your Name"

    skill1 = matched_skills[0] if matched_skills else "software engineering"
    skill2 = matched_skills[1] if len(matched_skills) > 1 else "system design"

    domain = _infer_domain(title) or "technology"
    domain_label = _DOMAIN_LABELS.get(domain, domain)

    value_prop = (
        f"Most recently, I built production {skill1} systems handling real user traffic — "
        "I focus on correctness, performance, and maintainability in equal measure."
        if skill1 != "software engineering"
        else "I focus on writing clean, well-tested code that teams can build on."
    )

    # Deterministic template selection based on company name hash
    template = _EMAIL_TEMPLATES[abs(hash(company)) % len(_EMAIL_TEMPLATES)]
    email_text = template.format(
        title=title, company=company, name=name,
        skill1=skill1, skill2=skill2,
        domain=domain_label, value_prop=value_prop,
    )

    return jsonify({"success": True, "data": {"email": email_text}})


# ─────────────────────────────────────────────────────────────────
# §15  LINKEDIN POST
# ─────────────────────────────────────────────────────────────────

_LINKEDIN_TEMPLATES = {
    "professional": """\
I'm currently exploring {role} opportunities and would love to connect with engineering teams building in {domain}.

With {exp} years of hands-on experience across {skills_str}, I've contributed to production systems used by real people — not just side projects. My focus is on clean architecture, fast iteration, and working closely with product teams.

If your team is hiring in this space, or you know someone who is, I'd appreciate an introduction or a quick conversation.

📩 Open to full-time | {location_str}

#OpenToWork #{role_tag} #SoftwareEngineering\
""",
    "authentic": """\
After {exp} years of building things I'm genuinely proud of, I'm ready for my next challenge.

I've worked across {skills_str} — in production, at scale, with real deadlines. I've learned that the engineers who create the most impact aren't just technically strong — they communicate clearly, unblock teammates, and keep shipping even when things get messy.

I'm looking for a {role} role at a team that takes engineering quality seriously.

If you're building something interesting and want to talk — my inbox is open 🙏

{location_str} | Open to remote & hybrid

#JobSearch #{role_tag} #OpenToWork\
""",
    "bold": """\
I'm available now. Looking for a {role} role. Here's why you should reach out.

✅ {exp} years building production-grade software
✅ Deep hands-on with {skills_str}
✅ I ship fast, I care about quality, and I own my work end-to-end

I'm not looking for just any job. I want a team that builds real things and holds a high bar for engineering.

If that's you — send me a message. Let's skip the preamble.

{location_str} | Available immediately

#{role_tag} #Hiring #OpenToWork\
""",
}

@analyse_bp.post("/api/linkedin")
def linkedin():
    body    = request.get_json(silent=True) or {}
    profile = body.get("profile", {})
    tone    = body.get("tone", "authentic")

    role     = profile.get("target_role", "Software Engineer")
    skills   = profile.get("skills", [])
    exp      = profile.get("experience_years", 2)
    location = profile.get("location", "")

    domain       = _infer_domain(role + " " + " ".join(skills[:6])) or "software engineering"
    domain_label = _DOMAIN_LABELS.get(domain, "software engineering")
    skills_str   = ", ".join(skills[:4]) if skills else "full-stack development"
    role_tag     = re.sub(r"[^a-zA-Z0-9]", "", role.title())
    location_str = f"📍 {location}" if location else "📍 Remote-friendly / Open to relocation"

    template = _LINKEDIN_TEMPLATES.get(tone, _LINKEDIN_TEMPLATES["authentic"])
    post = template.format(
        role=role, skills_str=skills_str, exp=exp,
        domain=domain_label, location_str=location_str, role_tag=role_tag,
    )

    return jsonify({"success": True, "data": {"post": post}})
