const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
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

AVAILABLE ANALYSIS TOOLS:
- School & CS Averages
- Gender Performance (Boys vs Girls)
- Medium Comparison (Tamil vs English Medium)
- Subject-wise comparison & multi-year trends
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
    ]
  }
}
Choose layout_type:
- "featured_top" when one dominant trend or bar chart should lead the view, accompanied by supporting KPIs and tables below.
- "side_by_side" when comparing two dimensions (e.g. Boys vs Girls, or Tamil vs English medium).
- "grid" when displaying multiple distinct metrics or school rankings concurrently.

Always make sure the data in widgets is accurately derived from the tool execution results.
`;

// Strict authentication enforced by default; guests receive masked data
router.post('/', rbacMiddleware({ required: true }), async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;
    const userScope = req.userScope;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: "Missing or invalid prompt parameter" });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ error: "Prompt exceeds maximum allowed length of 1000 characters." });
    }

    const sanitizedPrompt = prompt.replace(/\0/g, '').trim();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.startsWith('change-') || apiKey === 'gsk_your_groq_api_key_here') {
      return res.status(503).json({
        error: "GROQ_API_KEY is not configured in backend/.env. Please generate a key at https://console.groq.com/keys and add it."
      });
    }

    const groq = new Groq({ apiKey });

    let activeModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

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
      { role: "user", content: sanitizedPrompt }
    ];

    const toolsExecuted = [];

    // Step 1: Initial call with tools
    let response = await createCompletionWithFallback({
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: calculateSafeMaxTokens(messages, tools, 1024)
    });

    let choice = response.choices[0];

    // Dynamic Tool Calling Loop: No fixed turn limit
    // Dynamically tracks execution health, inspects failures, detects loops, and guides self-correction
    let turns = 0;
    const MAX_SAFETY_TURNS = 25; // Broad safety ceiling to prevent infinite runaway loops
    const MAX_CONSECUTIVE_FAILURES = 3; // Break if model fails repeatedly without correction
    let consecutiveFailures = 0;
    const executedSignatures = new Map(); // Tracks tool call frequency to detect duplicate loops

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
        let isSuccess = false;

        // Check if the agent is requesting redundant single years after already fetching longitudinal data
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
            // Pass userScope to enforce school isolation if teacher
            const rawResult = await executeTool(functionName, functionArgs, userScope);
            isSuccess = true;
            turnHadSuccess = true;

            if (Array.isArray(rawResult)) {
              if (rawResult.length === 0) {
                toolResult = {
                  status: "empty",
                  count: 0,
                  message: `Query executed successfully but returned 0 records for ${JSON.stringify(functionArgs)}. Verify the specified year or filter criteria.`
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

      // Track consecutive failure streaks
      if (turnHadFailure && !turnHadSuccess) {
        consecutiveFailures++;
      } else {
        consecutiveFailures = 0;
      }

      // Dynamic Break / Guidance: If 3 turns fail consecutively without any progress, nudge to synthesize
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(`Dynamic loop: ${consecutiveFailures} consecutive tool failures detected. Intervening to prompt synthesis.`);
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

      // If the model finishes calling tools, finish_reason will be "stop" and the loop naturally terminates.
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

    // Apply strict data masking for restricted roles (GUEST, ADMIN-REPORTS)
    const secureResult = maskData(parsedResult, userScope);

    // Compute tool execution health metrics
    const toolStats = {
      totalTurns: turns,
      totalCalls: toolsExecuted.length,
      successfulCalls: toolsExecuted.filter(t => t.status === "success").length,
      failedCalls: toolsExecuted.filter(t => t.status === "failed").length,
      duplicateCalls: toolsExecuted.filter(t => t.status === "duplicate").length
    };

    return res.json({
      success: true,
      modelUsed: activeModel,
      userRole: userScope?.role,
      isMasked: !!userScope?.isMasked,
      toolStats,
      toolsExecuted,
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
        error: "Network connection error: Unable to reach the AI service (api.groq.com). Please verify your internet connection, DNS, or VPN settings and try again."
      });
    }

    return res.status(500).json({
      error: error.message || "Failed to process chat query"
    });
  }
});

module.exports = router;
