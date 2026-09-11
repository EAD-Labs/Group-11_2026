const pool = require('../db/pool');

/**
 * Returns average written assessment score per school, per class, for a given academic year.
 */
async function getSchoolAverages(year) {
  const query = `
    SELECT 
      arg."SchoolID" as school_id,
      ap."Class" as class,
      ap."Subject" as subject,
      AVG(sc."Marks") as avg,
      COUNT(DISTINCT sc."SchoolStudentID") as attempted
    FROM "assessmentresultgroup" arg
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "assessmentscores" sc ON arg."AssessmentResultID" = sc."AssessmentResultID"
    WHERE arg."AcademicYear" = $1
      AND ap."MaxMarks" > 0
    GROUP BY arg."SchoolID", ap."Class", ap."Subject"
  `;
  const { rows } = await pool.query(query, [year]);
  
  // Optionally, get enrollment details and merge
  const enrollmentQuery = `
    SELECT "schoolId", "class", SUM("noOfStudents") as total
    FROM "schoolclassdetails"
    WHERE "academicYear" = $1
    GROUP BY "schoolId", "class"
  `;
  const { rows: enrollmentRows } = await pool.query(enrollmentQuery, [year]);
  
  const enrollmentMap = {};
  for (const row of enrollmentRows) {
    const key = `${row.schoolId}-${row.class}`;
    enrollmentMap[key] = parseInt(row.total, 10);
  }

  // Merge totals
  for (const row of rows) {
    const key = `${row.school_id}-${row.class}`;
    row.total = enrollmentMap[key] || parseInt(row.attempted, 10); // fallback to attempted if no enrollment data
    row.avg = parseFloat(row.avg);
    row.attempted = parseInt(row.attempted, 10);
  }

  return rows;
}

/**
 * Specifically filters and calculates average scores for Computer Science assessments across schools.
 */
async function getCSSchoolAverages(year) {
  const query = `
    SELECT 
      arg."SchoolID" as school_id,
      ap."Class" as class,
      AVG(sc."Marks") as avg,
      COUNT(DISTINCT sc."SchoolStudentID") as attempted
    FROM "assessmentresultgroup" arg
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "assessmentscores" sc ON arg."AssessmentResultID" = sc."AssessmentResultID"
    WHERE arg."AcademicYear" = $1
      AND ap."Subject" = 'CS'
      AND ap."MaxMarks" > 0
    GROUP BY arg."SchoolID", ap."Class"
  `;
  const { rows } = await pool.query(query, [year]);
  return rows.map(r => ({
    school_id: r.school_id,
    class: r.class,
    subject: 'CS',
    avg: parseFloat(r.avg),
    attempted: parseInt(r.attempted, 10),
    total: parseInt(r.attempted, 10) // CS enrollment can just fallback to attempted
  }));
}

/**
 * Computes high-level summaries (average written score %) across all classes.
 */
async function getOverallScoreAnalytics(year, subject) {
  const query = `
    SELECT 
      ap."Class" as class,
      AVG(sc."Marks" / ap."MaxMarks" * 100) as avg_percentage
    FROM "assessmentresultgroup" arg
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "assessmentscores" sc ON arg."AssessmentResultID" = sc."AssessmentResultID"
    WHERE arg."AcademicYear" = $1
      AND ap."Subject" = $2
      AND ap."MaxMarks" > 0
      AND sc."Marks" IS NOT NULL
    GROUP BY ap."Class"
    ORDER BY ap."Class"
  `;
  const { rows } = await pool.query(query, [year, subject]);
  return rows.map(r => ({
    class: r.class,
    avg_percentage: parseFloat(r.avg_percentage)
  }));
}

/**
 * Returns a breakdown of the percentage of students who reached each specific oral skill level.
 */
async function getOralAssessmentAnalytics(classLevel) {
  const query = `
    SELECT 
      ap."Subject" as subject,
      sc."StudentStatusID" as status_id,
      COUNT(*) as count
    FROM "assessmentresultgroup" arg
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "assessmentscores" sc ON arg."AssessmentResultID" = sc."AssessmentResultID"
    WHERE ap."Class" = $1
      AND arg."FullOral" = 1
    GROUP BY ap."Subject", sc."StudentStatusID"
  `;
  const { rows } = await pool.query(query, [classLevel]);
  return rows;
}

/**
 * Computes the average percentage score on a *per-question* basis.
 */
async function getWrittenAssessmentAnalytics(classLevel, subject) {
  const query = `
    SELECT 
      ds."AssessmentQuestionID" as question_id,
      AVG(ds."Marks") as avg_marks
    FROM "assessmentresultgroup" arg
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "assessmentdetailedscores" ds ON arg."AssessmentResultID" = ds."AssessmentResultID"
    WHERE ap."Class" = $1
      AND ap."Subject" = $2
    GROUP BY ds."AssessmentQuestionID"
  `;
  const { rows } = await pool.query(query, [classLevel, subject]);
  return rows.map(r => ({
    question_id: r.question_id,
    avg_marks: parseFloat(r.avg_marks)
  }));
}

module.exports = {
  getSchoolAverages,
  getCSSchoolAverages,
  getOverallScoreAnalytics,
  getOralAssessmentAnalytics,
  getWrittenAssessmentAnalytics
};

