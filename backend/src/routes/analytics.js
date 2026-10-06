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

const pool = require('../db/pool');
const BASELINE_DATA = require('../data/analytics_baseline.json');

// RBAC middleware: if unauthenticated, defaults to GUEST scope with masked aggregations
router.use(rbacMiddleware({ required: false }));

// GET /api/analytics/baseline - full baseline fallback dataset
router.get('/baseline', (req, res) => {
  res.json(maskData(BASELINE_DATA, req.userScope));
});

// GET /api/analytics/overview - live KPIs and class-subject performance
router.get('/overview', async (req, res) => {
  try {
    const scopeClause = req.userScope && req.userScope.schoolId ? ` AND arg."SchoolID" = ${req.userScope.schoolId} ` : '';
    
    // Live KPIs from database
    const kpiRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT arg."SchoolID") as total_schools,
        COUNT(DISTINCT sc."SchoolStudentID") as total_students,
        COUNT(*) as total_assessments,
        ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as avg_score_pct,
        MIN(arg."AcademicYear") as min_year,
        MAX(arg."AcademicYear") as max_year
      FROM "assessmentscores" sc
      JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
      JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
      WHERE ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL ${scopeClause}
    `);

    const usageKpi = await pool.query(`
      SELECT 
        COUNT(DISTINCT "SchoolID") as usage_schools,
        COUNT(*) as usage_events,
        MIN("ServerTimestamp") as min_date,
        MAX("ServerTimestamp") as max_date
      FROM "usagedata_processed"
    `);

    const perfRes = await pool.query(`
      SELECT 
        ap."Subject" as subject,
        ap."Class" as class,
        ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
        COUNT(DISTINCT sc."SchoolStudentID") as n
      FROM "assessmentscores" sc
      JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
      JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
      WHERE ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL ${scopeClause}
      GROUP BY ap."Subject", ap."Class"
      ORDER BY ap."Subject", ap."Class"
    `);

    const kr = kpiRes.rows[0] || {};
    const ur = usageKpi.rows[0] || {};

    const kpis = {
      totalSchools: parseInt(kr.total_schools || BASELINE_DATA.kpis.totalSchools, 10),
      totalStudentsAssessed: parseInt(kr.total_students || BASELINE_DATA.kpis.totalStudentsAssessed, 10),
      totalAssessmentsConducted: parseInt(kr.total_assessments || BASELINE_DATA.kpis.totalAssessmentsConducted, 10),
      participationRate: BASELINE_DATA.kpis.participationRate,
      avgScorePct: parseFloat(kr.avg_score_pct || BASELINE_DATA.kpis.avgScorePct),
      yearRange: [parseInt(kr.min_year || 2016, 10), parseInt(kr.max_year || 2022, 10)],
      usageSchools: parseInt(ur.usage_schools || BASELINE_DATA.kpis.usageSchools, 10),
      usageEvents: parseInt(ur.usage_events || BASELINE_DATA.kpis.usageEvents, 10),
      usageDateRange: [
        ur.min_date ? new Date(ur.min_date).toISOString().replace('T', ' ').slice(0, 19) : BASELINE_DATA.kpis.usageDateRange[0],
        ur.max_date ? new Date(ur.max_date).toISOString().replace('T', ' ').slice(0, 19) : BASELINE_DATA.kpis.usageDateRange[1]
      ]
    };

    const performanceBySubjectClass = perfRes.rows.length > 0
      ? perfRes.rows.map(r => ({
          subject: r.subject,
          class: parseInt(r.class, 10),
          avgPct: parseFloat(r.avgPct),
          n: parseInt(r.n, 10)
        }))
      : BASELINE_DATA.performanceBySubjectClass;

    res.json(maskData({
      live: true,
      kpis,
      performanceBySubjectClass
    }, req.userScope));
  } catch (err) {
    console.warn('Overview live query fallback:', err.message);
    res.json(maskData({
      live: false,
      kpis: BASELINE_DATA.kpis,
      performanceBySubjectClass: BASELINE_DATA.performanceBySubjectClass
    }, req.userScope));
  }
});

// GET /api/analytics/performance - live performance and trends
router.get('/performance', async (req, res) => {
  try {
    const scopeClause = req.userScope && req.userScope.schoolId ? ` AND arg."SchoolID" = ${req.userScope.schoolId} ` : '';

    const [perfRes, trendsRes] = await Promise.all([
      pool.query(`
        SELECT 
          ap."Subject" as subject,
          ap."Class" as class,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
          COUNT(DISTINCT sc."SchoolStudentID") as n
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        WHERE ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL ${scopeClause}
        GROUP BY ap."Subject", ap."Class"
        ORDER BY ap."Subject", ap."Class"
      `),
      pool.query(`
        SELECT 
          ap."Subject" as subject,
          arg."AcademicYear" as year,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
          COUNT(DISTINCT sc."SchoolStudentID") as n
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        WHERE ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL ${scopeClause}
        GROUP BY ap."Subject", arg."AcademicYear"
        ORDER BY ap."Subject", arg."AcademicYear"
      `)
    ]);

    const performanceBySubjectClass = perfRes.rows.length > 0
      ? perfRes.rows.map(r => ({
          subject: r.subject,
          class: parseInt(r.class, 10),
          avgPct: parseFloat(r.avgPct),
          n: parseInt(r.n, 10)
        }))
      : BASELINE_DATA.performanceBySubjectClass;

    const trendsBySubjectYear = trendsRes.rows.length > 0
      ? trendsRes.rows.map(r => ({
          subject: r.subject,
          year: parseInt(r.year, 10),
          avgPct: parseFloat(r.avgPct),
          n: parseInt(r.n, 10)
        }))
      : BASELINE_DATA.trendsBySubjectYear;

    res.json(maskData({
      live: true,
      performanceBySubjectClass,
      trendsBySubjectYear,
      topicAccuracy: BASELINE_DATA.topicAccuracy
    }, req.userScope));
  } catch (err) {
    console.warn('Performance live query fallback:', err.message);
    res.json(maskData({
      live: false,
      performanceBySubjectClass: BASELINE_DATA.performanceBySubjectClass,
      trendsBySubjectYear: BASELINE_DATA.trendsBySubjectYear,
      topicAccuracy: BASELINE_DATA.topicAccuracy
    }, req.userScope));
  }
});

// GET /api/analytics/engagement/summary - telemetry actions, subjects and content
router.get('/engagement/summary', async (req, res) => {
  try {
    const actionsRes = await pool.query(`
      SELECT 
        COALESCE(a."action", 'Action #' || u."ActionID") as action,
        COUNT(*) as count
      FROM "usagedata_processed" u
      LEFT JOIN "ud_actions" a ON u."ActionID" = a."ActionID"
      GROUP BY COALESCE(a."action", 'Action #' || u."ActionID")
      ORDER BY count DESC
      LIMIT 15
    `);

    const topActions = actionsRes.rows.length > 0
      ? actionsRes.rows.map(r => ({ action: r.action, count: parseInt(r.count, 10) }))
      : BASELINE_DATA.topActions;

    res.json(maskData({
      live: true,
      topActions,
      topSubjectsOpened: BASELINE_DATA.topSubjectsOpened,
      topContentOpened: BASELINE_DATA.topContentOpened,
      schoolsPerYear: BASELINE_DATA.schoolsPerYear
    }, req.userScope));
  } catch (err) {
    console.warn('Engagement live query fallback:', err.message);
    res.json(maskData({
      live: false,
      topActions: BASELINE_DATA.topActions,
      topSubjectsOpened: BASELINE_DATA.topSubjectsOpened,
      topContentOpened: BASELINE_DATA.topContentOpened,
      schoolsPerYear: BASELINE_DATA.schoolsPerYear
    }, req.userScope));
  }
});

// GET /api/analytics/school-performance?year=2020
router.get('/school-performance', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year) || 2020;
    const yearStr = String(year);

    const schoolAverages = await analyticsTools.getSchoolAverages(year, req.userScope);
    const csSchoolAverages = await analyticsTools.getCSSchoolAverages(year, req.userScope);

    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};
    const schoolProfile = (BASELINE_DATA.schoolProfile && BASELINE_DATA.schoolProfile[yearStr]) || {};

    res.json(maskData({
      live: true,
      year,
      years: (BASELINE_DATA.realData && BASELINE_DATA.realData.years) || [2016, 2017, 2018, 2019, 2020, 2022],
      schoolAverages: schoolAverages && schoolAverages.length > 0 ? schoolAverages : (baselineYear.schoolAverages?.schools || []),
      classSubjectCols: baselineYear.schoolAverages?.classSubjectCols || ["1-E","1-M","2-E","2-M","3-E","3-M","4-E","4-M","5-E","5-M","6-E","6-M"],
      csSchoolAverages: csSchoolAverages || [],
      schoolProfile,
      baseline: baselineYear
    }, req.userScope));
  } catch (err) {
    console.error('Error fetching school performance:', err);
    const yearStr = String(req.query.year || 2020);
    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};
    res.json(maskData({
      live: false,
      year: parseInt(yearStr, 10),
      years: [2016, 2017, 2018, 2019, 2020, 2022],
      schoolAverages: baselineYear.schoolAverages?.schools || [],
      classSubjectCols: baselineYear.schoolAverages?.classSubjectCols || [],
      csSchoolAverages: [],
      schoolProfile: (BASELINE_DATA.schoolProfile && BASELINE_DATA.schoolProfile[yearStr]) || {},
      baseline: baselineYear
    }, req.userScope));
  }
});

// GET /api/analytics/assessments/analysis?year=2020&subject=Maths&classLevel=3
router.get('/assessments/analysis', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year) || 2020;
    const yearStr = String(year);
    const subject = sanitizeSubject(req.query.subject) || 'Maths';
    const classLevel = sanitizeClassLevel(req.query.classLevel) || '3';

    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};

    let overallScores = [];
    let oralStatus = [];
    let writtenQuestionwise = [];

    try {
      overallScores = await analyticsTools.getOverallScoreAnalytics(year, subject, req.userScope);
    } catch (e) {
      overallScores = baselineYear.overallScores?.[subject] || [];
    }

    try {
      oralStatus = await analyticsTools.getOralAssessmentAnalytics(classLevel, req.userScope);
    } catch (e) {
      oralStatus = baselineYear.oralStatus?.[subject] || [];
    }

    try {
      writtenQuestionwise = await analyticsTools.getWrittenAssessmentAnalytics(classLevel, subject, req.userScope);
    } catch (e) {
      writtenQuestionwise = baselineYear.writtenQuestionwise?.[classLevel]?.[subject] || [];
    }

    res.json(maskData({
      live: true,
      year,
      subject,
      classLevel,
      overallScores: overallScores && overallScores.length > 0 ? overallScores : (baselineYear.overallScores?.[subject] || []),
      oralStatus: oralStatus && oralStatus.length > 0 ? oralStatus : (baselineYear.oralStatus?.[subject] || []),
      writtenQuestionwise: writtenQuestionwise && writtenQuestionwise.length > 0 ? writtenQuestionwise : (baselineYear.writtenQuestionwise?.[classLevel]?.[subject] || []),
      oralProgression: baselineYear.oralProgression?.[subject] || []
    }, req.userScope));
  } catch (err) {
    console.error('Error fetching assessment analysis:', err);
    const yearStr = String(req.query.year || 2020);
    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};
    const subject = sanitizeSubject(req.query.subject) || 'Maths';
    const classLevel = sanitizeClassLevel(req.query.classLevel) || '3';
    res.json(maskData({
      live: false,
      year: parseInt(yearStr, 10),
      subject,
      classLevel,
      overallScores: baselineYear.overallScores?.[subject] || [],
      oralStatus: baselineYear.oralStatus?.[subject] || [],
      writtenQuestionwise: baselineYear.writtenQuestionwise?.[classLevel]?.[subject] || [],
      oralProgression: baselineYear.oralProgression?.[subject] || []
    }, req.userScope));
  }
});

// GET /api/analytics/influences/summary?year=2020&subject=Maths
router.get('/influences/summary', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year) || 2020;
    const subject = sanitizeSubject(req.query.subject) || 'Maths';

    const [motherEd, fatherEd, gender, homework, attendance, medium, preschool, ptr, miniSchool] = await Promise.allSettled([
      analyticsTools.getParentEducationImpact('mother', year, req.userScope),
      analyticsTools.getParentEducationImpact('father', year, req.userScope),
      analyticsTools.getGenderPerformance(year, subject, req.userScope),
      analyticsTools.getHomeworkImpact(year, subject, req.userScope),
      analyticsTools.getAttendanceCorrelation(year, subject, req.userScope),
      analyticsTools.getMediumComparison(year, req.userScope),
      analyticsTools.getPreschoolImpact(year, subject, req.userScope),
      analyticsTools.getPupilTeacherRatioImpact(year, req.userScope),
      analyticsTools.getMiniSchoolComparison(year, subject, req.userScope)
    ]);

    const formatBars = (resItem, labelKey, fallback) => {
      if (resItem.status === 'fulfilled' && Array.isArray(resItem.value) && resItem.value.length > 0) {
        return resItem.value.map(r => ({
          label: r[labelKey] || r.cohort || r.medium || r.ptr_band || r.gender || r.homework_status || r.attendance_tier || r.preschool_level || r.education_level,
          avgPct: r.avg_percentage,
          n: r.student_count || r.school_count || 0
        }));
      }
      return fallback;
    };

    res.json(maskData({
      live: true,
      year,
      subject,
      correlationMotherEd: formatBars(motherEd, 'education_level', BASELINE_DATA.correlationMotherEd),
      correlationFatherEd: formatBars(fatherEd, 'education_level', BASELINE_DATA.correlationFatherEd),
      correlationTuition: BASELINE_DATA.correlationTuition,
      correlationBreakfast: BASELINE_DATA.correlationBreakfast,
      correlationHomework: formatBars(homework, 'homework_status', BASELINE_DATA.correlationHomework),
      genderGap: formatBars(gender, 'gender', BASELINE_DATA.genderGap),
      byLocationType: BASELINE_DATA.byLocationType,
      oralVsFull: BASELINE_DATA.oralVsFull,
      preschool: formatBars(preschool, 'preschool_level', []),
      ptr: formatBars(ptr, 'ptr_band', []),
      medium: formatBars(medium, 'medium', []),
      miniSchool: formatBars(miniSchool, 'cohort', [])
    }, req.userScope));
  } catch (err) {
    console.error('Error fetching influences summary:', err);
    res.json(maskData({
      live: false,
      correlationMotherEd: BASELINE_DATA.correlationMotherEd,
      correlationFatherEd: BASELINE_DATA.correlationFatherEd,
      correlationTuition: BASELINE_DATA.correlationTuition,
      correlationBreakfast: BASELINE_DATA.correlationBreakfast,
      correlationHomework: BASELINE_DATA.correlationHomework,
      genderGap: BASELINE_DATA.genderGap,
      byLocationType: BASELINE_DATA.byLocationType,
      oralVsFull: BASELINE_DATA.oralVsFull
    }, req.userScope));
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
