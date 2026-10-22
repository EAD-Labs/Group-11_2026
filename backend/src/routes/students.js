const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/students — list this teacher's students
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, class_level, avatar_seed, created_at
       FROM students WHERE teacher_id = $1 ORDER BY class_level, name`,
      [req.teacherId]
    );

    // If this is a demo teacher or zero students are returned in demo mode, serve pre-seeded demo roster
    if (result.rows.length === 0 && String(req.teacherId).startsWith("demo-")) {
      const demoStudents = [
        { id: "demo-st-1", name: "Ananya S", class_level: 4, avatar_seed: "ananya" },
        { id: "demo-st-2", name: "Karthik R", class_level: 4, avatar_seed: "karthik" },
        { id: "demo-st-3", name: "Muthu V", class_level: 3, avatar_seed: "muthu" },
        { id: "demo-st-4", name: "Divya M", class_level: 4, avatar_seed: "divya" },
        { id: "demo-st-5", name: "Suresh K", class_level: 5, avatar_seed: "suresh" }
      ];
      return res.json({ students: demoStudents });
    }

    res.json({ students: result.rows });
  } catch (err) {
    console.error("list students error", err);
    res.status(500).json({ error: "Could not load students" });
  }
});

// POST /api/students — add a student
router.post("/", async (req, res) => {
  const { name, classLevel, avatarSeed } = req.body || {};
  if (!name || !classLevel) {
    return res.status(400).json({ error: "name and classLevel are required" });
  }
  const cls = Number(classLevel);
  if (!Number.isInteger(cls) || cls < 1 || cls > 8) {
    return res.status(400).json({ error: "classLevel must be an integer between 1 and 8" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO students (teacher_id, name, class_level, avatar_seed)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, class_level, avatar_seed, created_at`,
      [req.teacherId, name, cls, avatarSeed || null]
    );
    res.status(201).json({ student: result.rows[0] });
  } catch (err) {
    console.error("create student error", err);
    res.status(500).json({ error: "Could not add student" });
  }
});

// PATCH /api/students/:id
router.patch("/:id", async (req, res) => {
  const { name, classLevel, avatarSeed } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE students
       SET name = COALESCE($1, name),
           class_level = COALESCE($2, class_level),
           avatar_seed = COALESCE($3, avatar_seed)
       WHERE id = $4 AND teacher_id = $5
       RETURNING id, name, class_level, avatar_seed, created_at`,
      [name || null, classLevel ? Number(classLevel) : null, avatarSeed || null, req.params.id, req.teacherId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ student: result.rows[0] });
  } catch (err) {
    console.error("update student error", err);
    res.status(500).json({ error: "Could not update student" });
  }
});

// DELETE /api/students/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM students WHERE id = $1 AND teacher_id = $2 RETURNING id",
      [req.params.id, req.teacherId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("delete student error", err);
    res.status(500).json({ error: "Could not delete student" });
  }
});

module.exports = router;
