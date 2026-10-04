const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');
const analyticsTools = require('../services/analyticsTools');
const { rbacMiddleware, maskData } = require('../middleware/rbac');

// Comprehensive tool definitions for llama-3.3-70b-versatile & open source models
const tools = [
  {
    type: "function",
    function: {
      name: "get_school_averages",
      description: "Computes school-level average scores, attempted counts, and total enrollment per class and subject for a given academic year.",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "integer",
            description: "Academic year to analyze (e.g., 2018, 2019, 2020)."
          }
        },
        required: ["year"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_cs_school_averages",
      description: "Retrieves school average performance specifically for Computer Science (CS) assessments across schools for a given academic year.",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "integer",
            description: "Academic year to analyze (e.g., 2018, 2019, 2020)."
          }
        },
        required: ["year"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_overall_score_analytics",
      description: "Computes overall average written score percentage across classes (1-8) for a specified academic year and subject.",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "integer",
            description: "Academic year (e.g., 2018, 2019, 2020)."
          },
          subject: {
            type: "string",
            enum: ["Maths", "English", "Tamil", "CS"],
            description: "Subject name to evaluate."
          }
        },
        required: ["year", "subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_oral_assessment_analytics",
      description: "Returns student counts grouped by oral skill achievement level for a specific class.",
      parameters: {
        type: "object",
        properties: {
          classLevel: {
            type: "string",
            description: "Class level to examine, e.g. '1', '2', '3', '4', '5'."
          }
        },
        required: ["classLevel"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_written_assessment_analytics",
      description: "Computes question-by-question average marks for written tests to pinpoint easy vs difficult questions.",
      parameters: {
        type: "object",
        properties: {
          classLevel: {
            type: "string",
            description: "Class level to examine, e.g. '3', '4', '5'."
          },
          subject: {
            type: "string",
            description: "Subject name, e.g. 'Maths', 'English'."
          }
        },
        required: ["classLevel", "subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_gender_performance",
      description: "Analyzes and compares performance between boys and girls by subject across classes, optionally filtered by academic year. If year is omitted or null, returns multi-year longitudinal trend across all classes.",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: ["integer", "null"],
            description: "Optional academic year (e.g. 2018, 2019, 2020). Leave null or omit to evaluate all available years/longitudinal trend across all classes."
          },
          subject: {
            type: "string",
            enum: ["Maths", "English", "Tamil", "CS"],
            description: "Subject name"
          }
        },
        required: ["subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_subject_comparison",
      description: "Compares average student scores across all subjects (English vs Maths vs Tamil vs CS) for a given academic year.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" }
        },
        required: ["year"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_medium_comparison",
      description: "Compares performance of Tamil Medium students vs English Medium students across subjects for a given academic year.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" }
        },
        required: ["year"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_multi_year_trend",
      description: "Tracks longitudinal year-on-year performance trends for a subject across available academic years.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", enum: ["Maths", "English", "Tamil", "CS"], description: "Subject name" }
        },
        required: ["subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_oral_vs_written_comparison",
      description: "Compares performance in Oral assessments vs Written assessments for a given class and year.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" },
          classLevel: { type: "string", description: "Class level (1 to 8)" }
        },
        required: ["year", "classLevel"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_preschool_impact",
      description: "Evaluates the impact of preschool education (LKG, UKG, Balwadi, None) on student performance in a subject.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" },
          subject: { type: "string", enum: ["Maths", "English", "Tamil", "CS"], description: "Subject name" }
        },
        required: ["year", "subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_district_comparison",
      description: "Compares performance across districts, regions, and school clusters for a given year and subject.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" },
          subject: { type: "string", enum: ["Maths", "English", "Tamil", "CS"], description: "Subject name" }
        },
        required: ["year", "subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_ptr_impact",
      description: "Analyzes the correlation between Pupil-Teacher Ratio (PTR: low <20:1, standard 20-35:1, high >35:1) and student scores.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" }
        },
        required: ["year"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_mini_school_comparison",
      description: "Compares assessment performance of students attending Asha Mini Schools vs regular school students.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" },
          subject: { type: "string", enum: ["Maths", "English", "Tamil", "CS"], description: "Subject name" }
        },
        required: ["year", "subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_parent_education_impact",
      description: "Analyzes the correlation between Mother's or Father's education level and student assessment performance.",
      parameters: {
        type: "object",
        properties: {
          relation: { type: "string", enum: ["mother", "father"], description: "Parent relation to analyze" },
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" }
        },
        required: ["relation", "year"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_homework_impact",
      description: "Compares student scores for regular homework completers vs irregular homework completers.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" },
          subject: { type: "string", enum: ["Maths", "English", "Tamil", "CS"], description: "Subject name" }
        },
        required: ["year", "subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_attendance_correlation",
      description: "Correlates student attendance tiers (High >=90%, Standard 75-89%, Moderate 60-74%, Low <60%) with assessment scores.",
      parameters: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Academic year (e.g. 2018, 2019, 2020)" },
          subject: { type: "string", enum: ["Maths", "English", "Tamil", "CS"], description: "Subject name" }
        },
        required: ["year", "subject"]
      }
    }
  }
];

