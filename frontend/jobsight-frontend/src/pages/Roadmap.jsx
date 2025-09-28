// src/pages/Roadmap.jsx
import React, { useEffect, useMemo, useState } from "react";
import RoadmapPrecise from "./RoadmapPrecise";

const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    bg: "#0B1220",
    panel: "rgba(255,255,255,0.06)",
    stroke: "rgba(255,255,255,0.10)",
    subtext: "#94A3B8",
};

const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

const MAJORS = [
    { key: "CS", label: "Computer Science" },
    { key: "SE", label: "Software Engineering" },
    { key: "DS", label: "Data Science" },
    { key: "UX", label: "UX/UI Design" },
    { key: "BUS", label: "Business/Marketing" },
    { key: "LAW", label: "Law / Pre-Law" },
    { key: "EDU", label: "Education / Teaching" },
    { key: "ME", label: "Mechanical Engineering" },
    { key: "EE", label: "Electrical Engineering" },
    { key: "CIV", label: "Civil Engineering" },
    { key: "NUR", label: "Nursing / Healthcare" },
    { key: "PSY", label: "Psychology" },
];

// Reference tracks (trim as needed)
const TRACKS = {
    CS: {
        foundations: ["Programming basics", "Algorithms & Data Structures", "Version Control (Git)", "Networking & OS basics"],
        core: ["Databases (SQL)", "Web backend (REST)", "Unit testing", "Cloud basics (containers)"],
        projects: [
            "Build a RESTful API with auth",
            "Deploy a full-stack app (Docker + any cloud)",
            "Automate CI for tests & linting",
        ],
    },
    SE: {
        foundations: ["OOP & Clean Code", "Git & Branching", "Software architecture basics"],
        core: ["Framework (Spring/JS/…)", "Testing pyramid", "CI/CD fundamentals"],
        projects: [
            "Refactor a legacy module with tests",
            "Design a micro-service and document its API",
            "Implement feature flags & rollout plan",
        ],
    },
    DS: {
        foundations: ["Python", "Statistics", "Data wrangling (pandas)"],
        core: ["Supervised/Unsupervised ML", "Model eval & validation", "SQL & warehouses"],
        projects: [
            "EDA + model on open dataset",
            "Deploy a small model as an API",
            "Dashboard with KPIs (Streamlit/BI)",
        ],
    },
    UX: {
        foundations: ["Design principles", "Typography/Color", "User research basics"],
        core: ["Wireframing & prototyping", "Design systems", "Usability testing"],
        projects: [
            "Redesign a flow (case study)",
            "Mobile app prototype (Figma)",
            "Design system starter (tokens/components)",
        ],
    },
    BUS: {
        foundations: ["Accounting basics", "Marketing fundamentals", "Excel/Sheets"],
        core: ["Analytics (A/B, funnels)", "Positioning/ICP", "Go-to-market"],
        projects: [
            "Mini GTM plan for a product",
            "Cohort retention dashboard",
            "Pricing experiment proposal",
        ],
    },
    LAW: {
        foundations: ["Legal systems overview", "Legal writing", "Ethics & compliance"],
        core: ["Research/citations", "Contract basics", "Privacy/Regulation overview"],
        projects: [
            "Draft a standard NDA + commentary",
            "Case brief (IRAC) bundle",
            "Compliance checklist for a product",
        ],
    },
    EDU: {
        foundations: ["Learning theory", "Classroom management", "Assessment basics"],
        core: ["Curriculum design", "Instructional design", "EdTech tools"],
        projects: [
            "Design a 4-week module with rubrics",
            "Interactive lesson (slides + activity)",
            "Peer/tutor feedback workflow",
        ],
    },
    ME: {
        foundations: ["Statics & Dynamics", "Materials", "CAD basics"],
        core: ["Thermodynamics", "Manufacturing", "Controls basics"],
        projects: [
            "3D-print a part & test tolerances",
            "Design a simple mechanism (CAD)",
            "Arduino control of a device",
        ],
    },
    EE: {
        foundations: ["Circuits", "Signals", "Embedded basics"],
        core: ["Digital systems", "Power/Energy basics", "PCB design"],
        projects: [
            "Design & simulate a circuit",
            "Build a sensor logger (MCU)",
            "Solder a simple PCB",
        ],
    },
    CIV: {
        foundations: ["Statics", "Surveying", "Materials (concrete/steel)"],
        core: ["Structural analysis", "Geotech basics", "Project mgmt"],
        projects: [
            "Model a small structure",
            "Site plan with constraints",
            "Cost & schedule mini-plan",
        ],
    },
    NUR: {
        foundations: ["Anatomy & physiology", "Medical terminology", "Care fundamentals"],
        core: ["Pharmacology basics", "Clinical procedures", "Patient safety"],
        projects: [
            "Care plan case studies",
            "OSCE practice scenarios",
            "Shift handoff simulation",
        ],
    },
    PSY: {
        foundations: ["Intro psych", "Research methods", "Statistics"],
        core: ["Cognitive/Clinical/Social", "Ethics", "Assessment tools"],
        projects: [
            "Mini literature review",
            "Design a small survey study",
            "Psychoeducation resource",
        ],
    },
};

