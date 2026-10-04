const pool = require('../db/pool');

/**
 * Helper to build dynamic school isolation WHERE clause based on RBAC scope.
 */
function applyScope(paramIndex, scope) {
  if (scope && scope.schoolId) {
    return {
      clause: ` AND arg."SchoolID" = $${paramIndex} `,
      params: [scope.schoolId]
    };
  }
  return { clause: '', params: [] };
}

/**
 * Returns average written assessment score per school, per class, for a given academic year.
 */
async function getSchoolAverages(year, scope) {
  const sc = applyScope(2, scope);
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
      ${sc.clause}
    GROUP BY arg."SchoolID", ap."Class", ap."Subject"
  `;
  const { rows } = await pool.query(query, [year, ...sc.params]);
  
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

  for (const row of rows) {
    const key = `${row.school_id}-${row.class}`;
    row.total = enrollmentMap[key] || parseInt(row.attempted, 10);
    row.avg = parseFloat(row.avg);
    row.attempted = parseInt(row.attempted, 10);
  }

  return rows;
}

/**
 * Specifically filters and calculates average scores for Computer Science assessments across schools.
 */
async function getCSSchoolAverages(year, scope) {
  const sc = applyScope(2, scope);
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
      ${sc.clause}
    GROUP BY arg."SchoolID", ap."Class"
  `;
  const { rows } = await pool.query(query, [year, ...sc.params]);
  return rows.map(r => ({
    school_id: r.school_id,
    class: r.class,
    subject: 'CS',
    avg: parseFloat(r.avg),
    attempted: parseInt(r.attempted, 10),
    total: parseInt(r.attempted, 10)
  }));
}

/**
 * Computes high-level summaries (average written score %) across all classes.
 */
async function getOverallScoreAnalytics(year, subject, scope) {
  const sc = applyScope(3, scope);
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
      ${sc.clause}
    GROUP BY ap."Class"
    ORDER BY ap."Class"
  `;
  const { rows } = await pool.query(query, [year, subject, ...sc.params]);
  return rows.map(r => ({
    class: r.class,
    avg_percentage: parseFloat(r.avg_percentage)
  }));
}

/**
 * Returns a breakdown of the percentage of students who reached each specific oral skill level.
 */
async function getOralAssessmentAnalytics(classLevel, scope) {
  const sc = applyScope(2, scope);
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
      ${sc.clause}
    GROUP BY ap."Subject", sc."StudentStatusID"
  `;
  const { rows } = await pool.query(query, [classLevel, ...sc.params]);
  return rows;
}

/**
 * Computes the average percentage score on a *per-question* basis.
 */