// Strict validation whitelists and bounds
const VALID_SUBJECTS = ['Maths', 'English', 'Tamil', 'CS'];
const VALID_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8'];

function validateYear(year, optional = false) {
  if (optional && (year === undefined || year === null || year === '' || year === 'all' || year === 'null')) {
    return null;
  }
  const parsed = parseInt(year, 10);
  const maxYear = new Date().getFullYear() + 1;
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 2015 || parsed > maxYear) {
    throw new Error(`Invalid year '${year}'. Must be an integer between 2015 and ${maxYear}.`);
  }
  return parsed;
}

function validateSubject(subj) {
  if (typeof subj !== 'string') {
    throw new Error('Invalid subject type. Must be a string.');
  }
  const clean = subj.trim();
  const match = VALID_SUBJECTS.find(s => s.toLowerCase() === clean.toLowerCase());
  if (match) return match;

  const lower = clean.toLowerCase();
  if (lower === 'mathematics' || lower === 'math') return 'Maths';
  if (lower === 'computer science' || lower === 'computer' || lower === 'cs') return 'CS';

  throw new Error(`Invalid subject '${subj}'. Allowed subjects are strictly: ${VALID_SUBJECTS.join(', ')}.`);
}

function validateClassLevel(cls) {
  if (typeof cls === 'number') cls = String(cls);
  if (typeof cls !== 'string') {
    throw new Error('Invalid classLevel type. Must be a string or number.');
  }
  const clean = cls.replace(/[^0-9]/g, '');
  if (!VALID_CLASSES.includes(clean)) {
    throw new Error(`Invalid class level '${cls}'. Allowed classes are 1 through 8.`);
  }
  return clean;
}

function getToolCallHint(name, args = {}, errorMsg = '') {
  if (errorMsg.includes('Invalid subject')) {
    return `Allowed subjects are strictly: ${VALID_SUBJECTS.join(', ')}. Please retry with one of these subjects.`;
  }
  if (errorMsg.includes('Invalid year')) {
    const maxYear = new Date().getFullYear() + 1;
    return `Valid years are integers between 2015 and ${maxYear}. For longitudinal data across all years, omit 'year' or pass null if supported (e.g. get_gender_performance, get_multi_year_trend).`;
  }
  if (errorMsg.includes('Invalid class level')) {
    return `Allowed class levels are 1 through 8. Please retry with a valid class level.`;
  }
  return `Please review parameter requirements for '${name}'.`;
}

