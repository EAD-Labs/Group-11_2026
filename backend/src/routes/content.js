const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Load curriculum data from JSON
const CURRICULUM_PATH = path.join(__dirname, '../data/curriculum_maths.json');
let rawCurriculum = null;

function getCurriculumData() {
  if (!rawCurriculum) {
    if (fs.existsSync(CURRICULUM_PATH)) {
      rawCurriculum = JSON.parse(fs.readFileSync(CURRICULUM_PATH, 'utf8'));
    } else {
      throw new Error('Curriculum data file not found');
    }
  }
  return rawCurriculum;
}

// Slice mapping heuristics: map topic keywords to assessment slices in DB
const SLICE_KEYWORD_MAP = [
  { match: /number|counting|numeral|digit/i, sliceId: 4, sliceName: 'Number Concept' },
  { match: /add|addition/i, sliceId: 3, sliceName: 'Addition without change' },
  { match: /sub|subtraction/i, sliceId: 1, sliceName: 'Subtraction with change' },
  { match: /multiplication|multiply/i, sliceId: 5, sliceName: 'Multiplication' },
  { match: /division|divide/i, sliceId: 6, sliceName: 'Division' },
  { match: /word problem/i, sliceId: 7, sliceName: 'Addition Word Problem' },
  { match: /measurement|length|weight|measure/i, sliceId: 9, sliceName: 'Measurement' },
  { match: /shape|geometry|2-d|3-d/i, sliceId: 13, sliceName: 'Shapes' },
  { match: /time|clock|season/i, sliceId: 14, sliceName: 'Time' },
  { match: /money|coin|cashier/i, sliceId: 15, sliceName: 'Money' },
  { match: /fraction|decimal/i, sliceId: 16, sliceName: 'Fraction' },
  { match: /pattern/i, sliceId: 17, sliceName: 'Pattern' },
  { match: /data|information processing|graph/i, sliceId: 18, sliceName: 'Information Processing' },
];

function getSliceForTopic(topicTitle) {
  for (const item of SLICE_KEYWORD_MAP) {
    if (item.match.test(topicTitle)) {
      return { sliceId: item.sliceId, sliceName: item.sliceName };
    }
  }
  return { sliceId: null, sliceName: 'General Mathematics' };
}

// Pedagogical phase definitions for classroom lesson execution
const PEDAGOGICAL_PHASES = [
  { step: 1, phase: 'Concept Introduction', phaseCode: 'INTRO', defaultDuration: 8, targetType: 'Video' },
  { step: 2, phase: 'Guided Exploration', phaseCode: 'GUIDED', defaultDuration: 10, targetType: 'Worksheet' },
  { step: 3, phase: 'Interactive Practice', phaseCode: 'PRACTICE', defaultDuration: 10, targetType: 'Game' },
  { step: 4, phase: 'Hands-on Discovery', phaseCode: 'SIMULATION', defaultDuration: 12, targetType: 'Simulation' },
  { step: 5, phase: 'Concept Deepening', phaseCode: 'READING', defaultDuration: 10, targetType: 'Book' },
  { step: 6, phase: 'Classroom Discussion', phaseCode: 'PRESENTATION', defaultDuration: 10, targetType: 'Classroom Presentation' },
  { step: 7, phase: 'Reinforcement & Extension', phaseCode: 'REINFORCEMENT', defaultDuration: 8, targetType: 'Video' },
  { step: 8, phase: 'Formative Assessment', phaseCode: 'ASSESSMENT', defaultDuration: 12, targetType: 'Worksheet' }
];

function enrichItem(item, index) {
  const phaseInfo = PEDAGOGICAL_PHASES[index % PEDAGOGICAL_PHASES.length];
  return {
    ...item,
    step: index + 1,
    phase: phaseInfo.phase,
    phaseCode: phaseInfo.phaseCode,
    durationMinutes: phaseInfo.defaultDuration
  };
}

function enrichTopic(topicObj, classLevel, term, topicIndex) {
  const slice = getSliceForTopic(topicObj.topic);
  const items = (topicObj.items || []).map((it, idx) => enrichItem(it, idx));
  const totalMinutes = items.reduce((sum, it) => sum + (it.durationMinutes || 10), 0);
  const lessonPlanId = `LP-M${classLevel}-T${term}-${String(topicIndex + 1).padStart(2, '0')}`;

  return {
    ...topicObj,
    lessonPlanId,
    slice,
    totalMinutes,
    items
  };
}

