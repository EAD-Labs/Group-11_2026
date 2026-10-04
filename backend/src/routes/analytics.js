const express = require('express');
const router = express.Router();
const analyticsTools = require('../services/analyticsTools');
const { rbacMiddleware, maskData } = require('../middleware/rbac');

const VALID_SUBJECTS = ['Maths', 'English', 'Tamil', 'CS'];
const VALID_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8'];

function sanitizeYear(year) {
  const parsed = parseInt(year, 10);
  const maxYear = new Date().getFullYear() + 1;
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 2015 || parsed > maxYear) {
    return null;
  }
  return parsed;
}

function sanitizeSubject(subj) {
  if (typeof subj !== 'string') return null;
  const clean = subj.trim();
  const match = VALID_SUBJECTS.find(s => s.toLowerCase() === clean.toLowerCase());
  return match || null;
}

function sanitizeClassLevel(cls) {
  if (typeof cls === 'number') cls = String(cls);
  if (typeof cls !== 'string') return null;
  const clean = cls.replace(/[^0-9]/g, '');
  return VALID_CLASSES.includes(clean) ? clean : null;
}

// Enforce strict authentication on all analytics routes
router.use(rbacMiddleware({ required: true }));

// GET /api/analytics/school-performance?year=2020
router.get('/school-performance', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    if (!year) {
      return res.status(400).json({ error: 'Invalid or out-of-range year parameter. Must be between 2015 and current year.' });
    }

    const schoolAverages = await analyticsTools.getSchoolAverages(year, req.userScope);
    const csSchoolAverages = await analyticsTools.getCSSchoolAverages(year, req.userScope);

    res.json(maskData({
      schoolAverages,
      csSchoolAverages
    }, req.userScope));
  } catch (err) {
    console.error('Error fetching school performance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/overall?year=2020&subject=Maths
router.get('/assessments/overall', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const subject = sanitizeSubject(req.query.subject);
    if (!year || !subject) {
      return res.status(400).json({ error: 'Invalid year or subject parameter. Allowed subjects: Maths, English, Tamil, CS.' });
    }

    const overallScore = await analyticsTools.getOverallScoreAnalytics(year, subject, req.userScope);
    res.json(maskData(overallScore, req.userScope));
  } catch (err) {
    console.error('Error fetching overall score analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/oral?classLevel=3
router.get('/assessments/oral', async (req, res) => {
  try {
    const classLevel = sanitizeClassLevel(req.query.classLevel);
    if (!classLevel) {
      return res.status(400).json({ error: 'Invalid classLevel parameter. Must be between 1 and 8.' });
    }

    const oralAnalytics = await analyticsTools.getOralAssessmentAnalytics(classLevel, req.userScope);
    res.json(maskData(oralAnalytics, req.userScope));
  } catch (err) {
    console.error('Error fetching oral assessment analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/written?classLevel=3&subject=Maths
router.get('/assessments/written', async (req, res) => {
  try {
    const classLevel = sanitizeClassLevel(req.query.classLevel);
    const subject = sanitizeSubject(req.query.subject);
    if (!classLevel || !subject) {
      return res.status(400).json({ error: 'Invalid classLevel or subject parameter.' });
    }

    const writtenAnalytics = await analyticsTools.getWrittenAssessmentAnalytics(classLevel, subject, req.userScope);
    res.json(maskData(writtenAnalytics, req.userScope));
  } catch (err) {
    console.error('Error fetching written assessment analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/gender?year=2020&subject=Maths
router.get('/influences/gender', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const subject = sanitizeSubject(req.query.subject);
    if (!year || !subject) {
      return res.status(400).json({ error: 'Missing or invalid year/subject parameter.' });
    }
    const data = await analyticsTools.getGenderPerformance(year, subject, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching gender performance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/medium?year=2020
router.get('/influences/medium', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    if (!year) return res.status(400).json({ error: 'Missing or invalid year parameter.' });
    const data = await analyticsTools.getMediumComparison(year, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching medium comparison:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/parent-education?relation=mother&year=2020
router.get('/influences/parent-education', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const relation = req.query.relation === 'father' ? 'father' : 'mother';
    if (!year) return res.status(400).json({ error: 'Missing or invalid year parameter.' });
    const data = await analyticsTools.getParentEducationImpact(relation, year, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching parent education impact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/homework?year=2020&subject=Maths
router.get('/influences/homework', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const subject = sanitizeSubject(req.query.subject);
    if (!year || !subject) return res.status(400).json({ error: 'Missing or invalid year/subject parameter.' });
    const data = await analyticsTools.getHomeworkImpact(year, subject, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching homework impact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/attendance?year=2020&subject=Maths
router.get('/influences/attendance', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const subject = sanitizeSubject(req.query.subject);
    if (!year || !subject) return res.status(400).json({ error: 'Missing or invalid year/subject parameter.' });
    const data = await analyticsTools.getAttendanceCorrelation(year, subject, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching attendance correlation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/ptr?year=2020
router.get('/influences/ptr', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    if (!year) return res.status(400).json({ error: 'Missing or invalid year parameter.' });
    const data = await analyticsTools.getPupilTeacherRatioImpact(year, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching PTR impact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/preschool?year=2020&subject=Maths
router.get('/influences/preschool', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const subject = sanitizeSubject(req.query.subject);
    if (!year || !subject) return res.status(400).json({ error: 'Missing or invalid year/subject parameter.' });
    const data = await analyticsTools.getPreschoolImpact(year, subject, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching preschool impact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/influences/mini-school?year=2020&subject=Maths
router.get('/influences/mini-school', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const subject = sanitizeSubject(req.query.subject);
    if (!year || !subject) return res.status(400).json({ error: 'Missing or invalid year/subject parameter.' });
    const data = await analyticsTools.getMiniSchoolComparison(year, subject, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching mini school comparison:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/trends?subject=Maths
router.get('/assessments/trends', async (req, res) => {
  try {
    const subject = sanitizeSubject(req.query.subject);
    if (!subject) return res.status(400).json({ error: 'Missing or invalid subject parameter.' });
    const data = await analyticsTools.getMultiYearTrend(subject, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching multi-year trend:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/subject-comparison?year=2020
router.get('/assessments/subject-comparison', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    if (!year) return res.status(400).json({ error: 'Missing or invalid year parameter.' });
    const data = await analyticsTools.getSubjectComparison(year, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching subject comparison:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/assessments/oral-vs-written?year=2020&classLevel=3
router.get('/assessments/oral-vs-written', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const classLevel = sanitizeClassLevel(req.query.classLevel);
    if (!year || !classLevel) return res.status(400).json({ error: 'Missing or invalid year/classLevel parameter.' });
    const data = await analyticsTools.getOralVsWrittenComparison(year, classLevel, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching oral vs written comparison:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/school-performance/districts?year=2020&subject=Maths
router.get('/school-performance/districts', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year);
    const subject = sanitizeSubject(req.query.subject);
    if (!year || !subject) return res.status(400).json({ error: 'Missing or invalid year/subject parameter.' });
    const data = await analyticsTools.getDistrictComparison(year, subject, req.userScope);
    res.json(maskData(data, req.userScope));
  } catch (err) {
    console.error('Error fetching district comparison:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