// Helper to execute local tool functions with strict validation and RBAC scoping
async function executeTool(name, args = {}, scope = {}) {
  switch (name) {
    case 'get_school_averages': {
      const year = validateYear(args.year);
      return await analyticsTools.getSchoolAverages(year, scope);
    }
    case 'get_cs_school_averages': {
      const year = validateYear(args.year);
      return await analyticsTools.getCSSchoolAverages(year, scope);
    }
    case 'get_overall_score_analytics': {
      const year = validateYear(args.year);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getOverallScoreAnalytics(year, subject, scope);
    }
    case 'get_oral_assessment_analytics': {
      const classLevel = validateClassLevel(args.classLevel);
      return await analyticsTools.getOralAssessmentAnalytics(classLevel, scope);
    }
    case 'get_written_assessment_analytics': {
      const classLevel = validateClassLevel(args.classLevel);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getWrittenAssessmentAnalytics(classLevel, subject, scope);
    }
    case 'get_gender_performance': {
      const year = validateYear(args.year, true);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getGenderPerformance(year, subject, scope);
    }
    case 'get_subject_comparison': {
      const year = validateYear(args.year);
      return await analyticsTools.getSubjectComparison(year, scope);
    }
    case 'get_medium_comparison': {
      const year = validateYear(args.year);
      return await analyticsTools.getMediumComparison(year, scope);
    }
    case 'get_multi_year_trend': {
      const subject = validateSubject(args.subject);
      return await analyticsTools.getMultiYearTrend(subject, scope);
    }
    case 'get_oral_vs_written_comparison': {
      const year = validateYear(args.year);
      const classLevel = validateClassLevel(args.classLevel);
      return await analyticsTools.getOralVsWrittenComparison(year, classLevel, scope);
    }
    case 'get_preschool_impact': {
      const year = validateYear(args.year);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getPreschoolImpact(year, subject, scope);
    }
    case 'get_district_comparison': {
      const year = validateYear(args.year);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getDistrictComparison(year, subject, scope);
    }
    case 'get_ptr_impact': {
      const year = validateYear(args.year);
      return await analyticsTools.getPupilTeacherRatioImpact(year, scope);
    }
    case 'get_mini_school_comparison': {
      const year = validateYear(args.year);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getMiniSchoolComparison(year, subject, scope);
    }
    case 'get_parent_education_impact': {
      const relation = args.relation === 'father' ? 'father' : 'mother';
      const year = validateYear(args.year);
      return await analyticsTools.getParentEducationImpact(relation, year, scope);
    }
    case 'get_homework_impact': {
      const year = validateYear(args.year);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getHomeworkImpact(year, subject, scope);
    }
    case 'get_attendance_correlation': {
      const year = validateYear(args.year);
      const subject = validateSubject(args.subject);
      return await analyticsTools.getAttendanceCorrelation(year, subject, scope);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const SYSTEM_PROMPT = `
You are "Asha Insights AI", an intelligent educational data analyst and visual architect for the Asha Kanini program.
Your mission is twofold:
1. Thoroughly investigate the assessment and performance data by selecting and invoking the right database tools.
2. Synthesize actionable insights AND design a custom dynamic visual layout (charts, KPI cards, tables) that intuitively presents the findings to teachers, coordinators, and directors.

DATABASE & CLASS CONTEXT:
- Asha Kanini partner schools primarily focus on primary education (Classes 1 through 5).
- Written assessment scores (MaxMarks > 0) are recorded for Classes 2, 3, 4, and 5 spanning academic years 2016 through 2022.
- Class 1 assessments are competency-based / oral milestones (MaxMarks = 0), so they do not have percentage scores for written tests.
- Classes 6 through 8 have assessment paper definitions in the system, but currently have no recorded student marks.
- When asked to analyze scores across classes or "all classes", evaluate Classes 2 through 5, and explain this educational context clearly if asked.

AVAILABLE ANALYSIS TOOLS:
- School & CS Averages
- Gender Performance (Boys vs Girls)
- Medium Comparison (Tamil vs English Medium)
- Subject-wise comparison & multi-year trends (get_multi_year_trend returns both overall_trend and class_breakdown)
- Socio-demographic factors: Mother/Father Education, Preschool education, Homework regularity, Pupil-Teacher Ratio, Attendance correlation, Mini School attendance.

DYNAMIC UI INSTRUCTION:
Once all tool data has been collected, your final response MUST be a JSON object with:
{
  "summary": "1-2 sentence executive summary of the findings.",
  "detailed_analysis": "Comprehensive Markdown explanation covering key patterns, standout schools/classes, anomalies, and recommendations.",
  "ui_layout": {
    "layout_type": "side_by_side" | "featured_top" | "grid",
    "widgets": [
      // 1 to 4 widgets tailored to display the data most intuitively:
      // Widget types: "kpi", "bar_chart", "line_chart", "table"
      
      // 1. KPI Calling Cards (metrics/percentages):
      // {
      //   "type": "kpi",
      //   "title": "Maths 2020 Average",
      //   "value": "43.2%",
      //   "trend": "up" | "down" | "neutral", // "up" for growth/improvement, "down" for decrease/decline
      //   "change": "+4.3%",                  // YoY or relative change percentage if known (e.g. "+3.7%", "-2.1%")
      //   "sub": "vs 38.9% in 2019",          // concise contextual baseline or note
      //   "color": "teal" | "emerald" | "amber" | "rose" | "violet"
      // }
      
      // 2. Line Chart:
      // When comparing multiple classes, subjects, or groups over time, ALWAYS use multi-series lines
      // so users can see each group's trajectory simultaneously:
      // {
      //   "type": "line_chart",
      //   "title": "Year-on-Year Maths Progression by Class (2018 - 2020)",
      //   "xKey": "year",
      //   "series": [
      //     { "key": "Class 2", "name": "Class 2", "color": "#60A5FA" },
      //     { "key": "Class 3", "name": "Class 3", "color": "#34D399" },
      //     { "key": "Class 4", "name": "Class 4", "color": "#F59E0B" },
      //     { "key": "Class 5", "name": "Class 5", "color": "#FB7185" },
      //     { "key": "Overall", "name": "Overall Avg", "color": "#A78BFA" }
      //   ],
      //   "data": [
      //     { "year": "2018", "Class 2": 45.4, "Class 3": 39.0, "Class 4": 39.8, "Class 5": 42.7, "Overall": 41.5 },
      //     { "year": "2019", "Class 2": 45.1, "Class 3": 52.0, "Class 4": 31.4, "Class 5": 44.7, "Overall": 43.2 },
      //     { "year": "2020", "Class 2": 43.5, "Class 3": 33.4, "Class 4": 40.0, "Class 5": 37.5, "Overall": 38.9 }
      //   ]
      // }
      
      // 3. Bar Chart (for category / school / subject distributions in a single period):
      // {
      //   "type": "bar_chart",
      //   "title": "Subject Performance Comparison (2020)",
      //   "xKey": "subject",
      //   "yKey": "value",
      //   "data": [
      //     { "subject": "Maths", "value": 43.2 },
      //     { "subject": "English", "value": 51.0 }
      //   ]
      // }
      
      // 4. Table Widget (for tabular breakdown with YoY delta changes):
      // {
      //   "type": "table",
      //   "title": "Class-wise Maths Performance Breakdown",
      //   "columns": ["Class", "2018 Avg", "2019 Avg", "2020 Avg", "2018-19 Change", "2019-20 Change"],
      //   "data": [
      //     { "Class": "Class 2", "2018 Avg": "45.4%", "2019 Avg": "45.1%", "2020 Avg": "43.5%", "2018-19 Change": "-0.3%", "2019-20 Change": "-1.6%" },
      //     { "Class": "Class 3", "2018 Avg": "39.0%", "2019 Avg": "52.0%", "2020 Avg": "33.4%", "2018-19 Change": "+13.0%", "2019-20 Change": "-18.6%" }
      //   ]
      // }
    ]
  }
}
Choose layout_type:
- "featured_top" when one dominant trend or bar chart should lead the view, accompanied by supporting KPIs and tables below.
- "side_by_side" when comparing two dimensions (e.g. Boys vs Girls, or Tamil vs English medium).
- "grid" when displaying multiple distinct metrics or school rankings concurrently.

Always make sure the data in widgets is accurately derived from the tool execution results.
`;

// Schema format adapted for @google/genai Function Declarations
const geminiTools = [
  {
    functionDeclarations: tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parametersJsonSchema: t.function.parameters
    }))
  }
];

