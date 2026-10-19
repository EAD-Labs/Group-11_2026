const express = require('express');
const router = express.Router();
const analyticsTools = require('../services/analyticsTools');
const { rbacMiddleware, maskData } = require('../middleware/rbac');

const VALID_SUBJECTS = ['Maths', 'English', 'Tamil', 'CS'];
const VALID_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8'];

const ORAL_LEVELS_BY_SUBJECT = {
  English: ['Pre Letter', 'Capital Letter', 'Small Letter', 'Read Words', 'Understand Words', 'Read Sentence', 'Understand Sentence', 'Direct Test'],
  Maths: ['Pre Numbers', 'One Digit Numbers', 'Two Digit Numbers', 'Addition', 'Subtraction', 'Multiplication', 'Division', 'Direct Test'],
  Tamil: ['Letter', 'Word', 'Sentence', 'Paragraph', 'Direct Test']
};

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

// Helper: compute live oralStatus and oralProgression by subject and class for a given year
async function queryLiveOralByYear(year, scopeClause = '') {
  const oralRes = await pool.query(`
    SELECT 
      ap."Subject" as subject,
      ap."Class" as class_level,
      ass."Status" as status_name,
      COUNT(*) as cnt
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "assessmentstudentstatus" ass ON sc."StudentStatusID" = ass."StudentStatusID"
    WHERE arg."AcademicYear" = $1
      AND ass."Status" NOT IN ('Absent', 'No Oral')
      ${scopeClause}
    GROUP BY ap."Subject", ap."Class", ass."Status"
    ORDER BY ap."Subject", ap."Class"
  `, [year]);

  if (oralRes.rows.length === 0) return null;

  const bySubjClass = {};
  for (const r of oralRes.rows) {
    const subj = r.subject;
    const cls = parseInt(r.class_level, 10);
    if (!ORAL_LEVELS_BY_SUBJECT[subj]) continue;
    bySubjClass[subj] = bySubjClass[subj] || {};
    bySubjClass[subj][cls] = bySubjClass[subj][cls] || {};
    bySubjClass[subj][cls][r.status_name] = parseInt(r.cnt, 10);
  }

  const oralStatus = { English: [], Maths: [], Tamil: [] };
  const oralProgression = { English: [], Maths: [], Tamil: [] };
  const oralProgressPctMap = { English: {}, Maths: {}, Tamil: {} };

  for (const [subj, levels] of Object.entries(ORAL_LEVELS_BY_SUBJECT)) {
    const classMap = bySubjClass[subj] || {};
    const classes = Object.keys(classMap).map(Number).sort((a, b) => a - b);
    for (const cls of classes) {
      const counts = classMap[cls];
      const total = levels.reduce((sum, lv) => sum + (counts[lv] || 0), 0);
      if (total === 0) continue;

      const statusRow = { class: cls };
      const progRow = { class: cls };
      let weightedSum = 0;

      levels.forEach((lv, idx) => {
        const c = counts[lv] || 0;
        statusRow[lv] = Math.round((c / total) * 10000) / 100;
        // Cumulative % who reached at least level idx
        const cumCount = levels.slice(idx).reduce((s, l) => s + (counts[l] || 0), 0);
        progRow[lv] = Math.round((cumCount / total) * 1000) / 10;
        weightedSum += c * ((idx + 1) / levels.length);
      });

      oralStatus[subj].push(statusRow);
      oralProgression[subj].push(progRow);
      oralProgressPctMap[subj][cls] = Math.round((weightedSum / total) * 1000) / 10;
    }
  }

  return { oralStatus, oralProgression, oralProgressPctMap };
}

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
    
    // Live KPIs from Neon PostgreSQL database
    const [kpiRes, usageKpi, perfRes] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(DISTINCT arg."SchoolID") filter (where sc."Marks" IS NOT NULL) as total_schools,
          COUNT(DISTINCT sc."SchoolStudentID") filter (where sc."Marks" IS NOT NULL) as total_students,
          COUNT(*) filter (where sc."Marks" IS NOT NULL) as total_assessments,
          ROUND((COUNT(sc."Marks")::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as participation_rate,
          ROUND(AVG(CASE WHEN sc."Marks" IS NOT NULL THEN sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100 END)::numeric, 1) as avg_score_pct,
          MIN(arg."AcademicYear") as min_year,
          MAX(arg."AcademicYear") as max_year
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        WHERE ap."MaxMarks" > 0 ${scopeClause}
      `),
      pool.query(`
        SELECT 
          COUNT(DISTINCT "SchoolID") as usage_schools,
          COUNT(*) as usage_events,
          MIN("ServerTimestamp") as min_date,
          MAX("ServerTimestamp") as max_date
        FROM "usagedata_processed"
      `),
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
      `)
    ]);

    const kr = kpiRes.rows[0] || {};
    const ur = usageKpi.rows[0] || {};

    const kpis = {
      totalSchools: parseInt(kr.total_schools || BASELINE_DATA.kpis.totalSchools, 10),
      totalStudentsAssessed: parseInt(kr.total_students || BASELINE_DATA.kpis.totalStudentsAssessed, 10),
      totalAssessmentsConducted: parseInt(kr.total_assessments || BASELINE_DATA.kpis.totalAssessmentsConducted, 10),
      participationRate: parseFloat(kr.participation_rate || BASELINE_DATA.kpis.participationRate),
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

// GET /api/analytics/performance - live performance, longitudinal trends, and slice/topic accuracy
router.get('/performance', async (req, res) => {
  try {
    const scopeClause = req.userScope && req.userScope.schoolId ? ` AND arg."SchoolID" = ${req.userScope.schoolId} ` : '';

    const [perfRes, trendsRes, topicRes] = await Promise.all([
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
      `),
      pool.query(`
        SELECT 
          s."SliceName" as topic,
          s."Subject" as subject,
          ROUND((SUM(CASE WHEN ds."Marks" > 0 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as "accuracyPct",
          COUNT(*) as attempts
        FROM "assessmentdetailedscores" ds
        JOIN "assessmentresultgroup" arg ON ds."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentquestionslice" aqs ON ds."AssessmentQuestionID" = aqs."AssessmentQuestionID"
        JOIN "assessmentslice" s ON aqs."AssessmentSliceID" = s."AssessmentSliceID"
        WHERE ds."ANSWERED" = 1 ${scopeClause}
        GROUP BY s."SliceName", s."Subject"
        HAVING COUNT(*) >= 30
        ORDER BY "accuracyPct" ASC
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

    const topicAccuracy = topicRes.rows.length > 0
      ? topicRes.rows.map(r => ({
          topic: r.topic,
          subject: r.subject,
          accuracyPct: parseFloat(r.accuracyPct),
          attempts: parseInt(r.attempts, 10)
        }))
      : BASELINE_DATA.topicAccuracy;

    res.json(maskData({
      live: true,
      performanceBySubjectClass,
      trendsBySubjectYear,
      topicAccuracy
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

// GET /api/analytics/engagement/summary - live telemetry actions, subjects, content, and usage KPIs
router.get('/engagement/summary', async (req, res) => {
  try {
    const [actionsRes, subjectsRes, contentRes, usageKpiRes, schoolsYearRes] = await Promise.all([
      pool.query(`
        SELECT 
          COALESCE(a."action", 'Action #' || u."ActionID") as action,
          COUNT(*) as count
        FROM "usagedata_processed" u
        LEFT JOIN "ud_actions" a ON u."ActionID" = a."ActionID"
        GROUP BY COALESCE(a."action", 'Action #' || u."ActionID")
        ORDER BY count DESC
        LIMIT 15
      `),
      pool.query(`
        SELECT 
          CASE
            WHEN UPPER(TRIM(pv."value")) = 'MATHS' THEN 'Maths'
            WHEN UPPER(TRIM(pv."value")) = 'ENGLISH' THEN 'English'
            WHEN UPPER(TRIM(pv."value")) = 'TAMIL' THEN 'Tamil'
            WHEN UPPER(TRIM(pv."value")) = 'EVS' THEN 'EVS'
            WHEN UPPER(TRIM(pv."value")) LIKE 'COMP%' THEN 'Computer Science'
            WHEN UPPER(TRIM(pv."value")) LIKE 'SOC%' THEN 'Social Science'
            WHEN UPPER(TRIM(pv."value")) = 'SCIENCE' THEN 'Science'
            ELSE INITCAP(LOWER(TRIM(pv."value")))
          END as subject,
          COUNT(*) as count
        FROM "ud_parameter_value" pv
        WHERE pv."ParameterID" = 4 AND TRIM(pv."value") <> ''
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT 
          TRIM(pv."value") as title,
          COUNT(*) as count
        FROM "ud_parameter_value" pv
        WHERE pv."ParameterID" = 6 AND TRIM(pv."value") <> ''
        GROUP BY TRIM(pv."value")
        ORDER BY count DESC
        LIMIT 12
      `),
      pool.query(`
        SELECT 
          COUNT(DISTINCT "SchoolID") as usage_schools,
          COUNT(*) as usage_events
        FROM "usagedata_processed"
      `),
      pool.query(`
        SELECT "AcademicYear" as year, COUNT(DISTINCT "SchoolID") as schools
        FROM "assmt_schools"
        GROUP BY "AcademicYear"
        ORDER BY "AcademicYear"
      `)
    ]);

    const topActions = actionsRes.rows.length > 0
      ? actionsRes.rows.map(r => ({ action: r.action, count: parseInt(r.count, 10) }))
      : BASELINE_DATA.topActions;

    const topSubjectsOpened = subjectsRes.rows.length > 0
      ? subjectsRes.rows.map(r => ({ subject: r.subject, count: parseInt(r.count, 10) }))
      : BASELINE_DATA.topSubjectsOpened;

    const topContentOpened = contentRes.rows.length > 0
      ? contentRes.rows.map(r => {
          let decoded = r.title;
          try { decoded = decodeURIComponent(r.title); } catch (e) {}
          return { title: decoded, count: parseInt(r.count, 10) };
        })
      : BASELINE_DATA.topContentOpened;

    const uk = usageKpiRes.rows[0] || {};
    const usageKpis = {
      usageSchools: parseInt(uk.usage_schools || BASELINE_DATA.kpis.usageSchools, 10),
      usageEvents: parseInt(uk.usage_events || BASELINE_DATA.kpis.usageEvents, 10)
    };

    const schoolsPerYear = schoolsYearRes.rows.length > 0
      ? schoolsYearRes.rows.map(r => ({ year: parseInt(r.year, 10), schools: parseInt(r.schools, 10) }))
      : BASELINE_DATA.schoolsPerYear;

    res.json(maskData({
      live: true,
      usageKpis,
      topActions,
      topSubjectsOpened,
      topContentOpened,
      schoolsPerYear
    }, req.userScope));
  } catch (err) {
    console.warn('Engagement live query fallback:', err.message);
    res.json(maskData({
      live: false,
      usageKpis: {
        usageSchools: BASELINE_DATA.kpis.usageSchools,
        usageEvents: BASELINE_DATA.kpis.usageEvents
      },
      topActions: BASELINE_DATA.topActions,
      topSubjectsOpened: BASELINE_DATA.topSubjectsOpened,
      topContentOpened: BASELINE_DATA.topContentOpened,
      schoolsPerYear: BASELINE_DATA.schoolsPerYear
    }, req.userScope));
  }
});

// GET /api/analytics/school-performance?year=2018
router.get('/school-performance', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year) || 2018;
    const yearStr = String(year);
    const scopeClause = req.userScope && req.userScope.schoolId ? ` AND arg."SchoolID" = ${req.userScope.schoolId} ` : '';

    const [cellRes, enrollRes, profileRes, csRows, yearsRes, liveOral] = await Promise.all([
      pool.query(`
        SELECT 
          arg."SchoolID" as school_id,
          ap."Class" as class_level,
          ap."Subject" as subject,
          ROUND(AVG(sc."Marks")::numeric, 2) as avg_marks,
          MAX(ap."MaxMarks") as max_marks,
          COUNT(DISTINCT sc."SchoolStudentID") as attempted
        FROM "assessmentresultgroup" arg
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        JOIN "assessmentscores" sc ON arg."AssessmentResultID" = sc."AssessmentResultID"
        WHERE arg."AcademicYear" = $1
          AND ap."MaxMarks" > 0
          AND sc."Marks" IS NOT NULL
          AND ap."Subject" IN ('English', 'Maths', 'Tamil')
          ${scopeClause}
        GROUP BY arg."SchoolID", ap."Class", ap."Subject"
        ORDER BY arg."SchoolID", ap."Class", ap."Subject"
      `, [year]),
      pool.query(`
        SELECT "schoolId" as school_id, "class" as class_level, SUM("noOfStudents") as total
        FROM "schoolclassdetails"
        WHERE "academicYear" = $1
        GROUP BY "schoolId", "class"
      `, [year]),
      pool.query(`
        SELECT 
          "SchoolID" as school_id,
          "RTEScore" as rte,
          "TotalPrimaryTeachers" as teachers,
          "StrengthThisYear" as strength
        FROM "schooldetails"
        WHERE "AcademicYear" = $1
      `, [year]),
      analyticsTools.getCSSchoolAverages(year, req.userScope),
      pool.query(`
        SELECT DISTINCT "AcademicYear" as year
        FROM "assessmentresultgroup"
        WHERE "AcademicYear" >= 2015
        ORDER BY "AcademicYear" ASC
      `),
      queryLiveOralByYear(year, scopeClause)
    ]);

    const enrollMap = {};
    for (const r of enrollRes.rows) {
      enrollMap[`${r.school_id}-${r.class_level}`] = parseInt(r.total, 10);
    }

    const subjCode = { English: 'E', Maths: 'M', Tamil: 'T' };
    const colSet = new Set();
    const schoolMap = new Map();

    for (const r of cellRes.rows) {
      const code = `${r.class_level}-${subjCode[r.subject] || r.subject[0]}`;
      colSet.add(code);
      const sid = parseInt(r.school_id, 10);
      if (!schoolMap.has(sid)) {
        schoolMap.set(sid, { schoolId: sid, cells: {} });
      }
      const attempted = parseInt(r.attempted, 10);
      const total = enrollMap[`${sid}-${r.class_level}`] || attempted;
      schoolMap.get(sid).cells[code] = {
        avg: parseFloat(r.avg_marks),
        max: parseFloat(r.max_marks),
        attempted,
        total
      };
    }

    const classSubjectCols = Array.from(colSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    const liveSchools = Array.from(schoolMap.values()).sort((a, b) => a.schoolId - b.schoolId);

    const liveProfile = {};
    for (const r of profileRes.rows) {
      liveProfile[r.school_id] = {
        rte: r.rte !== null ? parseFloat(r.rte) : null,
        teachers: r.teachers !== null ? parseInt(r.teachers, 10) : null,
        strength: r.strength !== null ? parseInt(r.strength, 10) : null
      };
    }

    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};
    const fallbackProfile = (BASELINE_DATA.schoolProfile && BASELINE_DATA.schoolProfile[yearStr]) || {};

    const schoolAverages = liveSchools.length > 0
      ? { classSubjectCols, schools: liveSchools }
      : (baselineYear.schoolAverages || { classSubjectCols: [], schools: [] });

    const schoolProfile = Object.keys(liveProfile).length > 0 ? liveProfile : fallbackProfile;
    const oralStatus = (liveOral && (liveOral.oralStatus.English.length || liveOral.oralStatus.Maths.length || liveOral.oralStatus.Tamil.length))
      ? liveOral.oralStatus
      : (baselineYear.oralStatus || { English: [], Maths: [], Tamil: [] });

    const csSchoolAverages = csRows && csRows.length > 0
      ? { rows: csRows, note: `${csRows.length} school/class Computer Science assessment groups recorded for ${year}.` }
      : (BASELINE_DATA.realData?.csSchoolAverages || { note: `No Computer Science assessment records found for ${year}.` });

    const years = yearsRes.rows.length > 0
      ? yearsRes.rows.map(r => parseInt(r.year, 10))
      : ((BASELINE_DATA.realData && BASELINE_DATA.realData.years) || [2016, 2017, 2018, 2019, 2020, 2022]);

    res.json(maskData({
      live: true,
      year,
      years,
      schoolAverages,
      classSubjectCols: schoolAverages.classSubjectCols,
      csSchoolAverages,
      schoolProfile,
      oralStatus
    }, req.userScope));
  } catch (err) {
    console.error('Error fetching school performance:', err);
    const yearStr = String(req.query.year || 2018);
    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};
    res.json(maskData({
      live: false,
      year: parseInt(yearStr, 10),
      years: [2016, 2017, 2018, 2019, 2020, 2022],
      schoolAverages: baselineYear.schoolAverages || { classSubjectCols: [], schools: [] },
      classSubjectCols: baselineYear.schoolAverages?.classSubjectCols || [],
      csSchoolAverages: BASELINE_DATA.realData?.csSchoolAverages || {},
      schoolProfile: (BASELINE_DATA.schoolProfile && BASELINE_DATA.schoolProfile[yearStr]) || {},
      oralStatus: baselineYear.oralStatus || { English: [], Maths: [], Tamil: [] }
    }, req.userScope));
  }
});

// GET /api/analytics/assessments/analysis?year=2018&subject=English&classLevel=2
router.get('/assessments/analysis', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year) || 2018;
    const yearStr = String(year);
    const subject = sanitizeSubject(req.query.subject) || 'English';
    const classLevel = sanitizeClassLevel(req.query.classLevel) || '2';
    const scopeClause = req.userScope && req.userScope.schoolId ? ` AND arg."SchoolID" = ${req.userScope.schoolId} ` : '';

    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};

    const [writtenAvgRes, liveOral, writtenQRes] = await Promise.all([
      pool.query(`
        SELECT 
          ap."Subject" as subject,
          ap."Class" as class_level,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as written_pct
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        WHERE arg."AcademicYear" = $1
          AND ap."MaxMarks" > 0
          AND sc."Marks" IS NOT NULL
          ${scopeClause}
        GROUP BY ap."Subject", ap."Class"
        ORDER BY ap."Subject", ap."Class"
      `, [year]),
      queryLiveOralByYear(year, scopeClause),
      pool.query(`
        SELECT 
          ap."Class" as class_level,
          ap."Subject" as subject,
          aq."QuestionNo" as q_no,
          ROUND(AVG(ds."Marks" / NULLIF(aq."QuestionMarks", 0) * 100)::numeric, 1) as "avgPct"
        FROM "assessmentdetailedscores" ds
        JOIN "assessmentresultgroup" arg ON ds."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        JOIN "assessmentquestions" aq ON ds."AssessmentQuestionID" = aq."AssessmentQuestionID"
        WHERE arg."AcademicYear" = $1
          AND aq."QuestionMarks" > 0
          AND ds."ANSWERED" = 1
          ${scopeClause}
        GROUP BY ap."Class", ap."Subject", aq."QuestionNo"
        ORDER BY ap."Class", ap."Subject", aq."QuestionNo"
      `, [year])
    ]);

    // Build overallScores: { English: [{ class, writtenScorePct, oralProgressPct }], Maths: [...], Tamil: [...] }
    const writtenMap = { English: {}, Maths: {}, Tamil: {} };
    for (const r of writtenAvgRes.rows) {
      if (!writtenMap[r.subject]) writtenMap[r.subject] = {};
      writtenMap[r.subject][parseInt(r.class_level, 10)] = parseFloat(r.written_pct);
    }

    const overallScores = {};
    for (const subj of ['English', 'Maths', 'Tamil']) {
      const wMap = writtenMap[subj] || {};
      const oMap = (liveOral && liveOral.oralProgressPctMap && liveOral.oralProgressPctMap[subj]) || {};
      const allCls = Array.from(new Set([...Object.keys(wMap), ...Object.keys(oMap)].map(Number))).sort((a, b) => a - b);
      if (allCls.length > 0) {
        overallScores[subj] = allCls.map(c => ({
          class: c,
          writtenScorePct: wMap[c] !== undefined ? wMap[c] : null,
          oralProgressPct: oMap[c] !== undefined ? oMap[c] : null
        }));
      } else if (baselineYear.overallScores?.[subj]) {
        overallScores[subj] = baselineYear.overallScores[subj];
      } else {
        overallScores[subj] = [];
      }
    }

    // Build writtenQuestionwise: { [classLevel]: { [subject]: [{ q, avgPct }] } }
    const writtenQuestionwise = {};
    for (const r of writtenQRes.rows) {
      const c = String(r.class_level);
      const s = r.subject;
      writtenQuestionwise[c] = writtenQuestionwise[c] || {};
      writtenQuestionwise[c][s] = writtenQuestionwise[c][s] || [];
      writtenQuestionwise[c][s].push({
        q: `Q${r.q_no}`,
        avgPct: parseFloat(r.avgPct)
      });
    }

    const finalWrittenQ = Object.keys(writtenQuestionwise).length > 0
      ? writtenQuestionwise
      : (baselineYear.writtenQuestionwise || {});

    const finalOralStatus = (liveOral && (liveOral.oralStatus.English.length || liveOral.oralStatus.Maths.length || liveOral.oralStatus.Tamil.length))
      ? liveOral.oralStatus
      : (baselineYear.oralStatus || {});

    const finalOralProgression = (liveOral && (liveOral.oralProgression.English.length || liveOral.oralProgression.Maths.length || liveOral.oralProgression.Tamil.length))
      ? liveOral.oralProgression
      : (baselineYear.oralProgression || {});

    res.json(maskData({
      live: true,
      year,
      subject,
      classLevel,
      overallScores,
      oralStatus: finalOralStatus,
      writtenQuestionwise: finalWrittenQ,
      oralProgression: finalOralProgression
    }, req.userScope));
  } catch (err) {
    console.error('Error fetching assessment analysis:', err);
    const yearStr = String(req.query.year || 2018);
    const baselineYear = (BASELINE_DATA.realData && BASELINE_DATA.realData.byYear && BASELINE_DATA.realData.byYear[yearStr]) || {};
    const subject = sanitizeSubject(req.query.subject) || 'English';
    const classLevel = sanitizeClassLevel(req.query.classLevel) || '2';
    res.json(maskData({
      live: false,
      year: parseInt(yearStr, 10),
      subject,
      classLevel,
      overallScores: baselineYear.overallScores || {},
      oralStatus: baselineYear.oralStatus || {},
      writtenQuestionwise: baselineYear.writtenQuestionwise || {},
      oralProgression: baselineYear.oralProgression || {}
    }, req.userScope));
  }
});

// GET /api/analytics/influences/summary
router.get('/influences/summary', async (req, res) => {
  try {
    const year = sanitizeYear(req.query.year); // null = aggregate across all recorded years in Neon DB
    const subject = sanitizeSubject(req.query.subject);
    const scopeClause = req.userScope && req.userScope.schoolId ? ` AND arg."SchoolID" = ${req.userScope.schoolId} ` : '';

    const [
      motherEd,
      fatherEd,
      genderRes,
      homeworkRes,
      tuitionRes,
      breakfastRes,
      locRes,
      oralVsRes
    ] = await Promise.allSettled([
      analyticsTools.getParentEducationImpact('mother', year, req.userScope),
      analyticsTools.getParentEducationImpact('father', year, req.userScope),
      pool.query(`
        SELECT 
          CASE WHEN ss."IsGirl" = 1 THEN 'Girls' ELSE 'Boys' END as label,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
          COUNT(DISTINCT sc."SchoolStudentID") as n
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        JOIN "schoolstudents" ss ON sc."SchoolStudentID" = ss."SchoolStudentID"
        WHERE ($1::int IS NULL OR arg."AcademicYear" = $1)
          AND ($2::text IS NULL OR ap."Subject" = $2)
          AND ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL
          ${scopeClause}
        GROUP BY label
        ORDER BY "avgPct" DESC
      `, [year, subject]),
      analyticsTools.getHomeworkImpact(year, subject, req.userScope),
      pool.query(`
        SELECT 
          CASE WHEN sd."GoesToTuition" = 1 THEN 'Yes' ELSE 'No' END as label,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
          COUNT(DISTINCT sc."SchoolStudentID") as n
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        JOIN "studentdetails" sd ON sc."SchoolStudentID" = sd."SchoolStudentID"
        WHERE ($1::int IS NULL OR arg."AcademicYear" = $1)
          AND ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL AND sd."GoesToTuition" IN (0, 1)
          ${scopeClause}
        GROUP BY label
        ORDER BY "avgPct" DESC
      `, [year]),
      pool.query(`
        SELECT 
          CASE WHEN sd."EatsBreakfast" = 1 THEN 'Yes' ELSE 'No' END as label,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
          COUNT(DISTINCT sc."SchoolStudentID") as n
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        JOIN "studentdetails" sd ON sc."SchoolStudentID" = sd."SchoolStudentID"
        WHERE ($1::int IS NULL OR arg."AcademicYear" = $1)
          AND ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL AND sd."EatsBreakfast" IN (0, 1)
          ${scopeClause}
        GROUP BY label
        ORDER BY "avgPct" DESC
      `, [year]),
      pool.query(`
        SELECT 
          COALESCE(slt."locationType", 'Rural') as label,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
          COUNT(DISTINCT sc."SchoolStudentID") as n
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        JOIN "schools" s ON arg."SchoolID" = s."SchoolID"
        LEFT JOIN "schoollocationtypes" slt ON s."locationId" = slt."locationId"
        WHERE ($1::int IS NULL OR arg."AcademicYear" = $1)
          AND ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL
          ${scopeClause}
        GROUP BY label
        ORDER BY "avgPct" DESC
      `, [year]),
      pool.query(`
        SELECT 
          CASE WHEN arg."FullOral" = 1 THEN 'Oral-only' ELSE 'Written / mixed' END as label,
          ROUND(AVG(sc."Marks" / NULLIF(ap."MaxMarks", 0) * 100)::numeric, 1) as "avgPct",
          COUNT(DISTINCT sc."SchoolStudentID") as n
        FROM "assessmentscores" sc
        JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
        JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
        WHERE ($1::int IS NULL OR arg."AcademicYear" = $1)
          AND ap."MaxMarks" > 0 AND sc."Marks" IS NOT NULL
          ${scopeClause}
        GROUP BY label
        ORDER BY "avgPct" DESC
      `, [year])
    ]);

    const formatToolBars = (resItem, labelKey, fallback) => {
      if (resItem.status === 'fulfilled' && Array.isArray(resItem.value) && resItem.value.length > 0) {
        return resItem.value.map(r => ({
          label: r[labelKey] || r.homework_status || r.education_level,
          avgPct: parseFloat(r.avg_percentage),
          n: parseInt(r.student_count || r.school_count || 0, 10)
        }));
      }
      return fallback;
    };

    const formatQueryBars = (resItem, fallback) => {
      if (resItem.status === 'fulfilled' && resItem.value?.rows?.length > 0) {
        return resItem.value.rows.map(r => ({
          label: r.label,
          avgPct: parseFloat(r.avgPct),
          n: parseInt(r.n, 10)
        }));
      }
      return fallback;
    };

    res.json(maskData({
      live: true,
      year,
      subject,
      correlationMotherEd: formatToolBars(motherEd, 'education_level', BASELINE_DATA.correlationMotherEd),
      correlationFatherEd: formatToolBars(fatherEd, 'education_level', BASELINE_DATA.correlationFatherEd),
      correlationTuition: formatQueryBars(tuitionRes, BASELINE_DATA.correlationTuition),
      correlationBreakfast: formatQueryBars(breakfastRes, BASELINE_DATA.correlationBreakfast),
      correlationHomework: formatToolBars(homeworkRes, 'homework_status', BASELINE_DATA.correlationHomework),
      genderGap: formatQueryBars(genderRes, BASELINE_DATA.genderGap),
      byLocationType: formatQueryBars(locRes, BASELINE_DATA.byLocationType),
      oralVsFull: formatQueryBars(oralVsRes, BASELINE_DATA.oralVsFull)
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
