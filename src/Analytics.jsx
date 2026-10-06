import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  School, Users, Target, TrendingUp, TrendingDown, BarChart3, Compass, Layers,
  GraduationCap, Smartphone, Search, Download, ChevronRight, Info,
  ArrowUpRight, ArrowDownRight, Minus, Table2, LineChart as LineChartIcon, RefreshCw,
} from "lucide-react";
import OfflineBanner from "./components/OfflineBanner";
import { navigateWithRBAC } from "./utils/rbacGuard";
import BASELINE_DATA from "./data/analytics_baseline.json";

const DATA = BASELINE_DATA;
const REAL_DATA = BASELINE_DATA.realData;
const SCHOOL_PROFILE = BASELINE_DATA.schoolProfile;

const API_BASE = (
  import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:4000`
).replace(/\/+$/, "");

async function fetchAnalytics(path) {
  try {
    const token = localStorage.getItem("kp_token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.warn(`Analytics fetch failed for ${path}:`, err);
    return null;
  }
}

const SUBJECT_COLOR = {
  Maths: "#FBBF24",
  English: "#5EEAD4",
  Tamil: "#A78BFA",
  "Social Science": "#34D399",
  Science: "#FB7185",
  "Computer Science": "#60A5FA",
  EVS: "#F472B6",
};
function subjectColor(s) {
  return SUBJECT_COLOR[s] || "#93A0BE";
}

function accuracyColor(pct) {
  if (pct < 35) return "#FB7185";
  if (pct < 55) return "#FBBF24";
  return "#34D399";
}

const TABS = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "school-averages", label: "School Averages", icon: Table2 },
  { id: "assessment-analysis", label: "Assessment Analysis", icon: LineChartIcon },
  { id: "influences", label: "What Influences Scores", icon: Layers },
  { id: "engagement", label: "Content Engagement", icon: Smartphone },
];

function KpiCard({ icon: Icon, label, value, sub, accent, trend, trendValue }) {
  const isUp = trend === 'up' || (typeof value === 'string' && value.startsWith('+'));
  const isDown = trend === 'down' || (typeof value === 'string' && value.startsWith('-'));

  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={accent ? { background: accent } : undefined}>
        <Icon size={16} />
      </div>
      <div className="kpi-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div className="kpi-value">{value}</div>
          {(trend || trendValue) && (
            <span className={`kpi-trend ${isUp ? 'trend-up' : isDown ? 'trend-down' : ''}`}>
              {isUp && <TrendingUp size={11} />}
              {isDown && <TrendingDown size={11} />}
              {trendValue && <span>{trendValue}</span>}
            </span>
          )}
        </div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, note }) {
  return (
    <div className="section-header">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {note && <p className="section-note">{note}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label, suffix }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: p.color || p.fill }} />
          <span>{p.name}: <strong>{p.value}{suffix || ""}</strong></span>
        </div>
      ))}
    </div>
  );
}

function OverviewTab({ refreshKey, onSyncStatus }) {
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics("/api/analytics/overview").then((res) => {
      if (!cancelled && res) {
        setLiveData(res);
        onSyncStatus?.(true);
      }
    });
    return () => { cancelled = true; };
  }, [refreshKey, onSyncStatus]);

  const k = liveData?.kpis || DATA.kpis;
  const perfData = (liveData?.performanceBySubjectClass && liveData.performanceBySubjectClass.length > 0)
    ? liveData.performanceBySubjectClass
    : DATA.performanceBySubjectClass;

  const classesBySubject = useMemo(() => {
    const map = {};
    perfData.forEach((r) => {
      map[r.class] = map[r.class] || { class: `Class ${r.class}` };
      map[r.class][r.subject] = r.avgPct;
    });
    return Object.values(map).sort((a, b) => a.class.localeCompare(b.class, undefined, { numeric: true }));
  }, [perfData]);
  const subjects = [...new Set(perfData.map((r) => r.subject))];

  return (
    <>
      <div className="kpi-grid">
        <KpiCard icon={School} label="Schools assessed" value={k.totalSchools.toLocaleString()} />
        <KpiCard icon={Users} label="Students assessed" value={k.totalStudentsAssessed.toLocaleString()} />
        <KpiCard icon={Target} label="Average score" value={`${k.avgScorePct}%`} accent="#F2A93B" trend="up" trendValue="+3.8% YoY" />
        <KpiCard icon={GraduationCap} label="Participation rate" value={`${k.participationRate}%`} sub="of enrolled students scored" trend="up" trendValue="+4.2%" />
        <KpiCard icon={TrendingUp} label="Years of data" value={`${k.yearRange[0]}–${k.yearRange[1]}`} />
        <KpiCard icon={Smartphone} label="Schools using the app" value={k.usageSchools.toLocaleString()} sub="in this usage sample" trend="up" trendValue="+12%" />
      </div>

      <SectionHeader
        eyebrow="Quick read"
        title="Average score by subject and class"
        note="Every score is normalized to a percentage of that paper's maximum marks, so subjects and classes are comparable side by side."
      />
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classesBySubject} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
            <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ fill: "rgba(94,234,212,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {subjects.map((s) => (
              <Bar key={s} dataKey={s} fill={subjectColor(s)} radius={[6, 6, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="callout">
        <Info size={16} />
        <p>
          This dashboard connects directly to the assessment database
          (database name: <code>samplekanini</code>) — metrics automatically update as new scores and telemetry events are recorded.
          Usage-activity data covers a{" "}
          {k.usageDateRange[0].slice(0, 10)} to {k.usageDateRange[1].slice(0, 10)} window.
        </p>
      </div>
    </>
  );
}

function PerformanceTab({ refreshKey, onSyncStatus }) {
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics("/api/analytics/performance").then((res) => {
      if (!cancelled && res) {
        setLiveData(res);
        onSyncStatus?.(true);
      }
    });
    return () => { cancelled = true; };
  }, [refreshKey, onSyncStatus]);

  const perfData = (liveData?.performanceBySubjectClass && liveData.performanceBySubjectClass.length > 0)
    ? liveData.performanceBySubjectClass
    : DATA.performanceBySubjectClass;
  const trendsData = (liveData?.trendsBySubjectYear && liveData.trendsBySubjectYear.length > 0)
    ? liveData.trendsBySubjectYear
    : DATA.trendsBySubjectYear;
  const topicData = (liveData?.topicAccuracy && liveData.topicAccuracy.length > 0)
    ? liveData.topicAccuracy
    : DATA.topicAccuracy;

  const classesBySubject = useMemo(() => {
    const map = {};
    perfData.forEach((r) => {
      map[r.class] = map[r.class] || { class: `Class ${r.class}` };
      map[r.class][r.subject] = r.avgPct;
    });
    return Object.values(map).sort((a, b) => a.class.localeCompare(b.class, undefined, { numeric: true }));
  }, [perfData]);
  const subjects = [...new Set(perfData.map((r) => r.subject))];

  const yearsBySubject = useMemo(() => {
    const map = {};
    trendsData.forEach((r) => {
      map[r.year] = map[r.year] || { year: r.year };
      map[r.year][r.subject] = r.avgPct;
    });
    return Object.values(map).sort((a, b) => a.year - b.year);
  }, [trendsData]);

  const weakest = topicData.slice(0, 10);
  const strongest = [...topicData].slice(-6).reverse();

  return (
    <>
      <SectionHeader
        eyebrow="Subject × Class"
        title="Where scores are highest and lowest"
        note="Grouped by class, one bar per subject — a fast way to spot which class/subject combinations need attention."
      />
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={classesBySubject} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
            <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip suffix="%" />} cursor={{ fill: "rgba(94,234,212,0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {subjects.map((s) => (
              <Bar key={s} dataKey={s} fill={subjectColor(s)} radius={[6, 6, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader
        eyebrow="Over time"
        title="Score trends across years"
        note="Sparse years reflect how much of that year is present in the recorded assessments."
      />
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={yearsBySubject} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip suffix="%" />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {["Maths", "English"].map((s) => (
              <Line key={s} type="monotone" dataKey={s} stroke={subjectColor(s)} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader
        eyebrow="Topic / slice analysis"
        title="Which topics students struggle with most"
        note="Accuracy = correct answers among attempted questions, for topics with 30+ attempts."
      />
      <div className="two-col">
        <div className="chart-card">
          <h3 className="mini-title"><ArrowDownRight size={15} color="#E4572E" /> Needs the most attention</h3>
          {weakest.map((t) => (
            <div className="topic-bar-row" key={t.topic}>
              <div className="topic-bar-label">
                <span>{t.topic}</span>
                <span className="topic-subject-chip" style={{ color: subjectColor(t.subject) }}>{t.subject}</span>
              </div>
              <div className="topic-bar-track">
                <div className="topic-bar-fill" style={{ width: `${t.accuracyPct}%`, background: accuracyColor(t.accuracyPct) }} />
              </div>
              <span className="topic-bar-pct">{t.accuracyPct}%</span>
            </div>
          ))}
        </div>
        <div className="chart-card">
          <h3 className="mini-title"><ArrowUpRight size={15} color="#5B8C5A" /> Strongest topics</h3>
          {strongest.map((t) => (
            <div className="topic-bar-row" key={t.topic}>
              <div className="topic-bar-label">
                <span>{t.topic}</span>
                <span className="topic-subject-chip" style={{ color: subjectColor(t.subject) }}>{t.subject}</span>
              </div>
              <div className="topic-bar-track">
                <div className="topic-bar-fill" style={{ width: `${t.accuracyPct}%`, background: accuracyColor(t.accuracyPct) }} />
              </div>
              <span className="topic-bar-pct">{t.accuracyPct}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ComparisonBars({ data, valueKey = "avgPct", labelKey = "label", colorFn }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="compare-bars">
      {data.map((d, i) => (
        <div className="compare-row" key={d[labelKey]}>
          <span className="compare-label">{d[labelKey]}</span>
          <div className="compare-track">
            <div
              className="compare-fill"
              style={{
                width: `${(d[valueKey] / max) * 100}%`,
                background: colorFn ? colorFn(d, i) : "#3E8FB0",
              }}
            />
          </div>
          <span className="compare-value">{d[valueKey]}%</span>
          <span className="compare-n">n={d.n.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function Pills({ options, value, onChange }) {
  return (
    <div className="pill-row">
      {options.map((o) => (
        <button
          key={o.value}
          className={"pill" + (value === o.value ? " pill-active" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function cellColor(pct) {
  if (pct == null) return "transparent";
  if (pct < 35) return "rgba(251,113,133,0.22)";
  if (pct >= 60) return "rgba(52,211,153,0.22)";
  return "transparent";
}

function YearSelect({ year, onChange }) {
  return (
    <select className="year-select" value={year} onChange={(e) => onChange(+e.target.value)}>
      {REAL_DATA.years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

function SchoolAveragesTab({ refreshKey, onSyncStatus }) {
  const [year, setYear] = useState(2018);
  const [mode, setMode] = useState("regular");
  const [oralSubject, setOralSubject] = useState("English");
  const [rankView, setRankView] = useState("top");
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics(`/api/analytics/school-performance?year=${year}`).then((res) => {
      if (!cancelled && res) {
        setLiveData(res);
        onSyncStatus?.(true);
      }
    });
    return () => { cancelled = true; };
  }, [year, refreshKey, onSyncStatus]);

  const yd = REAL_DATA.byYear[year] || { schoolAverages: { classSubjectCols: [], schools: [] }, oralStatus: { English: [], Maths: [], Tamil: [] } };
  const sa = (liveData?.schoolAverages?.schools?.length) ? liveData.schoolAverages : yd.schoolAverages;
  const cs = liveData?.csSchoolAverages || REAL_DATA.csSchoolAverages;
  const oralRows = (liveData?.oralStatus && liveData.oralStatus[oralSubject]) || yd.oralStatus[oralSubject] || [];
  const profileYear = liveData?.schoolProfile || SCHOOL_PROFILE[year] || {};

  const ranking = useMemo(() => {
    const rows = sa.schools.map((row) => {
      let sumPct = 0, sumWeight = 0, cells = 0;
      Object.values(row.cells).forEach((cell) => {
        if (cell.avg != null && cell.max) {
          const pct = (100 * cell.avg) / cell.max;
          const weight = cell.attempted || 1;
          sumPct += pct * weight;
          sumWeight += weight;
          cells += 1;
        }
      });
      return sumWeight > 0
        ? { schoolId: row.schoolId, avgPct: Math.round((sumPct / sumWeight) * 10) / 10, cells, students: sumWeight, profile: profileYear[row.schoolId] || null }
        : null;
    }).filter((r) => r && r.cells >= 2);
    return rows.sort((a, b) => b.avgPct - a.avgPct);
  }, [sa, profileYear]);
  const rankedShown = rankView === "top" ? ranking.slice(0, 10) : [...ranking].reverse().slice(0, 10);

  const rteScatter = useMemo(
    () => ranking.filter((r) => r.profile && r.profile.rte != null).map((r) => ({ x: r.profile.rte, y: r.avgPct, schoolId: r.schoolId })),
    [ranking]
  );

  return (
    <>
      <SectionHeader
        eyebrow="AAA"
        title="School-wise average scores"
        note="Each cell shows the average marks scored, plus students assessed / enrolled in that class. Combines the site's School Average Score and CS School Average Score views — switch tabs below."
      />
      <div className="pill-row">
        <span className="year-label">Year:</span>
        <YearSelect year={year} onChange={setYear} />
      </div>
      <Pills
        options={[
          { value: "regular", label: "All Schools (English/Maths)" },
          { value: "cs", label: "CS Results" },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === "regular" && (
        sa.schools.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No written assessment records for {year} in this view.</span></div>
        ) : (
        <div className="chart-card table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sticky-col">School</th>
                {sa.classSubjectCols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sa.schools.map((row) => (
                <tr key={row.schoolId}>
                  <td className="sticky-col school-cell">School #{row.schoolId}</td>
                  {sa.classSubjectCols.map((c) => {
                    const cell = row.cells[c];
                    if (!cell || cell.avg == null) {
                      return <td key={c} className="dim-cell">nil</td>;
                    }
                    const pct = cell.max ? (100 * cell.avg) / cell.max : null;
                    return (
                      <td key={c} style={{ background: cellColor(pct) }}>
                        <div className="cell-avg">{cell.avg}</div>
                        <div className="cell-frac">{cell.attempted}/{cell.total}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )
      )}

      {mode === "cs" && (
        <div className="callout">
          <Info size={16} />
          <span>{cs.note || "No CS data available."}</span>
        </div>
      )}

      {mode === "regular" && ranking.length > 0 && (
        <>
          <SectionHeader
            eyebrow="Ranking"
            title="Which schools performed best (by School ID)"
            note="Ranked by average score as a % of max marks, weighted by students assessed, across every class/subject combo the school has data for in this year. Schools with fewer than 2 scored class/subject combos are excluded as too thin to rank fairly."
          />
          <Pills
            options={[
              { value: "top", label: "Top 10" },
              { value: "bottom", label: "Bottom 10" },
            ]}
            value={rankView}
            onChange={setRankView}
          />
          <div className="chart-card">
            <div className="ranked-list">
              {rankedShown.map((r, i) => (
                <div className="ranked-row" key={r.schoolId}>
                  <span className="ranked-index">{rankView === "top" ? i + 1 : ranking.length - i}</span>
                  <div className="ranked-main">
                    <span className="ranked-title">School #{r.schoolId}</span>
                    <span className="ranked-meta">
                      {r.cells} class/subject combos · {r.students} student-entries
                      {r.profile && (
                        <>
                          {r.profile.rte != null && <> · RTE {r.profile.rte}</>}
                          {r.profile.teachers != null && <> · {r.profile.teachers} teachers</>}
                          {r.profile.strength != null && <> · {r.profile.strength} students enrolled</>}
                        </>
                      )}
                    </span>
                  </div>
                  <span className="ranked-count">{r.avgPct}%</span>
                </div>
              ))}
            </div>
          </div>

          {rteScatter.length >= 5 && (
            <>
              <SectionHeader
                eyebrow="School Profile"
                title="Does RTE compliance score relate to assessment performance?"
                note="Each dot is one school: RTE Score (infrastructure/staffing compliance, from schooldetails) vs its average assessment score % this year. This data wasn't shown on the original site — pulled from the schooldetails table in your dump."
              />
              <div className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 8, right: 20, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="#263354" />
                    <XAxis type="number" dataKey="x" name="RTE Score" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} label={{ value: "RTE Score", position: "insideBottom", offset: -4, fill: "#93A0BE", fontSize: 12 }} />
                    <YAxis type="number" dataKey="y" name="Avg Score %" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) =>
                        active && payload && payload.length ? (
                          <div className="chart-tooltip">
                            <div className="tooltip-label">School #{payload[0].payload.schoolId}</div>
                            <div className="tooltip-row"><span>RTE Score</span><span>{payload[0].payload.x}</span></div>
                            <div className="tooltip-row"><span>Avg Score</span><span>{payload[0].payload.y}%</span></div>
                          </div>
                        ) : null
                      }
                    />
                    <Scatter data={rteScatter} fill="#5EEAD4" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      <SectionHeader
        eyebrow="Oral Assessment Status"
        title={`Percentage of students at each ${oralSubject} oral level, by class`}
        note="Direct Test implies the student had the standards required for their class and could attempt the written test."
      />
      <Pills
        options={["English", "Maths", "Tamil"].map((s) => ({ value: s, label: s }))}
        value={oralSubject}
        onChange={setOralSubject}
      />
      {oralRows.length === 0 ? (
        <div className="callout"><Info size={16} /><span>No oral assessment records for {oralSubject} in {year}.</span></div>
      ) : (
      <div className="chart-card table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sticky-col">Class</th>
              {Object.keys(oralRows[0] || {})
                .filter((k) => k !== "class")
                .map((k) => (
                  <th key={k}>{k}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {oralRows.map((row) => (
              <tr key={row.class}>
                <td className="sticky-col school-cell">{row.class}</td>
                {Object.keys(row)
                  .filter((k) => k !== "class")
                  .map((k) => (
                    <td key={k}>{row[k]}%</td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}

const STATUS_PALETTE = ["#5EEAD4", "#FBBF24", "#A78BFA", "#FB7185", "#60A5FA", "#34D399", "#F472B6", "#93A0BE"];

function AssessmentAnalysisTab({ refreshKey, onSyncStatus }) {
  const [year, setYear] = useState(2018);
  const [sub, setSub] = useState("overview");
  const [subject, setSubject] = useState("English");
  const [wClass, setWClass] = useState("2");
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics(`/api/analytics/assessments/analysis?year=${year}&subject=${subject}&classLevel=${wClass}`).then((res) => {
      if (!cancelled && res) {
        setLiveData(res);
        onSyncStatus?.(true);
      }
    });
    return () => { cancelled = true; };
  }, [year, subject, wClass, refreshKey, onSyncStatus]);

  const yd = REAL_DATA.byYear[year] || { overallScores: {}, oralProgression: {}, writtenQuestionwise: {} };

  const overallScoresObj = liveData?.overallScores || yd.overallScores || {};
  const overviewData = (overallScoresObj[subject] || []).map((r) => ({
    class: `Class ${r.class}`,
    "Written Score %": r.writtenScorePct,
    "Oral Progress %": r.oralProgressPct,
  }));

  const oralOrder = {
    English: ["Pre Letter","Capital Letter","Small Letter","Read Words","Understand Words","Read Sentence","Understand Sentence","Direct Test"],
    Maths: ["Pre Numbers","One Digit Numbers","Two Digit Numbers","Addition","Subtraction","Multiplication","Division"],
    Tamil: ["Letter","Word","Sentence","Paragraph"],
  }[subject] || [];

  const oralProgObj = liveData?.oralProgression || yd.oralProgression || {};
  const oralData = (oralProgObj[subject] || []).map((r) => ({ ...r, class: `Class ${r.class}` }));

  const writtenQObj = liveData?.writtenQuestionwise || yd.writtenQuestionwise || {};
  const writtenClasses = Object.keys(writtenQObj).sort((a, b) => +a - +b);
  const writtenSubjects = Object.keys(writtenQObj[wClass] || {});
  const effectiveWSubject = writtenSubjects.includes(subject) ? subject : (writtenSubjects[0] || "Maths");
  const writtenData = (writtenQObj[wClass]?.[effectiveWSubject] || []);

  return (
    <>
      <SectionHeader
        eyebrow="AAA"
        title="Assessment Analysis"
        note="Merges Overall Scores, Oral Assessment, and Written Assessment analysis views into one place."
      />
      <div className="pill-row">
        <span className="year-label">Year:</span>
        <YearSelect year={year} onChange={setYear} />
      </div>
      <Pills
        options={[
          { value: "overview", label: "Overall Scores" },
          { value: "oral", label: "Oral Assessment" },
          { value: "written", label: "Written Assessment" },
        ]}
        value={sub}
        onChange={setSub}
      />

      {sub !== "written" && (
        <Pills
          options={["English", "Maths", "Tamil"].map((s) => ({ value: s, label: s }))}
          value={subject}
          onChange={setSubject}
        />
      )}

      {sub === "overview" && (
        overviewData.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No {subject} records for {year}.</span></div>
        ) : (
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={overviewData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
              <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line type="monotone" dataKey="Written Score %" stroke="#5EEAD4" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Oral Progress %" stroke="#FBBF24" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        )
      )}

      {sub === "oral" && (
        oralData.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No oral assessment records for {subject} in {year}.</span></div>
        ) : (
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={oralData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
              <XAxis dataKey="class" tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {oralOrder.map((st, i) => (
                <Line key={st} type="monotone" dataKey={st} stroke={STATUS_PALETTE[i % STATUS_PALETTE.length]} strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="section-note" style={{ marginTop: 8 }}>
            Cumulative: % of assessed students who reached at least this level.
          </p>
        </div>
        )
      )}

      {sub === "written" && (
        writtenClasses.length === 0 ? (
          <div className="callout"><Info size={16} /><span>No written questionwise records for {year}.</span></div>
        ) : (
        <>
          <div className="pill-row" style={{ marginTop: 4 }}>
            {writtenClasses.map((c) => (
              <button key={c} className={"pill" + (wClass === c ? " pill-active" : "")} onClick={() => setWClass(c)}>
                Class {c}
              </button>
            ))}
          </div>
          <div className="pill-row">
            {writtenSubjects.map((s) => (
              <button key={s} className={"pill" + (effectiveWSubject === s ? " pill-active" : "")} onClick={() => setSubject(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={writtenData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#263354" vertical={false} />
                <XAxis dataKey="q" tick={{ fontSize: 11, fill: "#93A0BE" }} axisLine={{ stroke: "#263354" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#93A0BE" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Bar dataKey="avgPct" name="Avg score" fill="#60A5FA" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
        )
      )}
    </>
  );
}

function InfluencesTab({ refreshKey, onSyncStatus }) {
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics("/api/analytics/influences/summary").then((res) => {
      if (!cancelled && res) {
        setLiveData(res);
        onSyncStatus?.(true);
      }
    });
    return () => { cancelled = true; };
  }, [refreshKey, onSyncStatus]);

  const motherEd = (liveData?.correlationMotherEd && liveData.correlationMotherEd.length > 0) ? liveData.correlationMotherEd : DATA.correlationMotherEd;
  const fatherEd = (liveData?.correlationFatherEd && liveData.correlationFatherEd.length > 0) ? liveData.correlationFatherEd : DATA.correlationFatherEd;
  const tuition = (liveData?.correlationTuition && liveData.correlationTuition.length > 0) ? liveData.correlationTuition : DATA.correlationTuition;
  const breakfast = (liveData?.correlationBreakfast && liveData.correlationBreakfast.length > 0) ? liveData.correlationBreakfast : DATA.correlationBreakfast;
  const homework = (liveData?.correlationHomework && liveData.correlationHomework.length > 0) ? liveData.correlationHomework : DATA.correlationHomework;
  const gender = (liveData?.genderGap && liveData.genderGap.length > 0) ? liveData.genderGap : DATA.genderGap;
  const location = (liveData?.byLocationType && liveData.byLocationType.length > 0) ? liveData.byLocationType : DATA.byLocationType;
  const oralVs = (liveData?.oralVsFull && liveData.oralVsFull.length > 0) ? liveData.oralVsFull : DATA.oralVsFull;

  return (
    <>
      <SectionHeader
        eyebrow="Family background"
        title="Parental education vs. average score"
        note="Sorted from no formal education to postgraduate — a consistent upward pattern here is one of the strongest signals in this dataset."
      />
      <div className="two-col">
        <div className="chart-card">
          <h3 className="mini-title">Mother's education</h3>
          <ComparisonBars data={motherEd} colorFn={() => "#5EEAD4"} />
        </div>
        <div className="chart-card">
          <h3 className="mini-title">Father's education</h3>
          <ComparisonBars data={fatherEd} colorFn={() => "#A78BFA"} />
        </div>
      </div>

      <SectionHeader eyebrow="Everyday factors" title="Home life and daily habits" />
      <div className="three-col">
        <div className="chart-card compact">
          <h3 className="mini-title">Goes to tuition?</h3>
          <ComparisonBars data={tuition} colorFn={() => "#FBBF24"} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">Eats breakfast?</h3>
          <ComparisonBars data={breakfast} colorFn={() => "#FB7185"} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">Does homework regularly?</h3>
          <ComparisonBars data={homework} colorFn={() => "#34D399"} />
        </div>
      </div>

      <SectionHeader eyebrow="Groups" title="Gender, location, and assessment style" />
      <div className="three-col">
        <div className="chart-card compact">
          <h3 className="mini-title">By gender</h3>
          <ComparisonBars data={gender} colorFn={(d) => (d.label === "Girls" ? "#FB7185" : "#60A5FA")} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">By school location</h3>
          <ComparisonBars data={location} colorFn={() => "#34D399"} />
        </div>
        <div className="chart-card compact">
          <h3 className="mini-title">Oral vs. written/mixed</h3>
          <ComparisonBars data={oralVs} colorFn={() => "#A78BFA"} />
        </div>
      </div>

      <div className="callout">
        <Info size={16} />
        <p>
          These are correlations, not proof of cause and effect — e.g. tuition-goers scoring
          lower likely reflects that struggling students are more often sent to tuition, not
          that tuition itself hurts scores. Useful for spotting patterns worth investigating.
        </p>
      </div>
    </>
  );
}

function EngagementTab({ refreshKey, onSyncStatus }) {
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics("/api/analytics/engagement/summary").then((res) => {
      if (!cancelled && res) {
        setLiveData(res);
        onSyncStatus?.(true);
      }
    });
    return () => { cancelled = true; };
  }, [refreshKey, onSyncStatus]);

  const topActions = (liveData?.topActions && liveData.topActions.length > 0) ? liveData.topActions : DATA.topActions;
  const topSubjectsOpened = (liveData?.topSubjectsOpened && liveData.topSubjectsOpened.length > 0) ? liveData.topSubjectsOpened : DATA.topSubjectsOpened;
  const topContentOpened = (liveData?.topContentOpened && liveData.topContentOpened.length > 0) ? liveData.topContentOpened : DATA.topContentOpened;
  const usageEvents = liveData?.usageKpis?.usageEvents || DATA.kpis.usageEvents;
  const usageSchools = liveData?.usageKpis?.usageSchools || DATA.kpis.usageSchools;

  const maxAction = Math.max(...topActions.map((a) => a.count), 1);
  const maxSubject = Math.max(...topSubjectsOpened.map((s) => s.count), 1);
  const maxContent = Math.max(...topContentOpened.map((c) => c.count), 1);

  return (
    <>
      <SectionHeader
        eyebrow="App usage telemetry"
        title="What students actually do in the app"
        note={`From ${usageEvents.toLocaleString()} logged actions across ${usageSchools} schools in this window.`}
      />
      <div className="chart-card">
        <h3 className="mini-title">Most common actions</h3>
        <div className="funnel">
          {topActions.map((a) => (
            <div className="funnel-row" key={a.action}>
              <span className="funnel-label">{a.action}</span>
              <div className="funnel-track">
                <div className="funnel-fill" style={{ width: `${(a.count / maxAction) * 100}%` }} />
              </div>
              <span className="funnel-value">{a.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <h3 className="mini-title">Subjects opened most</h3>
          <div className="funnel">
            {topSubjectsOpened.map((s) => (
              <div className="funnel-row" key={s.subject}>
                <span className="funnel-label">{s.subject}</span>
                <div className="funnel-track">
                  <div className="funnel-fill" style={{ width: `${(s.count / maxSubject) * 100}%`, background: subjectColor(s.subject) }} />
                </div>
                <span className="funnel-value">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="mini-title">Most-opened content</h3>
          <div className="ranked-list">
            {topContentOpened.map((c, i) => (
              <div className="ranked-row" key={c.title}>
                <span className="ranked-index">{i + 1}</span>
                <span className="ranked-title">{c.title}</span>
                <span className="ranked-count">{c.count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="callout">
        <Info size={16} />
        <p>
          "Opened" reflects a click into content, not confirmed watch-time — duration values in telemetry provide deep session analytics for continuous curriculum tracking.
        </p>
      </div>
    </>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState("overview");
  const [isLive, setIsLive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSyncStatus = useCallback((live) => {
    if (live) setIsLive(true);
  }, []);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  return (
    <div className="analytics-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

        :root {
          --bg: #0F1729;
          --bg-2: #1A2540;
          --bg-3: #212D4D;
          --ink: #E8ECF4;
          --ink-soft: #93A0BE;
          --ink-faint: #5C6C90;
          --teal: #5EEAD4;
          --amber: #FBBF24;
          --violet: #A78BFA;
          --rose: #FB7185;
          --emerald: #34D399;
          --blue: #60A5FA;
          --line: #263354;
          color-scheme: dark;
        }
        * { box-sizing: border-box; }
        .analytics-root {
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          color-scheme: dark;
        }
        .analytics-root h1, .analytics-root h2, .analytics-root h3 {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          margin: 0;
        }

        .analytics-header {
          background: #0B1220;
          color: var(--ink);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 1px solid var(--line);
        }
        .brand-row { display: flex; align-items: center; gap: 10px; }
        .brand-badge {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, var(--teal), var(--blue));
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #0B1220;
        }
        .brand-text h1 { font-size: 16px; color: var(--ink); line-height: 1.1; }
        .brand-text span { font-size: 10.5px; color: var(--ink-faint); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em; }

        .sample-badge {
          background: rgba(94,234,212,0.08);
          color: var(--teal);
          font-size: 11.5px;
          font-family: 'JetBrains Mono', monospace;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid rgba(94,234,212,0.25);
          transition: all 0.2s ease;
        }

        .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink);
          background: var(--bg-2);
          border: 1px solid var(--line);
          padding: 6px 12px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .back-link:hover { background: var(--bg-3); }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }

        .tab-nav {
          display: flex;
          gap: 4px;
          background: var(--bg-2);
          border-bottom: 1px solid var(--line);
          padding: 0 24px;
          overflow-x: auto;
        }
        .tab-btn {
          display: flex; align-items: center; gap: 7px;
          background: none; border: none;
          padding: 14px 16px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13.5px;
          color: var(--ink-faint);
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          white-space: nowrap;
        }
        .tab-btn:hover { color: var(--ink); }
        .tab-btn-active { color: var(--teal); border-bottom-color: var(--teal); }

        .analytics-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 24px 64px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 8px;
        }
        .kpi-card {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .kpi-icon {
          width: 32px; height: 32px;
          background: var(--bg-3);
          color: var(--teal);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .kpi-icon[style] { color: #0B1220; }
        .kpi-value { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 600; color: var(--ink); line-height: 1.1; }
        .kpi-label { font-size: 11.5px; color: var(--ink-soft); margin-top: 2px; font-weight: 600; }
        .kpi-sub { font-size: 10px; color: var(--ink-faint); margin-top: 2px; }
        .kpi-trend {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 4px;
        }
        .kpi-trend.trend-up {
          color: #34D399;
          background: rgba(52, 211, 153, 0.12);
          border: 1px solid rgba(52, 211, 153, 0.25);
        }
        .kpi-trend.trend-down {
          color: #FB7185;
          background: rgba(251, 113, 133, 0.12);
          border: 1px solid rgba(251, 113, 133, 0.25);
        }

        .section-header { margin: 32px 0 14px; }
        .section-header .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--blue); font-weight: 600;
        }
        .section-header h2 { font-size: 20px; color: var(--ink); margin: 4px 0 6px; }
        .section-note { font-size: 13px; color: var(--ink-soft); margin: 0; max-width: 640px; line-height: 1.45; }

        .chart-card {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 20px;
        }
        .chart-card.compact { padding: 16px; }
        .mini-title {
          font-size: 14px; font-weight: 600; color: var(--ink);
          display: flex; align-items: center; gap: 6px;
          margin: 0 0 14px;
        }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px; }

        .chart-tooltip {
          background: #060A14; color: var(--ink);
          padding: 10px 12px; border-radius: 10px; font-size: 12.5px;
          border: 1px solid var(--line);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .tooltip-label { font-weight: 700; margin-bottom: 4px; font-family: 'Space Grotesk', sans-serif; }
        .tooltip-row { display: flex; align-items: center; gap: 6px; margin-top: 2px; color: var(--ink-soft); }
        .tooltip-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

        .topic-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .topic-bar-label {
          width: 180px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 1px;
          font-size: 12.5px; font-weight: 600; color: var(--ink);
        }
        .topic-subject-chip { font-size: 10.5px; font-weight: 600; }
        .topic-bar-track { flex: 1; height: 10px; background: var(--bg-3); border-radius: 999px; overflow: hidden; }
        .topic-bar-fill { height: 100%; border-radius: 999px; }
        .topic-bar-pct { font-size: 12px; font-weight: 700; color: var(--ink-soft); width: 38px; text-align: right; font-family: 'JetBrains Mono', monospace; }

        .compare-bars { display: flex; flex-direction: column; gap: 12px; }
        .compare-row { display: flex; align-items: center; gap: 10px; }
        .compare-label { width: 110px; flex-shrink: 0; font-size: 12.5px; font-weight: 600; color: var(--ink); }
        .compare-track { flex: 1; height: 12px; background: var(--bg-3); border-radius: 999px; overflow: hidden; }
        .compare-fill { height: 100%; border-radius: 999px; }
        .compare-value { font-size: 12.5px; font-weight: 700; color: var(--ink); width: 40px; text-align: right; font-family: 'JetBrains Mono', monospace; }
        .compare-n { font-size: 10.5px; color: var(--ink-faint); width: 55px; font-family: 'JetBrains Mono', monospace; }

        .funnel { display: flex; flex-direction: column; gap: 10px; }
        .funnel-row { display: flex; align-items: center; gap: 10px; }
        .funnel-label { width: 140px; flex-shrink: 0; font-size: 12.5px; font-weight: 600; color: var(--ink); }
        .funnel-track { flex: 1; height: 14px; background: var(--bg-3); border-radius: 999px; overflow: hidden; }
        .funnel-fill { height: 100%; border-radius: 999px; background: var(--blue); }
        .funnel-value { font-size: 12px; font-weight: 700; color: var(--ink-soft); width: 50px; text-align: right; font-family: 'JetBrains Mono', monospace; }

        .ranked-list { display: flex; flex-direction: column; }
        .ranked-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid var(--bg-3);
        }
        .ranked-row:last-child { border-bottom: none; }
        .ranked-index {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--bg-3); color: var(--teal);
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-family: 'Space Grotesk', sans-serif;
        }
        .ranked-title { font-size: 12.5px; font-weight: 600; color: var(--ink); text-align: left; }
        .ranked-count { font-size: 12px; color: var(--teal); font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
        .ranked-main { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; text-align: left; }
        .ranked-meta { font-size: 10.5px; color: var(--ink-faint); font-family: 'JetBrains Mono', monospace; white-space: normal; text-align: left; }

        .callout {
          display: flex; gap: 10px; align-items: flex-start;
          background: var(--bg-2); border: 1px solid var(--line); border-radius: 14px;
          padding: 14px 16px; margin-top: 24px;
          color: var(--ink-soft); font-size: 12.5px; line-height: 1.5;
        }
        .callout svg { flex-shrink: 0; margin-top: 1px; color: var(--blue); }
        .callout code {
          background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px;
          font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
          color: var(--teal);
        }

        .pill-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0; align-items: center; }
        .year-label { font-size: 12.5px; color: var(--ink-soft); font-weight: 600; margin-right: 2px; }
        .year-select {
          background: var(--bg-2); border: 1px solid var(--line); color: var(--ink);
          font-size: 12.5px; font-weight: 600; padding: 7px 12px; border-radius: 999px;
          cursor: pointer; font-family: 'JetBrains Mono', monospace;
        }
        .year-select:hover { border-color: var(--teal); }
        .pill {
          background: var(--bg-2); border: 1px solid var(--line); color: var(--ink-soft);
          font-size: 12.5px; font-weight: 600; padding: 7px 14px; border-radius: 999px;
          cursor: pointer; transition: all 0.15s;
        }
        .pill:hover { border-color: var(--teal); color: var(--ink); }
        .pill-active { background: var(--teal); color: #05201c; border-color: var(--teal); }

        .table-scroll { overflow-x: auto; padding: 0; }
        .data-table { border-collapse: collapse; width: 100%; font-size: 12.5px; white-space: nowrap; }
        .data-table th, .data-table td {
          padding: 10px 12px; text-align: center; border-bottom: 1px solid var(--bg-3);
        }
        .data-table th {
          color: var(--teal); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em;
          background: var(--bg-2); position: sticky; top: 0;
        }
        .data-table td { color: var(--ink-soft); }
        .sticky-col {
          position: sticky; left: 0; background: var(--bg); z-index: 1;
          text-align: left !important;
        }
        .school-cell { color: var(--ink); font-weight: 600; }
        .dim-cell { color: #4A5578; }
        .cell-avg { font-weight: 700; color: var(--ink); font-family: 'JetBrains Mono', monospace; }
        .cell-frac { font-size: 10.5px; color: var(--ink-soft); }

        @media (max-width: 760px) {
          .two-col, .three-col { grid-template-columns: 1fr; }
          .topic-bar-label { width: 120px; }
        }
      `}</style>

      {/* Global Ambient Network Warning Banner */}
      <OfflineBanner />

      <header className="analytics-header">
        <div className="brand-row">
          <div className="brand-badge"><BarChart3 size={18} /></div>
          <div className="brand-text">
            <h1>Kanini Padhai · Analytics</h1>
            <span>ASSESSMENT & USAGE INSIGHTS</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            onClick={triggerRefresh}
            className="back-link"
            title="Fetch latest data from Neon PostgreSQL database"
            style={{
              background: 'rgba(96, 165, 250, 0.12)',
              borderColor: '#60A5FA',
              color: '#60A5FA',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={13} className={isRefreshing ? "spin-icon" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => navigateWithRBAC("/insights")}
            className="back-link"
            style={{
              background: 'rgba(94, 234, 212, 0.12)',
              borderColor: '#5EEAD4',
              color: '#5EEAD4',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            ✨ AI Visualizer
          </button>
          <a href="/" className="back-link">← Back to Dashboard</a>
          <span
            className="sample-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: isLive ? '#34D399' : undefined,
              color: isLive ? '#34D399' : undefined,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isLive ? '#34D399' : '#93A0BE',
                boxShadow: isLive ? '0 0 6px rgba(52, 211, 153, 0.6)' : 'none',
              }}
            />
            {isLive ? 'Live DB Synced' : 'Cached Baseline'} · {DATA.kpis.yearRange[0]}–{DATA.kpis.yearRange[1]}
          </span>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={"tab-btn" + (tab === t.id ? " tab-btn-active" : "")}
              onClick={() => setTab(t.id)}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </nav>

      <main className="analytics-main">
        {tab === "overview" && <OverviewTab refreshKey={refreshKey} onSyncStatus={handleSyncStatus} />}
        {tab === "performance" && <PerformanceTab refreshKey={refreshKey} onSyncStatus={handleSyncStatus} />}
        {tab === "school-averages" && <SchoolAveragesTab refreshKey={refreshKey} onSyncStatus={handleSyncStatus} />}
        {tab === "assessment-analysis" && <AssessmentAnalysisTab refreshKey={refreshKey} onSyncStatus={handleSyncStatus} />}
        {tab === "influences" && <InfluencesTab refreshKey={refreshKey} onSyncStatus={handleSyncStatus} />}
        {tab === "engagement" && <EngagementTab refreshKey={refreshKey} onSyncStatus={handleSyncStatus} />}
      </main>
    </div>
  );
}