// Helper to estimate token lengths
function estimateTokens(textOrObj) {
  if (!textOrObj) return 0;
  const str = typeof textOrObj === 'string' ? textOrObj : JSON.stringify(textOrObj);
  return Math.ceil(str.length / 3.5);
}

function compactMessages(msgList, maxRowsPerTool = 20) {
  return msgList.map(m => {
    if (m.role === 'tool' && typeof m.content === 'string') {
      try {
        const parsed = JSON.parse(m.content);
        if (Array.isArray(parsed) && parsed.length > maxRowsPerTool) {
          return {
            ...m,
            content: JSON.stringify(parsed.slice(0, maxRowsPerTool))
          };
        }
      } catch (e) {}
    }
    return m;
  });
}

function calculateSafeMaxTokens(msgs, toolDefs, requestedMax = 2000) {
  const promptTokens = estimateTokens(msgs) + (toolDefs ? estimateTokens(toolDefs) : 0);
  const remaining = 7400 - promptTokens;
  return Math.max(600, Math.min(requestedMax, remaining));
}

// ---------------------------------------------------------------------------
// Google Gemini Provider Execution Engine
// ---------------------------------------------------------------------------
async function runGeminiChat({ prompt, history = [], userScope, apiKey, requestedModel }) {
  const ai = new GoogleGenAI({ apiKey });

  const modelCandidates = [
    requestedModel,
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash"
  ].filter(Boolean);
  const uniqueModels = [...new Set(modelCandidates)];

  let activeModel = uniqueModels[0];

  // Convert previous history to Gemini contents structure
  const contents = [];
  for (const h of history) {
    const role = h.role === 'user' ? 'user' : 'model';
    const text = typeof h.content === 'string' ? h.content : JSON.stringify(h.content);
    contents.push({
      role,
      parts: [{ text }]
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const toolsExecuted = [];
  const executedSignatures = new Map();
  let turns = 0;
  const MAX_SAFETY_TURNS = 20;
  const MAX_CONSECUTIVE_FAILURES = 3;
  let consecutiveFailures = 0;

  async function generateWithFallback(payloadContents, cfg) {
    let lastErr = null;
    const candidates = [activeModel, ...uniqueModels.filter(m => m !== activeModel)];
    for (const m of candidates) {
      try {
        const resp = await ai.models.generateContent({
          model: m,
          contents: payloadContents,
          config: cfg
        });
        activeModel = m;
        return resp;
      } catch (err) {
        lastErr = err;
        console.warn(`Gemini model '${m}' failed (${err.message}). Trying next candidate...`);
      }
    }
    throw lastErr;
  }

  // Initial call with tools
  let response = await generateWithFallback(contents, {
    systemInstruction: SYSTEM_PROMPT,
    tools: geminiTools,
    temperature: 0.2,
    maxOutputTokens: 2500
  });

  while (response.functionCalls && response.functionCalls.length > 0 && turns < MAX_SAFETY_TURNS) {
    turns++;
    const candidateContent = response.candidates?.[0]?.content;
    if (candidateContent) {
      contents.push(candidateContent);
    }

    let turnHadSuccess = false;
    let turnHadFailure = false;
    const functionResponseParts = [];

    for (const call of response.functionCalls) {
      const functionName = call.name;
      const functionArgs = call.args || {};
      const callSignature = `${functionName}:${JSON.stringify(functionArgs)}`;
      const callCount = (executedSignatures.get(callSignature) || 0) + 1;
      executedSignatures.set(callSignature, callCount);

      let toolResult;
      const isRedundantSingleYear = functionName === 'get_gender_performance' && functionArgs.year &&
        Array.from(executedSignatures.keys()).some(sig =>
          sig.startsWith('get_gender_performance') &&
          sig.includes(`"subject":"${functionArgs.subject}"`) &&
          (!sig.includes('"year":20') || sig.includes('"year":null'))
        );

      if (isRedundantSingleYear) {
        toolResult = {
          status: "already_available",
          message: `All academic years and classes for subject '${functionArgs.subject}' have already been provided in your multi-year result. Do not query individual years. Synthesize your final analysis now.`
        };
        turnHadSuccess = true;
        toolsExecuted.push({
          tool: functionName,
          args: functionArgs,
          status: "skipped_redundant",
          message: toolResult.message
        });
      } else if (callCount > 2) {
        turnHadFailure = true;
        toolResult = {
          status: "duplicate_warning",
          message: `You have called '${functionName}' with identical arguments ${JSON.stringify(functionArgs)} ${callCount} times. Re-calling this will yield identical results. Please utilize previously retrieved data or formulate a different query.`
        };
        toolsExecuted.push({
          tool: functionName,
          args: functionArgs,
          status: "duplicate",
          warning: toolResult.message
        });
      } else {
        try {
          const rawResult = await executeTool(functionName, functionArgs, userScope);
          turnHadSuccess = true;

          if (Array.isArray(rawResult)) {
            if (rawResult.length === 0) {
              toolResult = {
                status: "empty",
                count: 0,
                message: `Query executed successfully but returned 0 records for ${JSON.stringify(functionArgs)}. Verify specified filters.`
              };
            } else {
              toolResult = rawResult.length > 30 ? rawResult.slice(0, 30) : rawResult;
            }
          } else {
            toolResult = rawResult;
          }

          toolsExecuted.push({
            tool: functionName,
            args: functionArgs,
            status: "success",
            recordCount: Array.isArray(rawResult) ? rawResult.length : 1
          });
        } catch (err) {
          turnHadFailure = true;
          const hint = getToolCallHint(functionName, functionArgs, err.message);
          toolResult = { status: "error", error: err.message, hint };
          toolsExecuted.push({
            tool: functionName,
            args: functionArgs,
            status: "failed",
            error: err.message,
            hint
          });
        }
      }

      functionResponseParts.push({
        functionResponse: {
          name: functionName,
          id: call.id,
          response: { output: toolResult }
        }
      });
    }

    contents.push({
      role: 'user',
      parts: functionResponseParts
    });

    if (turnHadFailure && !turnHadSuccess) {
      consecutiveFailures++;
    } else {
      consecutiveFailures = 0;
    }

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      contents.push({
        role: 'user',
        parts: [{ text: "Notice: Multiple consecutive queries returned errors or empty data. Please synthesize your final response now using the available information." }]
      });
    }

    response = await generateWithFallback(contents, {
      systemInstruction: SYSTEM_PROMPT,
      tools: geminiTools,
      temperature: 0.2,
      maxOutputTokens: 2500
    });
  }

  let finalContent = response.text || "";
  let parsedResult = null;

  try {
    parsedResult = JSON.parse(finalContent);
  } catch (e) {
    const jsonMatch = finalContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        parsedResult = JSON.parse(jsonMatch[1]);
      } catch (e2) {}
    }
  }

  if (!parsedResult || !parsedResult.ui_layout) {
    try {
      const formatResponse = await generateWithFallback([
        ...contents,
        ...(response.candidates?.[0]?.content ? [response.candidates[0].content] : []),
        {
          role: 'user',
          parts: [{ text: "Synthesize your complete analysis into the strict JSON format specified in the system prompt with 'summary', 'detailed_analysis', and 'ui_layout'. Output ONLY valid JSON." }]
        }
      ], {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: "application/json"
      });
      const fmtText = formatResponse.text || "";
      try {
        parsedResult = JSON.parse(fmtText);
      } catch (err) {
        const m = fmtText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (m) parsedResult = JSON.parse(m[1]);
      }
    } catch (fallbackErr) {
      console.warn("Gemini JSON formatting fallback error:", fallbackErr.message);
    }
  }

  if (!parsedResult || !parsedResult.ui_layout) {
    parsedResult = {
      summary: "Assessment analysis completed.",
      detailed_analysis: finalContent || "Analysis complete.",
      ui_layout: { layout_type: "grid", widgets: [] }
    };
  }

  return {
    provider: "gemini",
    modelUsed: activeModel,
    turns,
    toolsExecuted,
    parsedResult
  };
}

