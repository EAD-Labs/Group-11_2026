import BUNDLED_CURRICULUM from "./data/curriculum_maths.json";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  Play, Gamepad2, FileText, BookOpen, Sparkles, ClipboardList,
  Search, CheckCircle2, Circle, ExternalLink, ChevronLeft,
  GraduationCap, BarChart3, Menu, X, Compass, Star, MapPin,
  User, LogOut, UserPlus, Plus, Loader2, AlertCircle, Mail, Lock, Eye, EyeOff,
  HardDrive, Download, WifiOff
} from "lucide-react";
import { SCHOOLS, STUDENTS_BY_SCHOOL } from "./schoolsData";
import OfflineBanner from "./components/OfflineBanner";
import OfflineManagerModal from "./components/OfflineManagerModal";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import {
  saveClassTrail,
  getClassTrail,
  getDownloadedClassesManifest,
  queueOfflineProgress,
  getPendingProgress,
  removeSyncedProgress
} from "./services/offlineStorage";
import { canAccessRoute, navigateWithRBAC } from "./utils/rbacGuard";

// Points at the deployed backend on Render. In production, Vercel injects
// VITE_API_BASE (set it in Project Settings → Environment Variables).
// If that's not set (e.g. running locally with `npm run dev`), it falls
// back to whichever host served this page, on port 4000 — so local dev
// still works both at localhost AND when opened from another device via
// your laptop's network IP (e.g. http://192.168.1.5:5173).
const API_BASE = (
  import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:4000`
).replace(/\/+$/, ""); // strip trailing slash(es) so paths never end up double-slashed

async function apiFetch(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // fetch() throws a generic TypeError for network failures, CORS
    // blocks, and mixed-content blocks alike — give a message that
    // actually helps someone debug it instead of "Failed to fetch".
    throw new Error(
      `Couldn't reach the server at ${API_BASE}. Make sure the backend is running, and that you're opening this app from its own localhost:5173 link (not a different domain) — mixed http/https or a different origin will silently block this.`
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const DATA = BUNDLED_CURRICULUM;

const TYPE_ICON = {
  Video: Play,
  Game: Gamepad2,
  Worksheet: FileText,
  Book: BookOpen,
  "Classroom Presentation": Sparkles,
  Simulation: Compass,
  "Teacher Material": ClipboardList,
  "Classroom Activity": ClipboardList,
  Quiz: ClipboardList,
};
function getIcon(type) {
  return TYPE_ICON[type] || FileText;
}

const TERM_LABELS = { I: "Term I", II: "Term II", III: "Term III" };

function flattenClass(terms) {
  const out = [];
  Object.entries(terms).forEach(([term, topics]) => {
    topics.forEach((topic, topicIdx) => {
      topic.items.forEach((item, itemIdx) => {
        out.push({ ...item, term, topic: topic.topic, topicIdx, itemIdx });
      });
    });
  });
  return out;
}

function flattenAllClasses(data) {
  const out = [];
  Object.entries(data.classes).forEach(([cls, terms]) => {
    flattenClass(terms).forEach((item) => out.push({ ...item, cls }));
  });
  return out;
}

// Build a smooth wavy SVG path string through a set of points
function buildWavyPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 2;
    d += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function TrailSVG({ topics, onSelect, completedCount }) {
  const width = 920;
  const height = 380;
  const margin = 90;
  const n = topics.length;
  const spacing = n > 1 ? (width - margin * 2) / (n - 1) : 0;
  const points = topics.map((t, i) => {
    const x = margin + i * spacing;
    const y = height / 2 + Math.sin(i * 1.35 + 0.4) * (height / 2 - 70);
    return { x, y };
  });
  const pathD = buildWavyPath(points);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="trail-svg"
      role="img"
      aria-label="Learning trail"
    >
      <path d={pathD} className="trail-line" />
      <path d={pathD} className="trail-line-dash" />
      {points.map((p, i) => {
        const topic = topics[i];
        const done = topic.items.length > 0 && completedCount(topic) === topic.items.length;
        const labelAbove = Math.sin(i * 1.35 + 0.4) > 0;
        return (
          <g
            key={topic.topic + i}
            transform={`translate(${p.x}, ${p.y})`}
            className="trail-node"
            onClick={() => onSelect(i)}
            tabIndex={0}
            role="button"
            aria-label={`Open ${topic.topic}`}
            onKeyDown={(e) => (e.key === "Enter" ? onSelect(i) : null)}
          >
            <circle r="30" className={"node-circle" + (done ? " node-done" : "")} />
            <text textAnchor="middle" dy="7" className="node-number">
              {i + 1}
            </text>
            <foreignObject
              x={-70}
              y={labelAbove ? -78 : 40}
              width="140"
              height="42"
            >
              <div className="node-label">{topic.topic}</div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

function ClassSubjectPicker({
  classes,
  selectedClass,
  onSelectClass,
  cachedClasses = [],
  onOpenOfflineManager,
  onDownloadCurrentClass,
  isDownloading
}) {
  const isSelectedCached = cachedClasses.includes(String(selectedClass));

  return (
    <div className="picker-row">
      <div className="class-pill-group">
        <span className="picker-eyebrow">Class</span>
        <div className="class-pills">
          {classes.map((c) => {
            const isCached = cachedClasses.includes(String(c));
            return (
              <button
                key={c}
                className={"class-pill" + (c === selectedClass ? " class-pill-active" : "")}
                onClick={() => onSelectClass(c)}
                title={isCached ? `Class ${c} is stored offline` : `Class ${c}`}
                style={{ position: 'relative' }}
              >
                {c}
                {isCached && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="picker-chip picker-active">
        <span className="picker-eyebrow">Subject</span>
        <span>Maths</span>
      </div>

      {/* Offline Status / Download Action Pill */}
      {isSelectedCached ? (
        <button
          type="button"
          onClick={onOpenOfflineManager}
          className="picker-chip"
          style={{
            cursor: 'pointer',
            borderColor: '#10B981',
            background: 'rgba(16, 185, 129, 0.08)',
            color: '#065F46',
            textAlign: 'left'
          }}
          title="Class trail is cached offline. Click to open Offline Manager."
        >
          <span className="picker-eyebrow" style={{ color: '#059669' }}>Offline Access</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}>
            <CheckCircle2 size={13} color="#10B981" /> Class {selectedClass} Cached
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onDownloadCurrentClass}
          disabled={isDownloading}
          className="picker-chip"
          style={{
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            borderColor: '#F2A93B',
            background: 'rgba(242, 169, 59, 0.1)',
            color: '#92400E',
            textAlign: 'left'
          }}
          title={`Download Class ${selectedClass} curriculum trail for offline teaching`}
        >
          <span className="picker-eyebrow" style={{ color: '#D97706' }}>Offline Cache</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}>
            <Download size={13} /> {isDownloading ? 'Saving...' : `Download Class ${selectedClass}`}
          </span>
        </button>
      )}

      <div className="picker-chip picker-disabled" title="Coming soon">
        <span className="picker-eyebrow">Medium</span>
        <span>English</span>
      </div>
      <div className="picker-chip picker-disabled" title="More subjects are coming soon">
        + More subjects soon
      </div>
    </div>
  );
}

function TopicView({ cls, term, topic, completed, toggleComplete, markOpened, onBack, isClassCached }) {
  const doneCount = topic.items.filter((it) =>
    completed.has(`${cls}-${term}-${topic.topic}-${it.title}`)
  ).length;

  return (
    <div className="topic-view">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={18} /> Back to trail
      </button>

      <div className="topic-header">
        <span className="eyebrow">{TERM_LABELS[term]}</span>
        <h2>{topic.topic}</h2>
        {topic.slice && topic.slice.sliceName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(94, 234, 212, 0.15)', color: '#0F766E', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, marginTop: '4px', marginBottom: '8px' }}>
            <span>Assessment Slice: {topic.slice.sliceName}</span>
          </div>
        )}
        <div className="topic-progress-row">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(doneCount / topic.items.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            {doneCount} / {topic.items.length} stops complete
          </span>
        </div>
        <p className="auto-mark-note">Marked automatically when you open a resource — use "Mark done" to undo one.</p>
      </div>

      <div className="step-trail">
        {topic.items.map((item, i) => {
          const Icon = getIcon(item.type);
          const key = `${cls}-${term}-${topic.topic}-${item.title}`;
          const done = completed.has(key);
          const isStream = item.type === 'Video' || item.type === 'Classroom Presentation';

          return (
            <div className="step-row" key={key}>
              <div className="step-line-wrap">
                <div className={"step-node" + (done ? " step-node-done" : "")}>
                  {done ? <CheckCircle2 size={18} /> : <span>{i + 1}</span>}
                </div>
                {i < topic.items.length - 1 && <div className="step-connector" />}
              </div>
              <div className="step-card">
                <div className="step-card-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {item.phase && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#1E293B', border: '1px solid #CBD5E1' }}>
                        {item.phase}
                      </span>
                    )}
                    <span className="type-chip">
                      <Icon size={14} /> {item.type}
                    </span>
                    <span className="source-chip">{item.package}</span>
                    {item.durationMinutes && (
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                        ⏱ {item.durationMinutes}m
                      </span>
                    )}
                  </div>

                  {/* Offline readiness badge */}
                  {isClassCached ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isStream ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: isStream ? '#B45309' : '#065F46',
                        border: `1px solid ${isStream ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={isStream ? 'Video streaming requires internet' : 'Available offline on this device'}
                    >
                      {isStream ? '⚡ Stream' : '✓ Offline Ready'}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(100, 116, 139, 0.1)',
                        color: '#64748B'
                      }}
                    >
                      Online Only
                    </span>
                  )}
                </div>
                <h3>{item.title}</h3>
                {item.desc && <p>{item.desc}</p>}
                <div className="step-card-actions">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    onClick={() => markOpened({ key, cls, term, topic: topic.topic })}
                  >
                    Open <ExternalLink size={14} />
                  </a>
                  <button
                    className={"btn-ghost" + (done ? " btn-ghost-done" : "")}
                    onClick={() => toggleComplete({ key, cls, term, topic: topic.topic })}
                  >
                    {done ? (
                      <>
                        <CheckCircle2 size={16} /> Done
                      </>
                    ) : (
                      <>
                        <Circle size={16} /> Mark done
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {topic.total_resources > topic.items.length && (
        <div className="more-note">
          <MapPin size={16} />
          <span>
            {topic.total_resources - topic.items.length} more resources exist for{" "}
            {topic.topic} in the full library — we'll surface these once the pilot
            is approved.
          </span>
        </div>
      )}
    </div>
  );
}

