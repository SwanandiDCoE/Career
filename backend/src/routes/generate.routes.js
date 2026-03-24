const express = require('express');
const router = express.Router();
const generateController = require('../controllers/generate.controller');

// POST /api/generate/cold-email
router.post('/cold-email', generateController.coldEmail);

// POST /api/generate/linkedin-post
router.post('/linkedin-post', generateController.linkedInPost);

module.exports = router;
