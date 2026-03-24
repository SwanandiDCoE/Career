from flask import Blueprint, request, jsonify
from app.services.job_scraper import scrape_jobs

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.post('/fetch-jobs')
def fetch_jobs():
    """
    POST /fetch-jobs
    Body: { job_title, location, results_wanted? }
    Returns: { jobs: [...] }
    """
    data = request.get_json()

    if not data or not data.get('job_title'):
        return jsonify({'error': 'job_title is required'}), 400

    job_title = data['job_title']
    location  = data.get('location', 'Remote')
    results   = int(data.get('results_wanted', 20))

    try:
        jobs = scrape_jobs(job_title, location, results)
        return jsonify({'jobs': jobs, 'count': len(jobs)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