function SearchView({ allItems }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allItems.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.desc && it.desc.toLowerCase().includes(q)) ||
        it.type.toLowerCase().includes(q) ||
        it.topic.toLowerCase().includes(q) ||
        it.package.toLowerCase().includes(q)
    );
  }, [query, allItems]);

  const quickTopics = useMemo(() => {
    const seen = new Set();
    const out = [];
    allItems.forEach((it) => {
      if (!seen.has(it.topic)) {
        seen.add(it.topic);
        out.push(it.topic);
      }
    });
    return out;
  }, [allItems]);

  return (
    <div className="search-view">
      <div className="search-hero">
        <h2>Search &amp; study</h2>
        <p>Look up a topic, a game, a worksheet — anything in the Class 3 Maths library.</p>
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Try 'time', 'multiplication', 'geometry'…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!query && (
        <div className="quick-chips">
          {quickTopics.map((t) => (
            <button key={t} className="quick-chip" onClick={() => setQuery(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {query && (
        <div className="search-results">
          <p className="results-count">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((item, i) => {
            const Icon = getIcon(item.type);
            return (
              <a
                key={item.title + i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="result-row"
              >
                <span className="result-icon">
                  <Icon size={18} />
                </span>
                <span className="result-body">
                  <span className="result-title">{item.title}</span>
                  <span className="result-meta">
                    Class {item.cls} · {item.topic} · {TERM_LABELS[item.term]} · {item.package}
                  </span>
                </span>
                <ExternalLink size={16} className="result-ext" />
              </a>
            );
          })}
          {results.length === 0 && (
            <p className="no-results">Nothing matched that search yet. Try a different word.</p>
          )}
        </div>
      )}
    </div>
  );
}

// function AssessmentView() {
//   return (
//     <div className="assessment-view">
//       <div className="assessment-card">
//         <span className="eyebrow">Assessment</span>
//         <h2>School &amp; student performance reports</h2>
//         <p>
//           Kanini's existing assessment portal already tracks school average scores,
//           oral and written analysis, and correlation reports across years. For this
//           pilot, it stays a linked destination — full in-app score views are next,
//           once we've reviewed real report data together.
//         </p>
//         <a
//           href="https://kanini.ashanet.org/admin"
//           target="_blank"
//           rel="noopener noreferrer"
//           className="btn-primary btn-large"
//         >
//           Open Assessment Portal <ExternalLink size={16} />
//         </a>
//         <div className="assessment-list">
//           <div className="assessment-item">
//             <BarChart3 size={16} /> School Average Scores
//           </div>
//           <div className="assessment-item">
//             <BarChart3 size={16} /> Oral &amp; Written Assessment Analysis
//           </div>
//           <div className="assessment-item">
//             <BarChart3 size={16} /> Analysis Across Years
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

function AccountPanel({
  teacher,
  onLogin,
  onRegister,
  onGoogleLogin,
  onLogout,
  students,
  studentsLoading,
  selectedStudentId,
  onSelectStudent,
  onAddStudent,
  onRemoveStudent,
  authLoading,
  authError,
}) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", schoolName: "" });
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("3");
  const [showPassword, setShowPassword] = useState(false);

  // Students already on this teacher's roster, so they can't be picked again
  // from the dropdown below.
  const takenNames = new Set(students.map((s) => s.name));
  const schoolRoster = STUDENTS_BY_SCHOOL[teacher?.school_name] || [];
  const availableStudents = schoolRoster.filter((s) => !takenNames.has(s.name));

  function submitAuth(e) {
    e.preventDefault();
    if (mode === "login") {
      onLogin({ email: form.email, password: form.password });
    } else {
      onRegister(form);
    }
  }

  function submitStudent(e) {
    e.preventDefault();
    if (!newStudentName) return;
    const picked = schoolRoster.find((s) => s.name === newStudentName);
    if (!picked) return;
    onAddStudent({ name: picked.name, classLevel: String(picked.classLevel) });
    setNewStudentName("");
  }

  if (!teacher) {
    return (
      <div className="account-view">
        <div className="account-card">
          <div className="account-welcome">
            <div className="account-badge">
              <User size={22} />
            </div>
            <h2>{mode === "login" ? "Welcome back" : "Join Kanini Padhai"}</h2>
            <p>
              {mode === "login"
                ? "Log in to see your students' saved progress."
                : "Create a teacher account to add students and track their trail."}
            </p>
          </div>

          <div className="account-tabs">
            <button
              className={"account-tab" + (mode === "login" ? " account-tab-active" : "")}
              onClick={() => setMode("login")}
              type="button"
            >
              Log in
            </button>
            <button
              className={"account-tab" + (mode === "register" ? " account-tab-active" : "")}
              onClick={() => setMode("register")}
              type="button"
            >
              Create account
            </button>
          </div>

          {onGoogleLogin && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", margin: "16px 0 10px 0" }}>
              <GoogleLogin
                onSuccess={(credentialResponse) => onGoogleLogin(credentialResponse.credential)}
                onError={() => {}}
                theme="outline"
                shape="pill"
                size="medium"
                text={mode === "login" ? "signin_with" : "signup_with"}
              />
              <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "8px", color: "var(--muted, #94A3B8)", fontSize: "0.78rem" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border, rgba(0,0,0,0.1))" }} />
                <span>or with email</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border, rgba(0,0,0,0.1))" }} />
              </div>
            </div>
          )}

          <form onSubmit={submitAuth} className="account-form">
            {mode === "register" && (
              <>
                <label>
                  Your name
                  <div className="input-wrap">
                    <User size={16} />
                    <input
                      required
                      placeholder="e.g. Priya Ramesh"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </label>
                <label>
                  School
                  <div className="input-wrap">
                    <BookOpen size={16} />
                    <select
                      required
                      value={form.schoolName}
                      onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                    >
                      <option value="" disabled>
                        Select your school
                      </option>
                      {SCHOOLS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </>
            )}
            <label>
              Email
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </label>
            <label>
              Password
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {authError && (
              <div className="form-error">
                <AlertCircle size={14} /> {authError}
              </div>
            )}

            <button className="btn-primary btn-large btn-block" type="submit" disabled={authLoading}>
              {authLoading ? (
                <Loader2 size={16} className="spin" />
              ) : mode === "login" ? (
                "Log in"
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="account-view">
      <div className="account-card">
        <div className="account-header-row">
          <div>
            <span className="eyebrow">Signed in</span>
            <h3>{teacher.name}</h3>
            <p className="account-email">{teacher.email}</p>
          </div>
          <button className="btn-ghost" onClick={onLogout}>
            <LogOut size={15} /> Log out
          </button>
        </div>

        <div className="students-section">
          <h4>Students</h4>
          {studentsLoading && <p className="muted-text">Loading students…</p>}
          {!studentsLoading && students.length === 0 && (
            <p className="muted-text">No students yet — add one below.</p>
          )}
          <div className="student-list">
            {students.map((s) => (
              <div
                key={s.id}
                className={"student-row" + (s.id === selectedStudentId ? " student-row-active" : "")}
              >
                <button className="student-row-main" onClick={() => onSelectStudent(s.id)}>
                  <span className="student-avatar">
                    <User size={14} />
                  </span>
                  <span className="student-name">{s.name}</span>
                  <span className="student-class">Class {s.class_level}</span>
                </button>
                <button
                  className="student-remove"
                  title="Remove from this session"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveStudent(s.id);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={submitStudent} className="add-student-form">
            <select
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            >
              <option value="">
                {availableStudents.length ? "Select a student" : "No more students at this school"}
              </option>
              {availableStudents.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} (Class {s.classLevel})
                </option>
              ))}
            </select>
            <button className="btn-primary" type="submit" disabled={!newStudentName}>
              <Plus size={15} /> Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


export default function App({ initialAuthNotice }) {
  // Read initial route parameters from URL query if present
  const [selectedClass, setSelectedClass] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const c = params.get("class");
      if (c && ["1", "2", "3", "4", "5", "6", "7", "8"].includes(c)) return c;
    }
    return "3";
  });
  const [term, setTerm] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("term");
      if (t && ["I", "II", "III"].includes(t)) return t;
    }
    return "I";
  });
  const [topicIdx, setTopicIdx] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const idx = params.get("topic");
      if (idx !== null && !isNaN(parseInt(idx, 10))) return parseInt(idx, 10);
    }
    return null;
  });
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("topic") !== null) return "topic";
      const v = params.get("view");
      if (v) return v;
    }
    return "home";
  });

  const [completed, setCompleted] = useState(new Set());
  const [navOpen, setNavOpen] = useState(false);

  // --- Multi-tier Network Detection ---
  const { status: networkStatus } = useNetworkStatus();

  // --- Offline Storage & Download Management State ---
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [cachedClasses, setCachedClasses] = useState([]);
  const [isDownloadingClass, setIsDownloadingClass] = useState(false);

  // --- Dynamic Curriculum Tree (with local bundled fallback) ---
  const [curriculumData, setCurriculumData] = useState(BUNDLED_CURRICULUM);

  useEffect(() => {
    let isMounted = true;
    async function fetchDirectory() {
      try {
        const res = await fetch("/api/content/directory");
        if (res.ok) {
          const liveData = await res.json();
          if (isMounted && liveData && liveData.classes) {
            setCurriculumData(liveData);
          }
        }
      } catch (err) {
        console.info("[Curriculum] Using bundled offline curriculum:", err.message);
      }
    }
    fetchDirectory();
    return () => {
      isMounted = false;
    };
  }, [networkStatus]);

  const activeCurriculum = curriculumData && curriculumData.classes ? curriculumData : DATA;

  // --- Auth + student + progress state (talks to the backend API) ---
  const [teacher, setTeacher] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [syncError, setSyncError] = useState(() => initialAuthNotice || "");

  // Synchronizes the browser URL and history stack with in-app trail navigation
  function updateHistoryState(nextClass, nextTerm, nextTopicIdx, nextView) {
    if (typeof window === "undefined" || !window.history) return;
    const params = new URLSearchParams();
    if (nextClass && nextClass !== "3") params.set("class", nextClass);
    if (nextTerm && nextTerm !== "I") params.set("term", nextTerm);
    if (nextTopicIdx !== null && nextTopicIdx !== undefined) params.set("topic", nextTopicIdx);
    if (nextView && nextView !== "home") params.set("view", nextView);

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : "/";
    const stateObj = {
      selectedClass: nextClass,
      term: nextTerm,
      topicIdx: nextTopicIdx,
      view: nextView
    };

    if (window.location.search === (queryString ? `?${queryString}` : "")) {
      window.history.replaceState(stateObj, "", newUrl);
    } else {
      window.history.pushState(stateObj, "", newUrl);
    }
  }

  // Intercept browser Back / Forward buttons (popstate) to navigate inside the trail without leaving or jumping to unauthenticated states
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state) {
        if (state.selectedClass) setSelectedClass(state.selectedClass);
        if (state.term) setTerm(state.term);
        setTopicIdx(state.topicIdx !== undefined ? state.topicIdx : null);
        if (state.view) setView(state.view);
      } else {
        const params = new URLSearchParams(window.location.search);
        const c = params.get("class");
        const t = params.get("term");
        const top = params.get("topic");
        const v = params.get("view");

        if (c && ["1", "2", "3", "4", "5", "6", "7", "8"].includes(c)) setSelectedClass(c);
        if (t && ["I", "II", "III"].includes(t)) setTerm(t);
        setTopicIdx(top !== null && !isNaN(parseInt(top, 10)) ? parseInt(top, 10) : null);
        setView(top !== null ? "topic" : (v || "home"));
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load downloaded classes manifest from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const manifest = await getDownloadedClassesManifest();
        if (manifest && manifest.length > 0) {
          setCachedClasses(manifest.map((item) => String(item.classId)));
        } else if (activeCurriculum && activeCurriculum.classes && activeCurriculum.classes['3']) {
          // Pre-buffer Class 3 into IndexedDB on first load for zero-config offline teaching
          await saveClassTrail('3', activeCurriculum.classes['3']);
          setCachedClasses(['3']);
        }
      } catch (e) {
        console.warn('Could not read offline manifest:', e);
      }
    })();
  }, [activeCurriculum]);

  // Download the currently selected class for offline use
  async function handleDownloadCurrentClass() {
    if (!activeCurriculum.classes || !activeCurriculum.classes[selectedClass]) return;
    setIsDownloadingClass(true);
    try {
      await saveClassTrail(selectedClass, activeCurriculum.classes[selectedClass]);
      setCachedClasses((prev) => Array.from(new Set([...prev, String(selectedClass)])));
      setSyncError(`✓ Class ${selectedClass} curriculum trail saved for offline use!`);
      setTimeout(() => setSyncError(''), 4000);
    } catch (e) {
      setSyncError(`Failed to save Class ${selectedClass}: ${e.message}`);
    } finally {
      setIsDownloadingClass(false);
    }
  }

  // Background Outbox Sync Reconciler
  // When online connectivity resumes, flush queued progress mutations to backend
  useEffect(() => {
    if ((networkStatus === 'ONLINE_HIGH_SPEED' || networkStatus === 'ONLINE_SLOW') && accessToken) {
      (async () => {
        try {
          const pending = await getPendingProgress();
          if (pending && pending.length > 0) {
            console.log(`[Offline Sync] Reconciling ${pending.length} pending mutations...`);
            const syncedIds = [];
            for (const item of pending) {
              try {
                if (item.action === 'DELETE') {
                  await apiFetch(
                    `/api/students/${item.studentId}/progress/${encodeURIComponent(item.payload.resourceKey)}?subject=Maths`,
                    { method: 'DELETE', token: accessToken }
                  );
                } else {
                  await apiFetch(`/api/students/${item.studentId}/progress`, {
                    method: 'POST',
                    token: accessToken,
                    body: item.payload
                  });
                }
                syncedIds.push(item.id);
              } catch (err) {
                console.error('[Offline Sync] Failed mutation replay:', err);
                if (!navigator.onLine || err.message.includes('reach the server')) break;
              }
            }

            if (syncedIds.length > 0) {
              await removeSyncedProgress(syncedIds);
              setSyncError(`✓ Synced ${syncedIds.length} offline progress updates with server!`);
              setTimeout(() => setSyncError(''), 4500);
            }
          }
        } catch (err) {
          console.error('[Offline Sync] Error checking pending progress:', err);
        }
      })();
    }
  }, [networkStatus, accessToken]);

  // NOTE: students are intentionally NOT fetched from the backend on
  // login/register. Each session starts with an empty roster in the UI —
  // adding a student still persists it (and all their progress) to the
  // backend permanently, but a fresh login won't re-show previously added
  // students. This is deliberate, not a bug: the backend keeps the full
  // history of students and what they did, but the "who's active right
  // now" list is session-scoped on the frontend.

  async function handleLogin({ email, password }) {
    setAuthLoading(true);
    setAuthError("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setTeacher(data.teacher);
      setAccessToken(data.accessToken);
      localStorage.setItem("kp_token", data.accessToken);
      if (typeof window !== "undefined") {
        window.history.replaceState({ authenticated: true }, document.title, window.location.href);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(form) {
    setAuthLoading(true);
    setAuthError("");
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: form,
      });
      setTeacher(data.teacher);
      setAccessToken(data.accessToken);
      localStorage.setItem("kp_token", data.accessToken);
      if (typeof window !== "undefined") {
        window.history.replaceState({ authenticated: true }, document.title, window.location.href);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleGoogleLogin(credential) {
    setAuthLoading(true);
    setAuthError("");
    try {
      const data = await apiFetch("/api/auth/google", {
        method: "POST",
        body: { credential },
      });
      setTeacher(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem("kp_token", data.accessToken);
      localStorage.setItem("kp_user", JSON.stringify(data.user));
      if (typeof window !== "undefined") {
        window.history.replaceState({ authenticated: true }, document.title, window.location.href);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // Restore session from localStorage if present
  useEffect(() => {
    const token = localStorage.getItem("kp_token");
    if (token) {
      setAccessToken(token);
      apiFetch("/api/auth/me", { token })
        .then((data) => {
          if (data && data.user) {
            setTeacher(data.user);
          }
        })
        .catch(() => {});
    }
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // ignore — we're logging out client-side regardless
    }
    setTeacher(null);
    setAccessToken(null);
    localStorage.removeItem("kp_token");
    localStorage.removeItem("kp_user");
    setStudents([]);
    setSelectedStudentId(null);
    setCompleted(new Set());
    if (typeof window !== "undefined") {
      window.history.replaceState(null, document.title, window.location.pathname);
    }
  }

  async function handleAddStudent({ name, classLevel }) {
    try {
      const data = await apiFetch("/api/students", {
        method: "POST",
        token: accessToken,
        body: { name, classLevel: Number(classLevel) },
      });
      setStudents((prev) => [...prev, data.student]);
      setSelectedStudentId(data.student.id);
    } catch (err) {
      setSyncError(err.message);
    }
  }

  // Removes a student from THIS session's visible list only. Does not call
  // any delete endpoint — the student row and all their recorded progress
  // stay in the backend permanently. This just lets a teacher undo an
  // accidental add, or tidy up who's shown as "currently in session"
  // without losing any activity history server-side.
  function handleRemoveStudent(id) {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSelectedStudentId((prev) => (prev === id ? null : prev));
  }

  async function handleSelectStudent(id) {
    setSelectedStudentId(id);
  }

  // Load a student's saved progress whenever the selected student changes
  useEffect(() => {
    if (!teacher || !selectedStudentId || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(
          `/api/students/${selectedStudentId}/progress?subject=Maths`,
          { token: accessToken }
        );
        if (cancelled) return;
        setCompleted(new Set(data.progress.map((p) => p.resource_key)));
      } catch (err) {
        if (!cancelled) setSyncError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teacher, selectedStudentId, accessToken]);

  const classList = useMemo(
    () => Object.keys(activeCurriculum.classes || {}).sort((a, b) => Number(a) - Number(b)),
    [activeCurriculum]
  );
  const allItems = useMemo(() => flattenAllClasses(activeCurriculum), [activeCurriculum]);
  const totalItems = allItems.length;
  const totalDone = completed.size;

  // Marks/unmarks a resource complete. If logged in with a student selected,
  // this syncs to the backend (or queues locally in IndexedDB if offline).
  async function toggleComplete({ key, cls, term: t, topic }) {
    const isDone = completed.has(key);
    setCompleted((prev) => {
      const next = new Set(prev);
      isDone ? next.delete(key) : next.add(key);
      return next;
    });

    if (!teacher || !selectedStudentId) return;

    // Fast-path: If offline, queue directly into IndexedDB without network timeout
    if (networkStatus === 'OFFLINE') {
      await queueOfflineProgress({
        studentId: selectedStudentId,
        action: isDone ? 'DELETE' : 'POST',
        payload: { subject: "Maths", classLevel: Number(cls), term: t, topic, resourceKey: key }
      });
      setSyncError('Offline: Activity updated locally. Will auto-sync when online.');
      return;
    }

    try {
      if (isDone) {
        await apiFetch(
          `/api/students/${selectedStudentId}/progress/${encodeURIComponent(key)}?subject=Maths`,
          { method: "DELETE", token: accessToken }
        );
      } else {
        await apiFetch(`/api/students/${selectedStudentId}/progress`, {
          method: "POST",
          token: accessToken,
          body: { subject: "Maths", classLevel: Number(cls), term: t, topic, resourceKey: key },
        });
      }
    } catch (err) {
      // Check if failure is due to offline/drop in connectivity
      if (!navigator.onLine || err.message.includes('reach the server') || err.message.includes('fetch')) {
        await queueOfflineProgress({
          studentId: selectedStudentId,
          action: isDone ? 'DELETE' : 'POST',
          payload: { subject: "Maths", classLevel: Number(cls), term: t, topic, resourceKey: key }
        });
        setSyncError('Connection drop: Progress saved locally and queued for auto-sync.');
        return;
      }

      // Revert optimistic update only for real server/validation errors
      setCompleted((prev) => {
        const next = new Set(prev);
        isDone ? next.add(key) : next.delete(key);
        return next;
      });
      setSyncError(err.message);
    }
  }

  // Fired automatically the moment someone clicks "Open" on a resource.
  // Idempotent — clicking Open again on an already-marked resource does
  // nothing (unlike toggleComplete, this never un-marks).
  async function markOpened({ key, cls, term: t, topic }) {
    if (completed.has(key)) return;

    setCompleted((prev) => new Set(prev).add(key));

    if (!teacher || !selectedStudentId) return;

    if (networkStatus === 'OFFLINE') {
      await queueOfflineProgress({
        studentId: selectedStudentId,
        action: 'POST',
        payload: { subject: "Maths", classLevel: Number(cls), term: t, topic, resourceKey: key }
      });
      setSyncError('Offline: Activity recorded locally. Will sync when reconnected.');
      return;
    }

    try {
      await apiFetch(`/api/students/${selectedStudentId}/progress`, {
        method: "POST",
        token: accessToken,
        body: { subject: "Maths", classLevel: Number(cls), term: t, topic, resourceKey: key },
      });
    } catch (err) {
      if (!navigator.onLine || err.message.includes('reach the server') || err.message.includes('fetch')) {
        await queueOfflineProgress({
          studentId: selectedStudentId,
          action: 'POST',
          payload: { subject: "Maths", classLevel: Number(cls), term: t, topic, resourceKey: key }
        });
        setSyncError('Connection drop: Activity saved locally and will auto-sync.');
        return;
      }

      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setSyncError(err.message);
    }
  }

  function completedCountForTopic(topic) {
    return topic.items.filter((it) =>
      completed.has(`${selectedClass}-${term}-${topic.topic}-${it.title}`)
    ).length;
  }

  function openTopic(i) {
    setTopicIdx(i);
    setView("topic");
    updateHistoryState(selectedClass, term, i, "topic");
  }

  function goHome() {
    setView("home");
    setTopicIdx(null);
    updateHistoryState(selectedClass, term, null, "home");
  }

  function selectClass(c) {
    setSelectedClass(c);
    setTopicIdx(null);
    setTerm("I");
    updateHistoryState(c, "I", null, "home");
  }

  function handleSelectTerm(t) {
    setTerm(t);
    setTopicIdx(null);
    updateHistoryState(selectedClass, t, null, view);
  }

  function openSearch() {
    setView("search");
    setNavOpen(false);
    updateHistoryState(selectedClass, term, null, "search");
  }

  function openAccount() {
    setView("account");
    setNavOpen(false);
    updateHistoryState(selectedClass, term, null, "account");
  }

  const classTerms = (activeCurriculum && activeCurriculum.classes && activeCurriculum.classes[selectedClass]) || {};
  const availableTerms = Object.keys(classTerms).filter(
    (t) => classTerms[t] && classTerms[t].length > 0
  );
  const activeTerm = classTerms[term] && classTerms[term].length > 0 ? term : (availableTerms[0] || "I");
  const currentTopics = classTerms[activeTerm] || [];
  const currentTopic = topicIdx !== null ? currentTopics[topicIdx] : null;

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

        :root {
          --paper: #F3F7F0;
          --paper-2: #EAF1E6;
          --ink: #223027;
          --ink-soft: #5B6B5F;
          --chalk: #1F4037;
          --chalk-2: #29524A;
          --marigold: #F2A93B;
          --marigold-dark: #D98E1F;
          --sky: #3E8FB0;
          --coral: #E4572E;
          --line: #D3E0CD;
          --white: #FFFFFF;
          --radius: 16px;
          color-scheme: light;
        }

        .app-root { color-scheme: light; }

        * { box-sizing: border-box; }

        .app-root {
          font-family: 'Work Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          width: 100%;
        }

        .app-root h1, .app-root h2, .app-root h3 {
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
          margin: 0;
        }

        button, input {
          font-family: inherit;
        }

        a { color: inherit; }

        /* Header */
        .header {
          background: var(--chalk);
          color: var(--white);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .brand-badge {
          width: 36px; height: 36px;
          background: var(--marigold);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--chalk);
          font-family: 'Fredoka', sans-serif;
          font-weight: 700;
          font-size: 18px;
        }
        .brand-text h1 { font-size: 18px; color: var(--white); line-height: 1.1; }
        .brand-text span { font-size: 11px; color: #B9D3C6; font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.03em; }

        .nav {
          display: flex;
          gap: 6px;
        }
        .nav-btn {
          background: transparent;
          border: none;
          color: #CFE4D9;
          padding: 8px 14px;
          border-radius: 999px; 
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: var(--white); }
        .nav-btn-active { background: var(--marigold); color: var(--chalk); font-weight: 600; }
        .nav-btn-active:hover { background: var(--marigold); color: var(--chalk); }

        .stars-chip {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.08);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 13px;
          color: var(--white);
          font-family: 'IBM Plex Mono', monospace;
        }

        .menu-toggle {
          display: none;
          background: transparent; border: none; color: var(--white); cursor: pointer;
        }

        /* Main container */
        .main {
          max-width: 1040px;
          margin: 0 auto;
          padding: 28px 20px 64px;
        }

        /* Hero */
        .hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .hero-text h2 {
          font-size: 30px;
          color: var(--chalk);
          margin-bottom: 6px;
        }
        .hero-text p {
          color: var(--ink-soft);
          font-size: 15px;
          max-width: 480px;
          margin: 0;
        }
        .hero-tamil {
          font-family: 'Fredoka', sans-serif;
          font-size: 15px;
          color: var(--sky);
          margin-bottom: 4px;
          display: block;
        }

        .picker-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .picker-chip {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          font-size: 13px;
          font-weight: 600;
          min-width: 70px;
        }
        .picker-eyebrow {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-soft);
          font-weight: 500;
          font-family: 'IBM Plex Mono', monospace;
        }
        .picker-active { border-color: var(--marigold); background: #FFF7E8; }
        .picker-disabled { color: var(--ink-soft); opacity: 0.6; font-weight: 500; justify-content: center; cursor: default; }

        .class-pill-group {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .class-pills { display: flex; gap: 4px; }
        .class-pill {
          width: 26px; height: 26px;
          border-radius: 7px;
          border: 1.5px solid var(--line);
          background: var(--paper);
          color: var(--ink-soft);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .class-pill:hover { border-color: var(--marigold); }
        .class-pill-active { background: var(--marigold); border-color: var(--marigold-dark); color: var(--chalk); }

        /* Term tabs */
        .term-tabs {
          display: flex;
          gap: 8px;
          margin: 28px 0 8px;
        }
        .term-tab {
          background: var(--white);
          border: 1.5px solid var(--line);
          padding: 8px 18px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          color: var(--ink-soft);
        }
        .term-tab-active {
          background: var(--chalk);
          border-color: var(--chalk);
          color: var(--white);
        }

        /* Trail SVG */
        .trail-wrap {
          background: var(--white);
          border-radius: 24px;
          padding: 10px 10px 30px;
          border: 1px solid var(--line);
          margin-top: 12px;
        }
        .trail-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .trail-line {
          fill: none;
          stroke: var(--line);
          stroke-width: 10;
          stroke-linecap: round;
        }
        .trail-line-dash {
          fill: none;
          stroke: var(--marigold);
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 2 14;
        }
        .trail-node { cursor: pointer; outline: none; }
        .node-circle {
          fill: var(--white);
          stroke: var(--chalk);
          stroke-width: 3;
          transition: transform 0.15s ease;
        }
        .trail-node:hover .node-circle, .trail-node:focus .node-circle {
          transform: scale(1.08);
          fill: #FFF7E8;
        }
        .node-done { fill: var(--marigold); stroke: var(--marigold-dark); }
        .node-number {
          font-family: 'Fredoka', sans-serif;
          font-weight: 700;
          font-size: 20px;
          fill: var(--chalk);
          pointer-events: none;
        }
        .node-label {
          font-family: 'Work Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          text-align: center;
          color: var(--chalk);
          line-height: 1.2;
        }

        /* Topic view */
        .back-btn {
          display: flex; align-items: center; gap: 4px;
          background: none; border: none;
          color: var(--sky);
          font-weight: 600;
          cursor: pointer;
          padding: 6px 0;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .topic-header { margin-bottom: 28px; }
        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--sky);
          font-weight: 600;
        }
        .topic-header h2 { font-size: 28px; color: var(--chalk); margin: 4px 0 14px; }
        .topic-progress-row { display: flex; align-items: center; gap: 12px; }
        .progress-track {
          flex: 1;
          height: 8px;
          background: var(--paper-2);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--marigold);
          border-radius: 999px;
          transition: width 0.2s ease;
        }
        .progress-text { font-size: 13px; color: var(--ink-soft); white-space: nowrap; font-weight: 600; }
        .auto-mark-note { font-size: 12.5px; color: var(--ink-soft); margin: 8px 0 0; font-style: italic; }

        .step-trail { display: flex; flex-direction: column; }
        .step-row { display: flex; gap: 16px; }
        .step-line-wrap { display: flex; flex-direction: column; align-items: center; }
        .step-node {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--white);
          border: 2.5px solid var(--chalk);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          font-family: 'Fredoka', sans-serif;
          color: var(--chalk);
          flex-shrink: 0;
        }
        .step-node-done { background: var(--marigold); border-color: var(--marigold-dark); color: var(--chalk); }
        .step-connector { width: 2.5px; flex: 1; background: var(--line); margin: 4px 0; min-height: 24px; }

        .step-card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 16px 18px;
          margin-bottom: 20px;
          flex: 1;
        }
        .step-card-top { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .type-chip {
          display: flex; align-items: center; gap: 5px;
          background: #EAF3EF;
          color: var(--chalk-2);
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .source-chip {
          background: var(--paper-2);
          color: var(--ink-soft);
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
        }
        .step-card h3 { font-size: 16px; margin-bottom: 4px; color: var(--ink); }
        .step-card p { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 12px; line-height: 1.4; }
        .step-card-actions { display: flex; gap: 10px; align-items: center; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--marigold);
          color: var(--chalk);
          padding: 9px 16px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13.5px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: var(--marigold-dark); }
        .btn-large { padding: 12px 22px; font-size: 15px; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: none;
          border: 1.5px solid var(--line);
          color: var(--ink-soft);
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
        }
        .btn-ghost-done { border-color: var(--marigold-dark); color: var(--marigold-dark); }

        .more-note {
          display: flex; align-items: flex-start; gap: 8px;
          background: #EAF1E6;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 13.5px;
          color: var(--chalk-2);
          margin-top: 8px;
        }

        /* Search */
        .search-hero h2 { font-size: 26px; color: var(--chalk); margin-bottom: 6px; }
        .search-hero p { color: var(--ink-soft); font-size: 14.5px; margin: 0 0 18px; }
        .search-input-wrap {
          display: flex; align-items: center; gap: 10px;
          background: var(--white);
          border: 1.5px solid var(--line);
          border-radius: 14px;
          padding: 12px 16px;
          color: var(--ink-soft);
        }
        .search-input-wrap input {
          border: none; outline: none; flex: 1; font-size: 15px; background: transparent; color: var(--ink);
        }
        .clear-btn { background: none; border: none; cursor: pointer; color: var(--ink-soft); display: flex; }

        .quick-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
        .quick-chip {
          background: var(--white);
          border: 1px solid var(--line);
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          color: var(--chalk-2);
        }
        .quick-chip:hover { border-color: var(--marigold); }

        .search-results { margin-top: 22px; }
        .results-count { font-size: 12.5px; color: var(--ink-soft); font-family: 'IBM Plex Mono', monospace; margin-bottom: 10px; }
        .result-row {
          display: flex; align-items: center; gap: 12px;
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 8px;
          text-decoration: none;
          color: var(--ink);
          transition: border-color 0.15s;
        }
        .result-row:hover { border-color: var(--marigold); }
        .result-icon { color: var(--sky); flex-shrink: 0; }
        .result-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .result-title { font-weight: 600; font-size: 14.5px; }
        .result-meta { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
        .result-ext { color: var(--ink-soft); flex-shrink: 0; }
        .no-results { color: var(--ink-soft); font-size: 14px; margin-top: 20px; }

        /* Assessment */
        .assessment-card {
          background: var(--chalk);
          color: var(--white);
          border-radius: 24px;
          padding: 36px;
          max-width: 620px;
        }
        .assessment-card .eyebrow { color: var(--marigold); }
        .assessment-card h2 { font-size: 24px; color: var(--white); margin: 8px 0 14px; }
        .assessment-card p { color: #CFE4D9; font-size: 14.5px; line-height: 1.55; margin: 0 0 22px; }
        .assessment-list { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
        .assessment-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13.5px; color: #B9D3C6;
          background: rgba(255,255,255,0.06);
          padding: 10px 14px;
          border-radius: 10px;
        }
      
        /* Account / auth */
        .account-view { display: flex; justify-content: center; }
        .account-card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 32px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 12px 32px rgba(31, 64, 55, 0.08);
        }
        .account-welcome { text-align: center; margin-bottom: 24px; }
        .account-badge {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, var(--marigold), var(--marigold-dark));
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: var(--chalk);
          margin: 0 auto 14px;
        }
        .account-welcome h2 { font-size: 22px; color: var(--chalk); margin-bottom: 6px; }
        .account-welcome p { font-size: 13.5px; color: var(--ink-soft); margin: 0; line-height: 1.4; }

        .account-tabs { display: flex; gap: 4px; margin-bottom: 22px; background: var(--paper-2); border-radius: 12px; padding: 4px; }
        .account-tab {
          flex: 1; background: none; border: none; padding: 9px; border-radius: 9px;
          font-weight: 600; font-size: 13.5px; color: var(--ink-soft); cursor: pointer;
          font-family: 'Work Sans', sans-serif;
        }
        .account-tab-active { background: var(--white); color: var(--chalk); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
        .account-form { display: flex; flex-direction: column; gap: 16px; }
        .account-form label {
          display: flex; flex-direction: column; gap: 7px;
          font-size: 13px; font-weight: 600; color: var(--chalk-2);
        }
        .label-optional { font-weight: 400; color: var(--ink-soft); }

        .input-wrap {
          display: flex; align-items: center; gap: 9px;
          background: var(--paper);
          border: 1.5px solid var(--line);
          border-radius: 12px;
          padding: 0 12px;
          color: var(--ink-soft);
          transition: border-color 0.15s, background 0.15s;
        }
        .input-wrap:focus-within {
          border-color: var(--marigold);
          background: var(--white);
        }
        .input-wrap input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 11px 0;
          font-size: 14.5px;
          color: var(--ink);
          font-family: 'Work Sans', sans-serif;
        }
        .input-wrap input::placeholder { color: #9CAB9F; }
        .input-icon-btn {
          background: none; border: none; color: var(--ink-soft); cursor: pointer;
          display: flex; padding: 4px;
        }
        .input-icon-btn:hover { color: var(--chalk); }

        .add-student-form input, .add-student-form select {
          background: var(--white);
          border: 1.5px solid var(--line);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14.5px;
          color: var(--ink);
          font-family: 'Work Sans', sans-serif;
          outline: none;
        }
        .add-student-form input:focus, .add-student-form select:focus { border-color: var(--marigold); }

        .btn-block { width: 100%; justify-content: center; margin-top: 4px; }

        .form-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: #FDEDEA; color: var(--coral);
          padding: 10px 12px; border-radius: 10px; font-size: 13px; font-weight: 500;
          line-height: 1.4;
        }
        .account-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .account-header-row h3 { font-size: 20px; color: var(--chalk); margin: 4px 0 2px; }
        .account-email { font-size: 13px; color: var(--ink-soft); margin: 0; }
        .students-section h4 { font-size: 14px; color: var(--chalk-2); margin: 0 0 10px; }
        .muted-text { font-size: 13px; color: var(--ink-soft); }
        .student-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .student-row {
          display: flex; align-items: stretch; gap: 6px;
          background: var(--paper);
          border: 1.5px solid var(--line);
          border-radius: 10px;
          padding: 4px;
        }
        .student-row-active { border-color: var(--marigold); background: #FFF7E8; }
        .student-row-main {
          flex: 1;
          display: flex; align-items: center; gap: 10px;
          padding: 5px 8px;
          cursor: pointer;
          text-align: left;
          background: none; border: none;
        }
        .student-remove {
          display: flex; align-items: center; justify-content: center;
          width: 30px; border-radius: 8px;
          background: none; border: none;
          color: var(--ink-soft); cursor: pointer;
          flex-shrink: 0;
        }
        .student-remove:hover { background: var(--line); color: var(--ink); }
        .student-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--chalk); color: var(--white);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .student-name { font-weight: 600; font-size: 14px; flex: 1; }
        .student-class { font-size: 12px; color: var(--ink-soft); font-family: 'IBM Plex Mono', monospace; }
        .add-student-form { display: flex; gap: 8px; }
        .add-student-form input { flex: 1; }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .sync-toast {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: var(--chalk); color: var(--white);
          padding: 10px 16px; border-radius: 12px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13.5px; box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          z-index: 30; max-width: 90vw;
        }
        .sync-toast button { background: none; border: none; color: #CFE4D9; cursor: pointer; display: flex; }

        @media (max-width: 640px) {
          .nav { display: none; }
          .nav.nav-open { display: flex; position: absolute; top: 60px; left: 0; right: 0; background: var(--chalk); flex-direction: column; padding: 10px 16px; gap: 4px; }
          .menu-toggle { display: block; }
          .hero { align-items: flex-start; }
          .hero-text h2 { font-size: 24px; }
          .assessment-card { padding: 24px; }
        }
      `}</style>

      {/* Global Ambient Network Warning Banner */}
      <OfflineBanner onOpenOfflineManager={() => setOfflineModalOpen(true)} />

      <header className="header">
        <div className="brand" onClick={goHome}>
          <div className="brand-badge">க</div>
          <div className="brand-text">
            <h1>Kanini Padhai</h1>
            <span>KANINI · LEARNING TRAIL</span>
          </div>
        </div>

        <button className="menu-toggle" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle menu">
          {navOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={"nav" + (navOpen ? " nav-open" : "")}>
          <button
            className={"nav-btn" + (view === "home" || view === "topic" ? " nav-btn-active" : "")}
            onClick={() => { goHome(); setNavOpen(false); }}
          >
            <GraduationCap size={16} /> Trail
          </button>
          <button
            className={"nav-btn" + (view === "search" ? " nav-btn-active" : "")}
            onClick={openSearch}
          >
            <Search size={16} /> Search
          </button>
          <button
            className="nav-btn"
            onClick={() => { setOfflineModalOpen(true); setNavOpen(false); }}
            title="Manage offline curriculum and cached classes"
          >
            <HardDrive size={16} /> Offline {cachedClasses.length > 0 ? `(${cachedClasses.length})` : ''}
          </button>
          <button
            type="button"
            className="nav-btn"
            onClick={() => {
              navigateWithRBAC("/analytics", (denied) => {
                setSyncError(`Access Denied: ${denied.reason === "AUTH_REQUIRED" ? "Please sign in to view analytics" : "Requires higher privileges"}`);
              });
              setNavOpen(false);
            }}
          >
            <BarChart3 size={16} /> Analytics
          </button>
          <button
            className={"nav-btn" + (view === "account" ? " nav-btn-active" : "")}
            onClick={openAccount}
          >
            {teacher ? <User size={16} /> : <UserPlus size={16} />}
            {teacher ? teacher.name.split(" ")[0] : "Log in"}
          </button>
          <div className="stars-chip">
            <Star size={14} fill="currentColor" /> {totalDone}/{totalItems}
          </div>
        </nav>
      </header>

      {syncError && (
        <div className="sync-toast">
          <AlertCircle size={15} />
          <span>{syncError}</span>
          <button onClick={() => setSyncError("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      <main className="main">
        {view === "home" && (
          <>
            <div className="hero">
              <div className="hero-text">
                <span className="hero-tamil">பாதை · The Path</span>
                <h2>Your Class {selectedClass} Maths trail</h2>
                <p>
                  Walk the trail term by term. Every stop mixes a video, a game, a
                  worksheet, and more — picked from Kanini's own library.
                </p>
              </div>
              <ClassSubjectPicker
                classes={classList}
                selectedClass={selectedClass}
                onSelectClass={selectClass}
                cachedClasses={cachedClasses}
                onOpenOfflineManager={() => setOfflineModalOpen(true)}
                onDownloadCurrentClass={handleDownloadCurrentClass}
                isDownloading={isDownloadingClass}
              />
            </div>

            <div className="term-tabs">
              {availableTerms.map((t) => (
                <button
                  key={t}
                  className={"term-tab" + (t === activeTerm ? " term-tab-active" : "")}
                  onClick={() => handleSelectTerm(t)}
                >
                  {TERM_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="trail-wrap">
              <TrailSVG
                topics={currentTopics}
                onSelect={openTopic}
                completedCount={completedCountForTopic}
              />
            </div>
          </>
        )}

        {view === "topic" && currentTopic && (
          <TopicView
            cls={selectedClass}
            term={activeTerm}
            topic={currentTopic}
            completed={completed}
            toggleComplete={toggleComplete}
            markOpened={markOpened}
            onBack={goHome}
            isClassCached={cachedClasses.includes(String(selectedClass))}
          />
        )}

        {view === "search" && <SearchView allItems={allItems} />}


        {view === "account" && (
          <AccountPanel
            teacher={teacher}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onGoogleLogin={handleGoogleLogin}
            onLogout={handleLogout}
            students={students}
            studentsLoading={studentsLoading}
            selectedStudentId={selectedStudentId}
            onSelectStudent={handleSelectStudent}
            onAddStudent={handleAddStudent}
            onRemoveStudent={handleRemoveStudent}
            authLoading={authLoading}
            authError={authError}
          />
        )}
      </main>

      {/* Offline & Downloads Modal */}
      <OfflineManagerModal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
        classesData={activeCurriculum.classes || {}}
        onManifestChange={(manifest) => {
          setCachedClasses(manifest.map((item) => String(item.classId)));
        }}
      />
    </div>
  );
}
