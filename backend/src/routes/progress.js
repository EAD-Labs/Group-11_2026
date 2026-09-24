const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

async function assertOwnsStudent(studentId, teacherId) {
  const result = await pool.query(
    "SELECT id FROM students WHERE id = $1 AND teacher_id = $2",
    [studentId, teacherId]
  );
  return result.rows.length > 0;
}

// GET /api/students/:studentId/progress?subject=Maths
router.get("/:studentId/progress", async (req, res) => {
  const { studentId } = req.params;
  const subject = req.query.subject || "Maths";

  if (!(await assertOwnsStudent(studentId, req.teacherId))) {
    return res.status(404).json({ error: "Student not found" });
  }

  try {
    const result = await pool.query(
      `SELECT class_level, term, topic, resource_key, completed_at
       FROM progress WHERE student_id = $1 AND subject = $2
       ORDER BY completed_at`,
      [studentId, subject]
    );
    res.json({ progress: result.rows });
  } catch (err) {
    console.error("get progress error", err);
    res.status(500).json({ error: "Could not load progress" });
  }
});

// POST /api/students/:studentId/progress
// body: { subject, classLevel, term, topic, resourceKey }
router.post("/:studentId/progress", async (req, res) => {
  const { studentId } = req.params;
  const { subject, classLevel, term, topic, resourceKey } = req.body || {};

  if (!classLevel || !term || !topic || !resourceKey) {
    return res
      .status(400)
      .json({ error: "classLevel, term, topic, and resourceKey are required" });
  }

  if (!(await assertOwnsStudent(studentId, req.teacherId))) {
    return res.status(404).json({ error: "Student not found" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO progress (student_id, subject, class_level, term, topic, resource_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, subject, resource_key) DO NOTHING
       RETURNING id, class_level, term, topic, resource_key, completed_at`,
      [studentId, subject || "Maths", Number(classLevel), term, topic, resourceKey]
    );
    res.status(201).json({ progress: result.rows[0] || null });
  } catch (err) {
    console.error("mark progress error", err);
    res.status(500).json({ error: "Could not save progress" });
  }
});

// DELETE /api/students/:studentId/progress/:resourceKey — un-mark a resource
router.delete("/:studentId/progress/:resourceKey", async (req, res) => {
  const { studentId, resourceKey } = req.params;
  const subject = req.query.subject || "Maths";

  if (!(await assertOwnsStudent(studentId, req.teacherId))) {
    return res.status(404).json({ error: "Student not found" });
  }

  try {
    await pool.query(
      "DELETE FROM progress WHERE student_id = $1 AND subject = $2 AND resource_key = $3",
      [studentId, subject, resourceKey]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("delete progress error", err);
    res.status(500).json({ error: "Could not update progress" });
  }
});

module.exports = router;