/**
 * GET /api/content/directory
 * Serves the structured curriculum tree with metadata and slice mappings.
 * Optional query params: subject, classLevel, term
 */
router.get('/directory', (req, res) => {
  try {
    const raw = getCurriculumData();
    const { subject, classLevel, term } = req.query;

    if (subject && subject.toLowerCase() !== (raw.subject || '').toLowerCase()) {
      return res.status(404).json({
        error: `Subject '${subject}' curriculum not found. Available subjects: ${raw.subject}`,
        availableSubjects: [raw.subject]
      });
    }

    const enrichedClasses = {};
    const requestedClasses = classLevel ? [String(classLevel)] : Object.keys(raw.classes);

    for (const cls of requestedClasses) {
      if (!raw.classes[cls]) continue;
      enrichedClasses[cls] = {};

      const terms = term ? [term] : Object.keys(raw.classes[cls]);
      for (const t of terms) {
        if (!raw.classes[cls][t]) continue;
        enrichedClasses[cls][t] = raw.classes[cls][t].map((topicObj, idx) =>
          enrichTopic(topicObj, cls, t, idx)
        );
      }
    }

    res.json({
      subject: raw.subject || 'Maths',
      medium: raw.medium || 'English',
      classes: enrichedClasses,
      availableClasses: Object.keys(raw.classes).sort((a, b) => Number(a) - Number(b)),
      availableSubjects: [raw.subject || 'Maths']
    });
  } catch (err) {
    console.error('Error fetching curriculum directory:', err);
    res.status(500).json({ error: 'Failed to load curriculum directory' });
  }
});

/**
 * GET /api/content/lesson-plans
 * Returns structured digital lesson plans filterable by class, term, or search query.
 */
router.get('/lesson-plans', (req, res) => {
  try {
    const raw = getCurriculumData();
    const { classLevel, term, topic, q } = req.query;

    const lessonPlans = [];

    for (const [cls, terms] of Object.entries(raw.classes)) {
      if (classLevel && String(classLevel) !== cls) continue;

      for (const [t, topics] of Object.entries(terms)) {
        if (term && term !== t) continue;

        topics.forEach((top, idx) => {
          if (topic && !top.topic.toLowerCase().includes(topic.toLowerCase())) return;

          const enriched = enrichTopic(top, cls, t, idx);

          // If search query 'q' provided, check topic title or items
          if (q) {
            const query = q.toLowerCase();
            const matchesTopic = enriched.topic.toLowerCase().includes(query);
            const matchesItem = enriched.items.some(
              (it) =>
                (it.title && it.title.toLowerCase().includes(query)) ||
                (it.desc && it.desc.toLowerCase().includes(query)) ||
                (it.package && it.package.toLowerCase().includes(query))
            );
            if (!matchesTopic && !matchesItem) return;
          }

          lessonPlans.push({
            lessonPlanId: enriched.lessonPlanId,
            classLevel: cls,
            term: t,
            topic: enriched.topic,
            totalResources: enriched.items.length,
            totalMinutes: enriched.totalMinutes,
            slice: enriched.slice,
            steps: enriched.items.map((it) => ({
              step: it.step,
              phase: it.phase,
              phaseCode: it.phaseCode,
              durationMinutes: it.durationMinutes,
              title: it.title,
              desc: it.desc,
              type: it.type,
              package: it.package,
              url: it.url
            }))
          });
        });
      }
    }

    res.json({
      count: lessonPlans.length,
      lessonPlans
    });
  } catch (err) {
    console.error('Error fetching lesson plans:', err);
    res.status(500).json({ error: 'Failed to load lesson plans' });
  }
});

/**
 * GET /api/content/lesson-plans/:id
 * Fetches a single digital lesson plan by ID (e.g., LP-M3-TI-01).
 */
router.get('/lesson-plans/:id', (req, res) => {
  try {
    const raw = getCurriculumData();
    const targetId = req.params.id;

    for (const [cls, terms] of Object.entries(raw.classes)) {
      for (const [t, topics] of Object.entries(terms)) {
        for (let idx = 0; idx < topics.length; idx++) {
          const enriched = enrichTopic(topics[idx], cls, t, idx);
          if (enriched.lessonPlanId === targetId) {
            return res.json(enriched);
          }
        }
      }
    }

    res.status(404).json({ error: `Lesson plan with ID '${targetId}' not found.` });
  } catch (err) {
    console.error('Error fetching lesson plan by ID:', err);
    res.status(500).json({ error: 'Failed to load lesson plan' });
  }
});

module.exports = router;
