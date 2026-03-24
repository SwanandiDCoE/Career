require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');

const uploadRoutes   = require('./routes/upload.routes');
const jobRoutes      = require('./routes/job.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const aiRoutes       = require('./routes/ai.routes');
const errorHandler   = require('./middleware/errorHandler');
const logger         = require('./utils/logger');

// ── Ensure uploads directory exists ──────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ─────────────────────────────────────────────
app.use(helmet());

// ── HTTP Request Logging ─────────────────────────────────────────
app.use(morgan('dev'));

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'careerpilot-backend',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    mode:      process.env.NODE_ENV || 'development',
    ai_enabled: process.env.USE_AI === 'true',
    jobs_live:  process.env.USE_LIVE_JOBS === 'true',
  });
});

// ── API Routes ───────────────────────────────────────────────────
app.use('/api/upload',   uploadRoutes);   // POST /api/upload
app.use('/api/jobs',     jobRoutes);      // GET  /api/jobs  |  POST /api/job-match
app.use('/api/feedback', feedbackRoutes); // POST /api/feedback
app.use('/api',          aiRoutes);       // POST /api/linkedin  |  POST /api/email

// ── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`CareerPilot backend  →  http://localhost:${PORT}`);
  logger.info(`AI mode              →  ${process.env.USE_AI === 'true' ? 'OpenAI (live)' : 'Dummy data'}`);
  logger.info(`Jobs mode            →  ${process.env.USE_LIVE_JOBS === 'true' ? 'JobSpy (live)' : 'Dummy data'}`);
});

module.exports = app; // for testing
