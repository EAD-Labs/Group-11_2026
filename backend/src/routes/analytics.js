const express = require('express');
const router = express.Router();
const analyticsTools = require('../services/analyticsTools');

// GET /api/analytics/school-performance?year=2020
router.get('/school-performance', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year) {
      return res.status(400).json({ error: 'Missing or invalid year parameter' });
    }

    const schoolAverages = await analyticsTools.getSchoolAverages(year);
    const csSchoolAverages = await analyticsTools.getCSSchoolAverages(year);

    res.json({
      schoolAverages,
      csSchoolAverages
    });
  } catch (err) {
    console.error('Error fetching school performance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/overall?year=2020&subject=Maths
router.get('/assessments/overall', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    const subject = req.query.subject;
    if (!year || !subject) {
      return res.status(400).json({ error: 'Missing year or subject parameter' });
    }

    const overallScore = await analyticsTools.getOverallScoreAnalytics(year, subject);
    res.json(overallScore);
  } catch (err) {
    console.error('Error fetching overall score analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/oral?classLevel=3
router.get('/assessments/oral', async (req, res) => {
  try {
    const classLevel = req.query.classLevel;
    if (!classLevel) {
      return res.status(400).json({ error: 'Missing classLevel parameter' });
    }

    const oralAnalytics = await analyticsTools.getOralAssessmentAnalytics(classLevel);
    res.json(oralAnalytics);
  } catch (err) {
    console.error('Error fetching oral assessment analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/written?classLevel=3&subject=Maths
router.get('/assessments/written', async (req, res) => {
  try {
    const classLevel = req.query.classLevel;
    const subject = req.query.subject;
    if (!classLevel || !subject) {
      return res.status(400).json({ error: 'Missing classLevel or subject parameter' });
    }

    const writtenAnalytics = await analyticsTools.getWrittenAssessmentAnalytics(classLevel, subject);
    res.json(writtenAnalytics);
  } catch (err) {
    console.error('Error fetching written assessment analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