// ---- Helpers
const norm = (s) => String(s || "").toLowerCase();
const hit = (skills, keys) => {
    const S = new Set(skills.map(norm));
    return keys.reduce((c, k) => c + (S.has(norm(k)) ? 1 : 0), 0);
};

// Infer a major purely from CV skills
function inferMajorFromSkills(skills) {
    // keyword packs (fast and crude)
    const packs = {
        CS: ["java", "c++", "algorithms", "data structures", "oop", "os", "networking"],
        SE: ["spring", "react", "node", "docker", "kubernetes", "ci/cd", "microservices"],
        DS: ["python", "pandas", "numpy", "sklearn", "statistics", "machine learning", "sql"],
        UX: ["figma", "sketch", "wireframe", "prototype", "ux", "ui", "usability"],
        BUS: ["marketing", "seo", "ppc", "sales", "analytics", "excel", "strategy"],
        LAW: ["contract", "legal", "compliance", "gdpr", "privacy"],
        EDU: ["teaching", "curriculum", "lesson", "classroom", "assessment"],
        ME: ["cad", "solidworks", "mechanics", "thermodynamics", "manufacturing"],
        EE: ["circuits", "embedded", "pcb", "fpga", "verilog", "signal"],
        CIV: ["autocad", "revit", "structural", "geotech", "site plan"],
        NUR: ["nursing", "patient care", "clinical", "vitals", "pharmacology"],
        PSY: ["psychology", "research methods", "spss", "cognitive", "clinical"],
    };

    let best = { key: "CS", score: -1 };
    Object.entries(packs).forEach(([key, kws]) => {
        const score = hit(skills, kws);
        if (score > best.score) best = { key, score };
    });

    return best.key; // just the key
}

// Client fallback roadmap if backend is missing
function localRoadmap({ majorKey, skills = [] }) {
    const plan = TRACKS[majorKey] || { foundations: [], core: [], projects: [] };
    const d = (t) => ({ type: "learn", label: t });
    const tracks = [
        { title: "Foundations", items: plan.foundations.map(d) },
        { title: "Core Skills", items: plan.core.map(d) },
        { title: "Projects", items: plan.projects.map((p) => ({ type: "project", label: p })) },
    ];
    return { title: `Roadmap: ${MAJORS.find((m) => m.key === majorKey)?.label || majorKey}`, tracks };
}

async function fetchRoadmap({ majorKey, skills }) {
    try {
        const res = await fetch("/api/roadmap/build", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ major: majorKey, skills }),
        });
        if (res.ok) return await res.json();
    } catch (_) {}
    return localRoadmap({ majorKey, skills });
}