// ---------------------------------------------------------------------------
// Groq Provider Execution Engine (llama-3.3-70b-versatile & open source models)
// ---------------------------------------------------------------------------
async function runGroqChat({ prompt, history = [], userScope, apiKey, requestedModel }) {
  const groq = new Groq({ apiKey });

  let activeModel = requestedModel || process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  async function createCompletionWithFallback(completionParams) {
    const candidates = [
      activeModel,
      "openai/gpt-oss-120b",
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-20b"
    ].filter(Boolean);

    const uniqueCandidates = [...new Set(candidates)];
    let lastErr = null;

    let safeParams = { ...completionParams };
    const estimatedPrompt = estimateTokens(safeParams.messages) + (safeParams.tools ? estimateTokens(safeParams.tools) : 0);

    // Dynamically clamp max_tokens so prompt_tokens + max_tokens stays under Groq's 8,000 TPM limit
    if (estimatedPrompt + (safeParams.max_tokens || 2048) > 7400) {
      safeParams.max_tokens = Math.max(600, Math.min(safeParams.max_tokens || 2048, 7400 - estimatedPrompt));
      if (estimatedPrompt > 4500) {
        safeParams.messages = compactMessages(safeParams.messages, 15);
      }
    }

    for (const m of uniqueCandidates) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const completion = await groq.chat.completions.create({
            ...safeParams,
            model: m
          });
          activeModel = m;
          return completion;
        } catch (err) {
          lastErr = err;
          const isModelNotFound = err.status === 404 || 
            (err.error?.code === 'model_not_found') || 
            (err.message && err.message.includes('does not exist'));

          if (isModelNotFound) {
            console.warn(`Groq model '${m}' not available, trying next open-source candidate...`);
            break;
          }

          // Check for network connection / DNS blip
          const isConnErr = err.name === 'APIConnectionError' ||
            err.code === 'ENOTFOUND' ||
            err.cause?.code === 'ENOTFOUND' ||
            (err.message && (err.message.includes('ENOTFOUND') || err.message.includes('fetch failed') || err.message.includes('Connection error')));

          if (isConnErr) {
            if (attempts < maxAttempts) {
              console.warn(`Network connection issue reaching Groq on '${m}'. Retrying in 1.5s (attempt ${attempts}/${maxAttempts})...`);
              await new Promise(r => setTimeout(r, 1500));
              continue;
            } else {
              console.warn(`Network connection failed after ${attempts} attempts on '${m}'.`);
              break;
            }
          }

          // Handle 413 / 429 TPM Rate Limit Exceeded
          const isRateLimit = err.status === 413 || err.status === 429 ||
            err.error?.code === 'rate_limit_exceeded' ||
            (err.message && (err.message.includes('TPM') || err.message.includes('rate_limit_exceeded') || err.message.includes('Request too large')));

          if (isRateLimit) {
            console.warn(`TPM limit reached on '${m}'. Compacting payload and retrying...`);
            safeParams.messages = compactMessages(safeParams.messages, 12);
            safeParams.max_tokens = Math.max(500, Math.min(1200, (safeParams.max_tokens || 1500) - 500));

            try {
              const retryCompletion = await groq.chat.completions.create({
                ...safeParams,
                model: m
              });
              activeModel = m;
              return retryCompletion;
            } catch (retryErr) {
              console.warn(`Model '${m}' still rate-limited, trying next candidate model...`);
              break;
            }
          }

          throw err;
        }
      }
    }
    throw lastErr;
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content)
    })),
    { role: "user", content: prompt }
  ];

  const toolsExecuted = [];

  let response = await createCompletionWithFallback({
    messages,
    tools,
    tool_choice: "auto",
    temperature: 0.2,
    max_tokens: calculateSafeMaxTokens(messages, tools, 1024)
  });

  let choice = response.choices[0];
  let turns = 0;
  const MAX_SAFETY_TURNS = 25;
  const MAX_CONSECUTIVE_FAILURES = 3;
  let consecutiveFailures = 0;
  const executedSignatures = new Map();

  while (choice.finish_reason === "tool_calls" && choice.message.tool_calls && choice.message.tool_calls.length > 0 && turns < MAX_SAFETY_TURNS) {
    turns++;
    messages.push(choice.message);

    let turnHadSuccess = false;
    let turnHadFailure = false;

    for (const toolCall of choice.message.tool_calls) {
      const functionName = toolCall.function?.name;
      let functionArgs = {};
      try {
        functionArgs = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        functionArgs = {};
      }

      const callSignature = `${functionName}:${JSON.stringify(functionArgs)}`;
      const callCount = (executedSignatures.get(callSignature) || 0) + 1;
      executedSignatures.set(callSignature, callCount);

      let toolResult;

      const isRedundantSingleYear = functionName === 'get_gender_performance' && functionArgs.year &&
        Array.from(executedSignatures.keys()).some(sig =>
          sig.startsWith('get_gender_performance') &&
          sig.includes(`"subject":"${functionArgs.subject}"`) &&
          (!sig.includes('"year":20') || sig.includes('"year":null'))
        );

      if (isRedundantSingleYear) {
        toolResult = {
          status: "already_available",
          message: `All academic years and classes for subject '${functionArgs.subject}' have already been provided in your multi-year result. Do not query individual years. Synthesize your final analysis now.`
        };
        turnHadSuccess = true;
        toolsExecuted.push({
          tool: functionName,
          args: functionArgs,
          status: "skipped_redundant",
          message: toolResult.message
        });
      } else if (callCount > 2) {
        turnHadFailure = true;
        toolResult = {
          status: "duplicate_warning",
          message: `You have called '${functionName}' with identical arguments ${JSON.stringify(functionArgs)} ${callCount} times. Re-calling this will yield identical results. Please utilize previously retrieved data or formulate a different query.`
        };
        toolsExecuted.push({
          tool: functionName,
          args: functionArgs,
          status: "duplicate",
          warning: toolResult.message
        });
      } else {
        try {
          const rawResult = await executeTool(functionName, functionArgs, userScope);
          turnHadSuccess = true;

          if (Array.isArray(rawResult)) {
            if (rawResult.length === 0) {
              toolResult = {
                status: "empty",
                count: 0,
                message: `Query executed successfully but returned 0 records for ${JSON.stringify(functionArgs)}. Verify specified filters.`
              };
            } else {
              toolResult = rawResult.length > 25 ? rawResult.slice(0, 25) : rawResult;
            }
          } else {
            toolResult = rawResult;
          }

          toolsExecuted.push({
            tool: functionName,
            args: functionArgs,
            status: "success",
            recordCount: Array.isArray(rawResult) ? rawResult.length : 1
          });
        } catch (err) {
          turnHadFailure = true;
          const hint = getToolCallHint(functionName, functionArgs, err.message);
          toolResult = {
            status: "error",
            error: err.message,
            hint
          };
          toolsExecuted.push({
            tool: functionName,
            args: functionArgs,
            status: "failed",
            error: err.message,
            hint
          });
        }
      }

      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: JSON.stringify(toolResult)
      });
    }

    if (turnHadFailure && !turnHadSuccess) {
      consecutiveFailures++;
    } else {
      consecutiveFailures = 0;
    }

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      messages.push({
        role: "user",
        content: "Notice: Multiple consecutive database queries have failed or produced no data. Please synthesize your final response now using the available information rather than making further database queries."
      });
    }

    response = await createCompletionWithFallback({
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: calculateSafeMaxTokens(messages, tools, 1500)
    });

    choice = response.choices[0];
  }

  let finalContent = choice.message?.content || "";
  let parsedResult = null;

  try {
    parsedResult = JSON.parse(finalContent);
  } catch (e) {
    const jsonMatch = finalContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        parsedResult = JSON.parse(jsonMatch[1]);
      } catch (e2) {}
    }
  }

  if (!parsedResult || !parsedResult.ui_layout) {
    try {
      const compactedHistory = compactMessages(messages, 8);
      const formatPromptMessages = [
        ...compactedHistory,
        ...(choice.message ? [choice.message] : []),
        {
          role: "user",
          content: "Synthesize your complete analysis into the strict JSON format specified in the system prompt with 'summary', 'detailed_analysis', and 'ui_layout'. Do not call any more tools."
        }
      ];

      const formatResponse = await createCompletionWithFallback({
        messages: formatPromptMessages,
        tools,
        tool_choice: "auto",
        temperature: 0.1,
        max_tokens: calculateSafeMaxTokens(formatPromptMessages, tools, 2500)
      });

      const fmtContent = formatResponse.choices[0]?.message?.content || "";
      try {
        parsedResult = JSON.parse(fmtContent);
      } catch (err) {
        const m = fmtContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (m) parsedResult = JSON.parse(m[1]);
      }
    } catch (fallbackErr) {
      console.warn("Formatting fallback error:", fallbackErr.message);
    }

    if (!parsedResult || !parsedResult.ui_layout) {
      parsedResult = {
        summary: "Assessment analysis completed.",
        detailed_analysis: finalContent || "Analysis complete.",
        ui_layout: { layout_type: "grid", widgets: [] }
      };
    }
  }

  return {
    provider: "groq",
    modelUsed: activeModel,
    turns,
    toolsExecuted,
    parsedResult
  };
}