async function getWrittenAssessmentAnalytics(classLevel, subject, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      ds."AssessmentQuestionID" as question_id,
      AVG(ds."Marks") as avg_marks
    FROM "assessmentresultgroup" arg
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "assessmentdetailedscores" ds ON arg."AssessmentResultID" = ds."AssessmentResultID"
    WHERE ap."Class" = $1
      AND ap."Subject" = $2
      ${sc.clause}
    GROUP BY ds."AssessmentQuestionID"
  `;
  const { rows } = await pool.query(query, [classLevel, subject, ...sc.params]);
  return rows.map(r => ({
    question_id: r.question_id,
    avg_marks: parseFloat(r.avg_marks)
  }));
}

/**
 * 1. Boys vs Girls Performance (with optional year and class-level breakdown)
 */
async function getGenderPerformance(year, subject, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      arg."AcademicYear" as year,
      ap."Class" as class,
      CASE WHEN ss."IsGirl" = 1 THEN 'Girls' ELSE 'Boys' END as gender,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "schoolstudents" ss ON sc."SchoolStudentID" = ss."SchoolStudentID"
    WHERE ($1::int IS NULL OR arg."AcademicYear" = $1)
      AND ap."Subject" = $2 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY arg."AcademicYear", ap."Class", ss."IsGirl"
    ORDER BY arg."AcademicYear" ASC, ap."Class" ASC, gender ASC
  `;
  const { rows } = await pool.query(query, [year || null, subject, ...sc.params]);
  return rows.map(r => ({
    year: r.year,
    class: r.class,
    gender: r.gender,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 2. Subject-wise Performance Comparison
 */
async function getSubjectComparison(year, scope) {
  const sc = applyScope(2, scope);
  const query = `
    SELECT 
      ap."Subject" as subject,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    WHERE arg."AcademicYear" = $1 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY ap."Subject"
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, ...sc.params]);
  return rows.map(r => ({
    subject: r.subject,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 3. Tamil Medium vs English Medium Performance
 */
async function getMediumComparison(year, scope) {
  const sc = applyScope(2, scope);
  const query = `
    SELECT 
      CASE 
        WHEN UPPER(sec."Medium") LIKE 'E%' THEN 'English Medium'
        WHEN UPPER(sec."Medium") LIKE 'T%' THEN 'Tamil Medium'
        ELSE 'Other Medium'
      END as medium,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    LEFT JOIN "schoolsections" sec ON arg."SchoolID" = sec."SchoolID" AND arg."Section" = sec."Section"
    WHERE arg."AcademicYear" = $1 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY medium
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, ...sc.params]);
  return rows.map(r => ({
    medium: r.medium,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 4. Multi-Year Longitudinal Performance Trend
 */
async function getMultiYearTrend(subject, scope) {
  const sc = applyScope(2, scope);
  const query = `
    SELECT 
      arg."AcademicYear" as year,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    WHERE ap."Subject" = $1 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY arg."AcademicYear"
    ORDER BY arg."AcademicYear" ASC
  `;
  const { rows } = await pool.query(query, [subject, ...sc.params]);
  return rows.map(r => ({
    year: r.year,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 5. Oral vs Written Assessment Comparison
 */
async function getOralVsWrittenComparison(year, classLevel, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      CASE WHEN arg."FullOral" = 1 THEN 'Oral Assessment' ELSE 'Written Assessment' END as format,
      COUNT(DISTINCT sc."SchoolStudentID") as students_assessed,
      ROUND(AVG(CASE WHEN ap."MaxMarks" > 0 THEN sc."Marks" / ap."MaxMarks" * 100 ELSE NULL END)::numeric, 1) as avg_written_percentage
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    WHERE arg."AcademicYear" = $1 
      AND ap."Class" = $2
      ${sc.clause}
    GROUP BY arg."FullOral"
  `;
  const { rows } = await pool.query(query, [year, classLevel, ...sc.params]);
  return rows;
}

/**
 * 7. Impact of Preschool Education (LKG, UKG, Balwadi, None)
 */
async function getPreschoolImpact(year, subject, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      COALESCE(pl."Detail", 'None / Not Stated') as preschool_level,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "studentdetails" sd ON sc."SchoolStudentID" = sd."SchoolStudentID"
    LEFT JOIN "preschoollevel" pl ON sd."Preschool" = pl."PreSchoolLevelID"
    WHERE arg."AcademicYear" = $1 
      AND ap."Subject" = $2 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY pl."Detail"
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, subject, ...sc.params]);
  return rows.map(r => ({
    preschool_level: r.preschool_level,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 8. District/Location Comparison
 */
async function getDistrictComparison(year, subject, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      COALESCE(slt."locationType", 'Cluster #' || s."cluster_id", 'General Region') as region,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT arg."SchoolID") as schools_count,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "schools" s ON arg."SchoolID" = s."SchoolID"
    LEFT JOIN "schoollocationtypes" slt ON s."locationId" = slt."locationId"
    WHERE arg."AcademicYear" = $1 
      AND ap."Subject" = $2 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY region
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, subject, ...sc.params]);
  return rows.map(r => ({
    region: r.region,
    avg_percentage: parseFloat(r.avg_percentage),
    schools_count: parseInt(r.schools_count, 10),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 9. Pupil-Teacher Ratio (PTR) Impact on Scores
 */
async function getPupilTeacherRatioImpact(year, scope) {
  const sc = applyScope(2, scope);
  const query = `
    SELECT 
      CASE 
        WHEN (sch."StrengthThisYear"::float / NULLIF(sch."TotalPrimaryTeachers", 0)) < 20 THEN 'Low Ratio (< 20:1)'
        WHEN (sch."StrengthThisYear"::float / NULLIF(sch."TotalPrimaryTeachers", 0)) BETWEEN 20 AND 35 THEN 'Standard (20:1 - 35:1)'
        ELSE 'High Ratio (> 35:1)'
      END as ptr_band,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT arg."SchoolID") as school_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "schooldetails" sch ON arg."SchoolID" = sch."SchoolID" AND arg."AcademicYear" = sch."AcademicYear"
    WHERE arg."AcademicYear" = $1 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY ptr_band
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, ...sc.params]);
  return rows.map(r => ({
    ptr_band: r.ptr_band,
    avg_percentage: parseFloat(r.avg_percentage),
    school_count: parseInt(r.school_count, 10)
  }));
}

/**
 * 10. Mini School Children vs Non-Mini School Children
 */
async function getMiniSchoolComparison(year, subject, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      CASE 
        WHEN sd."MS_AttendsSchoolClasses" = 1 OR sd."MS_MiniSchoolMonths" > 0 THEN 'Asha Mini School Students'
        ELSE 'Regular School Students'
      END as cohort,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "studentdetails" sd ON sc."SchoolStudentID" = sd."SchoolStudentID"
    WHERE arg."AcademicYear" = $1 
      AND ap."Subject" = $2 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY cohort
  `;
  const { rows } = await pool.query(query, [year, subject, ...sc.params]);
  return rows.map(r => ({
    cohort: r.cohort,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 11 & 12. Mother's and Father's Education Level Impact
 */
async function getParentEducationImpact(relation, year, scope) {
  const parentCol = relation === 'father' ? '"FatherEd"' : '"MotherEd"';
  const sc = applyScope(2, scope);
  const query = `
    SELECT 
      COALESCE(el."Detail", 'Not Disclosed') as education_level,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "studentdetails" sd ON sc."SchoolStudentID" = sd."SchoolStudentID"
    LEFT JOIN "educationlevel" el ON sd.${parentCol} = el."EducationLevelID"
    WHERE arg."AcademicYear" = $1 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY el."Detail"
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, ...sc.params]);
  return rows.map(r => ({
    relation: relation,
    education_level: r.education_level,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 13. Regular vs Irregular Homework Impact
 */
async function getHomeworkImpact(year, subject, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      CASE 
        WHEN sd."RegularHomework" = 'Y' THEN 'Regular Homework' 
        WHEN sd."RegularHomework" = 'N' THEN 'Irregular Homework' 
        ELSE 'Not Recorded' 
      END as homework_status,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    JOIN "studentdetails" sd ON sc."SchoolStudentID" = sd."SchoolStudentID"
    WHERE arg."AcademicYear" = $1 
      AND ap."Subject" = $2 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY sd."RegularHomework"
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, subject, ...sc.params]);
  return rows.map(r => ({
    homework_status: r.homework_status,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

/**
 * 14. Attendance vs Scores Correlation
 */
async function getAttendanceCorrelation(year, subject, scope) {
  const sc = applyScope(3, scope);
  const query = `
    SELECT 
      CASE 
        WHEN sd."Attendance" >= 90 THEN '90% - 100% (High)'
        WHEN sd."Attendance" >= 75 THEN '75% - 89% (Standard)'
        WHEN sd."Attendance" >= 60 THEN '60% - 74% (Moderate)'
        WHEN sd."Attendance" IS NOT NULL THEN 'Under 60% (Low)'
        ELSE 'School Attendance Avg'
      END as attendance_tier,
      ROUND(AVG(sc."Marks" / ap."MaxMarks" * 100)::numeric, 1) as avg_percentage,
      COUNT(DISTINCT sc."SchoolStudentID") as student_count
    FROM "assessmentscores" sc
    JOIN "assessmentresultgroup" arg ON sc."AssessmentResultID" = arg."AssessmentResultID"
    JOIN "assessmentpaper" ap ON arg."AssessmentPaperID" = ap."AssessmentPaperID"
    LEFT JOIN "studentdetails" sd ON sc."SchoolStudentID" = sd."SchoolStudentID"
    WHERE arg."AcademicYear" = $1 
      AND ap."Subject" = $2 
      AND ap."MaxMarks" > 0 
      AND sc."Marks" IS NOT NULL
      ${sc.clause}
    GROUP BY attendance_tier
    ORDER BY avg_percentage DESC
  `;
  const { rows } = await pool.query(query, [year, subject, ...sc.params]);
  return rows.map(r => ({
    attendance_tier: r.attendance_tier,
    avg_percentage: parseFloat(r.avg_percentage),
    student_count: parseInt(r.student_count, 10)
  }));
}

module.exports = {
  getSchoolAverages,
  getCSSchoolAverages,
  getOverallScoreAnalytics,
  getOralAssessmentAnalytics,
  getWrittenAssessmentAnalytics,
  getGenderPerformance,
  getSubjectComparison,
  getMediumComparison,
  getMultiYearTrend,
  getOralVsWrittenComparison,
  getPreschoolImpact,
  getDistrictComparison,
  getPupilTeacherRatioImpact,
  getMiniSchoolComparison,
  getParentEducationImpact,
  getHomeworkImpact,
  getAttendanceCorrelation
};