function loadQuiz() {
    try {
        const raw = localStorage.getItem("jobsight_quiz_result");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export default function Roadmap() {
    const [mode, setMode] = useState("cv"); // 'cv' | 'major' | 'quiz' | 'precise'
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [skills, setSkills] = useState([]);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState("");

    // strictly major-only mode state
    const [selectedMajor, setSelectedMajor] = useState("CS");

    // strictly quiz-only
    const [quiz, setQuiz] = useState(null);
    const quizMajorKey = useMemo(() => {
        const top = quiz?.result?.topMajors?.[0];
        if (!top) return null;
        const map = {
            "Computer Science": "CS", "Software Engineering": "SE", "Information Systems": "SE",
            "Data Science": "DS",
            "UX/UI Design": "UX", "Graphic Design": "UX", "Industrial Design": "UX",
            "Business Administration": "BUS", Marketing: "BUS", Finance: "BUS", Management: "BUS",
            Nursing: "NUR", "Medicine (Pre-Med)": "NUR", Physiotherapy: "NUR", "Public Health": "NUR",
            Law: "LAW", "Pre-Law": "LAW", "Political Science": "LAW", Criminology: "LAW",
            Education: "EDU",
            Psychology: "PSY",
            "Mechanical Engineering": "ME",
            "Electrical Engineering": "EE",
            "Civil Engineering": "CIV",
        };
        return map[top] || null;
    }, [quiz]);

    useEffect(() => {
        if (mode === "quiz") setQuiz(loadQuiz());
    }, [mode]);

    const inferredMajorFromCV = useMemo(() => {
        if (skills.length === 0) return null;
        return inferMajorFromSkills(skills);
    }, [skills]);

    // --- UI handlers
    const onChooseFile = (e) => {
        setFile(e.target.files?.[0] || null);
        setPlan(null);
        setError("");
    };

    const extractSkills = async () => {
        if (!file) return;
        setUploading(true);
        setError("");
        setPlan(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/resume/analyze", { method: "POST", body: fd, credentials: "include" });
            if (!res.ok) throw new Error(`Resume analyze failed (${res.status})`);
            const json = await res.json();
            setSkills(asArray(json.skills).map(String));
        } catch (e) {
            setError(e.message || "Extraction failed");
        } finally {
            setUploading(false);
        }
    };

    // --- Build plan according to strict mode rules
    const buildPlan = async () => {
        setError("");
        setPlan(null);

        try {
            if (mode === "cv") {
                if (skills.length === 0) throw new Error("Please extract skills from your CV first.");
                const majorKey = inferredMajorFromCV || "CS"; // strictly inferred
                const result = await fetchRoadmap({ majorKey, skills }); // CV-only
                setPlan({ ...result, title: `${result.title} (inferred from CV)` });
                return;
            }

            if (mode === "major") {
                const result = await fetchRoadmap({ majorKey: selectedMajor, skills: [] }); // major-only
                setPlan(result);
                return;
            }

            if (mode === "quiz") {
                if (!quizMajorKey) throw new Error("No saved quiz results found.");
                const result = await fetchRoadmap({ majorKey: quizMajorKey, skills: [] }); // quiz-only
                setPlan({ ...result, title: `${result.title} (from quiz)` });
                return;
            }
        } catch (e) {
            setError(e.message || "Could not build roadmap");
        }
    };

    return (
        <section className="py-12">
            <div
                className="rounded-2xl border p-6 md:p-8"
                style={{
                    borderColor: TOKENS.stroke,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
                }}
            >
                {/* Mode switch */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {[
                        { id: "cv", label: "Use my CV" },
                        { id: "major", label: "Choose a major" },
                        { id: "quiz", label: "Use quiz results" },
                        { id: "precise", label: "Ask AI for a roadmap" },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setMode(t.id);
                                setPlan(null);
                                setError("");
                            }}
                            className={`px-3 py-2 rounded-lg text-sm ${mode === t.id ? "bg-white/10" : "hover:bg-white/5"}`}
                            style={{ border: `1px solid ${mode === t.id ? TOKENS.stroke : "transparent"}`, color: TOKENS.ink }}
                        >
                            {t.label}
                        </button>
                    ))}
                    {error && <div className="ml-auto text-sm" style={{ color: "#ef4444" }}>{error}</div>}
                </div>

                {/* --- CV ONLY --- */}
                {mode === "cv" && (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <div className="rounded-xl border p-5" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}>
                                <div className="text-sm text-slate-300 mb-3">Upload CV / Resume</div>
                                <input type="file" onChange={onChooseFile} className="text-sm" />
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        onClick={extractSkills}
                                        disabled={!file || uploading}
                                        className="px-4 py-2 rounded-lg"
                                        style={{ background: TOKENS.blue, opacity: uploading ? 0.7 : 1 }}
                                    >
                                        {uploading ? "Extracting skills…" : "Extract skills"}
                                    </button>
                                    <div className="text-xs" style={{ color: TOKENS.subtext }}>
                                        Accepted types depend on the analyzer service (.pdf / .txt recommended)
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border p-5 mt-4" style={{ borderColor: TOKENS.stroke }}>
                                <div className="text-sm text-slate-300 mb-1">Inferred major</div>
                                <div className="text-slate-200">
                                    {skills.length === 0
                                        ? "— (extract skills first)"
                                        : (MAJORS.find((m) => m.key === inferredMajorFromCV)?.label || inferredMajorFromCV)}
                                </div>
                                <div className="text-xs mt-1" style={{ color: TOKENS.subtext }}>
                                    We infer this from your CV skills. No manual overrides in CV mode.
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="rounded-xl border p-5 h-full" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}>
                                <div className="text-sm text-slate-300 mb-3">Extracted skills</div>
                                {skills.length === 0 ? (
                                    <div className="text-sm text-slate-400">No skills yet.</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((s) => (
                                            <span key={s} className="px-2 py-1 rounded border text-xs" style={{ borderColor: TOKENS.stroke }}>
                        {s}
                      </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MAJOR ONLY --- */}
                {mode === "major" && (
                    <div className="rounded-xl border p-5" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}>
                        <div className="text-sm text-slate-300 mb-3">Pick a major</div>
                        <select
                            className="px-3 py-2 rounded-lg bg-white/5 border"
                            style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            value={selectedMajor}
                            onChange={(e) => {
                                setSelectedMajor(e.target.value);
                                setPlan(null);
                            }}
                        >
                            {MAJORS.map((m) => (
                                <option key={m.key} value={m.key}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                        <div className="text-xs mt-2" style={{ color: TOKENS.subtext }}>
                            This mode ignores both CV and Quiz.
                        </div>
                    </div>
                )}

                {/* --- QUIZ ONLY --- */}
                {mode === "quiz" && (
                    <div className="rounded-xl border p-5" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}>
                        {!quiz ? (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-300">No saved quiz results found.</div>
                                <a href="#" className="px-3 py-2 rounded-lg text-sm" style={{ background: TOKENS.blue }}>
                                    Go to Quiz
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className="text-sm text-slate-300 mb-2">Top majors from your quiz</div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {asArray(quiz?.result?.topMajors)
                                        .slice(0, 5)
                                        .map((m) => (
                                            <span key={m} className="px-3 py-1.5 rounded-full border text-sm" style={{ borderColor: TOKENS.stroke }}>
                        {m}
                      </span>
                                        ))}
                                </div>
                                <div className="text-sm text-slate-300">Selected (read-only)</div>
                                <div className="text-slate-200">
                                    {quizMajorKey
                                        ? MAJORS.find((m) => m.key === quizMajorKey)?.label || quizMajorKey
                                        : "— (unmapped; retake quiz or adjust mapping in code)"}
                                </div>
                                <div className="text-xs mt-1" style={{ color: TOKENS.subtext }}>
                                    Quiz mode ignores both CV and manual major selection.
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- PRECISE (LLM) TAB --- */}
                {mode === "precise" && (
                    <div className="mt-2">
                        <RoadmapPrecise />
                    </div>
                )}

                {/* Action (hidden on 'precise' because that tab has its own form/button) */}
                {mode !== "precise" && (
                    <div className="mt-6">
                        <button
                            onClick={buildPlan}
                            className="px-4 py-2 rounded-lg"
                            style={{ background: TOKENS.mint, color: "#05261a" }}
                        >
                            Generate roadmap
                        </button>
                    </div>
                )}

                {/* Output */}
                {plan && (
                    <div className="mt-8 rounded-xl border p-5" style={{ borderColor: TOKENS.stroke }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: TOKENS.ink }}>
                            {plan.title || "Your Roadmap"}
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {asArray(plan.tracks).map((t) => (
                                <div key={t.title} className="rounded-lg border p-4" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.03)" }}>
                                    <div className="text-sm text-slate-300 mb-3">{t.title}</div>
                                    <ul className="space-y-2">
                                        {asArray(t.items).map((it, idx) => (
                                            <li key={idx} className="text-slate-200 text-sm">
                        <span
                            className="px-2 py-0.5 rounded border mr-2 text-xs"
                            style={{ borderColor: TOKENS.stroke, color: TOKENS.subtext }}
                        >
                          {it.type || "learn"}
                        </span>
                                                {it.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-xs" style={{ color: TOKENS.subtext }}>
                            Tip: Treat each item as a 3–7 day milestone and collect portfolio evidence (repo links, notes, screenshots).
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