// ---------------------------------------------------------------------------
// Unified POST /api/analytics/chat Route with Multi-Provider Support
// ---------------------------------------------------------------------------
router.post('/', rbacMiddleware({ required: true }), async (req, res) => {
  try {
    const { prompt, history = [], provider: bodyProvider, model: bodyModel } = req.body;
    const userScope = req.userScope;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: "Missing or invalid prompt parameter" });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ error: "Prompt exceeds maximum allowed length of 1000 characters." });
    }

    const sanitizedPrompt = prompt.replace(/\0/g, '').trim();

    // Check available API keys strictly from server environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    const hasValidGroq = groqApiKey && !groqApiKey.startsWith('change-') && groqApiKey !== 'gsk_your_groq_api_key_here';
    const hasValidGemini = geminiApiKey && !geminiApiKey.startsWith('change-') && geminiApiKey.length > 10;

    if (!hasValidGemini && !hasValidGroq) {
      return res.status(503).json({
        error: "No AI provider configured. Please provide a GEMINI_API_KEY or GROQ_API_KEY in backend/.env."
      });
    }

    // Determine target provider
    const requestedProvider = (req.headers['x-llm-provider'] || bodyProvider || process.env.LLM_PROVIDER || '').toLowerCase();
    let targetProvider = 'gemini';

    if (requestedProvider === 'groq') {
      targetProvider = hasValidGroq ? 'groq' : 'gemini';
    } else if (requestedProvider === 'gemini') {
      targetProvider = hasValidGemini ? 'gemini' : 'groq';
    } else {
      // Default: favor Gemini when available, fallback to Groq
      targetProvider = hasValidGemini ? 'gemini' : 'groq';
    }

    let executionResult = null;

    if (targetProvider === 'gemini') {
      try {
        executionResult = await runGeminiChat({
          prompt: sanitizedPrompt,
          history,
          userScope,
          apiKey: geminiApiKey,
          requestedModel: bodyModel
        });
      } catch (geminiErr) {
        if (hasValidGroq) {
          console.warn("Gemini provider failed, falling back to Groq:", geminiErr.message);
          executionResult = await runGroqChat({
            prompt: sanitizedPrompt,
            history,
            userScope,
            apiKey: groqApiKey,
            requestedModel: bodyModel
          });
        } else {
          throw geminiErr;
        }
      }
    } else {
      try {
        executionResult = await runGroqChat({
          prompt: sanitizedPrompt,
          history,
          userScope,
          apiKey: groqApiKey,
          requestedModel: bodyModel
        });
      } catch (groqErr) {
        if (hasValidGemini) {
          console.warn("Groq provider failed, falling back to Gemini:", groqErr.message);
          executionResult = await runGeminiChat({
            prompt: sanitizedPrompt,
            history,
            userScope,
            apiKey: geminiApiKey,
            requestedModel: bodyModel
          });
        } else {
          throw groqErr;
        }
      }
    }

    // Apply strict data masking for restricted roles (GUEST, ADMIN-REPORTS)
    const secureResult = maskData(executionResult.parsedResult, userScope);

    const toolStats = {
      totalTurns: executionResult.turns,
      totalCalls: executionResult.toolsExecuted.length,
      successfulCalls: executionResult.toolsExecuted.filter(t => t.status === "success").length,
      failedCalls: executionResult.toolsExecuted.filter(t => t.status === "failed").length,
      duplicateCalls: executionResult.toolsExecuted.filter(t => t.status === "duplicate").length
    };

    return res.json({
      success: true,
      provider: executionResult.provider,
      modelUsed: executionResult.modelUsed,
      userRole: userScope?.role,
      isMasked: !!userScope?.isMasked,
      toolStats,
      toolsExecuted: executionResult.toolsExecuted,
      ...secureResult
    });

  } catch (error) {
    console.error("Chat error:", error);
    const isConnErr = error.name === 'APIConnectionError' ||
      error.code === 'ENOTFOUND' ||
      error.cause?.code === 'ENOTFOUND' ||
      (error.message && (error.message.includes('ENOTFOUND') || error.message.includes('Connection error') || error.message.includes('fetch failed')));

    if (isConnErr) {
      return res.status(503).json({
        error: "Network connection error: Unable to reach AI service. Please verify your internet connection, DNS, or VPN settings and try again."
      });
    }

    return res.status(500).json({
      error: error.message || "Failed to process chat query"
    });
  }
});

module.exports = router;
