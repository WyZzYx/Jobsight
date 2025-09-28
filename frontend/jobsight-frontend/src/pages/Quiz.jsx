// src/pages/Quiz.jsx
import React, { useMemo, useState } from "react";

// Style tokens (match your Dashboard)
const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    bg: "#0B1220",
    panel: "rgba(255,255,255,0.06)",
    stroke: "rgba(255,255,255,0.10)",
    subtext: "#94A3B8",
};

// Likert options (0..4)
const OPTIONS = [
    { v: 0, label: "Strongly disagree" },
    { v: 1, label: "Disagree" },
    { v: 2, label: "Neutral" },
    { v: 3, label: "Agree" },
    { v: 4, label: "Strongly agree" },
];

// Categories (RIASEC + domain hints)
const CAT_KEYS = ["R", "I", "A", "S", "E", "C", "IT", "HEALTH", "LAW", "EDUC", "DESIGN", "BUSINESS", "ENGINEERING"];
const CAT_LABELS = {
    R: "Realistic (Hands-on / building)",
    I: "Investigative (Analytical / research)",
    A: "Artistic (Creative / design)",
    S: "Social (Helping / teaching)",
    E: "Enterprising (Business / leadership)",
    C: "Conventional (Organizing / detail)",
    IT: "Tech affinity",
    HEALTH: "Healthcare affinity",
    LAW: "Law / justice affinity",
    EDUC: "Education/Teaching affinity",
    DESIGN: "Design affinity",
    BUSINESS: "Business/Market affinity",
    ENGINEERING: "Engineering affinity",
};

// 24 general questions → weights into categories
const QUESTIONS = [
    { q: "I enjoy solving logical puzzles.", tags: ["I"] },
    { q: "I like drawing, writing, or making music.", tags: ["A", "DESIGN"] },
    { q: "Helping others learn gives me energy.", tags: ["S", "EDUC"] },
    { q: "I like leading teams and persuading others.", tags: ["E", "BUSINESS"] },
    { q: "I enjoy hands-on work: building, fixing, or tinkering.", tags: ["R", "ENGINEERING"] },
    { q: "I like organizing information and following clear procedures.", tags: ["C"] },
    { q: "I have strong attention to detail and accuracy.", tags: ["C"] },
    { q: "Aesthetics and visual creativity matter a lot to me.", tags: ["A", "DESIGN"] },
    { q: "I feel comfortable with math or statistics.", tags: ["I", "IT"] },
    { q: "I enjoy debating and defending a point of view.", tags: ["E", "LAW"] },
    { q: "I’m patient working with children or learners.", tags: ["S", "EDUC"] },
    { q: "I’m curious about the human body or mind.", tags: ["I", "HEALTH"] },
    { q: "Fast-paced business environments excite me.", tags: ["E", "BUSINESS"] },
    { q: "I prefer roles with structure and clear rules.", tags: ["C"] },
    { q: "Experimenting and researching new ideas sounds fun.", tags: ["I"] },
    { q: "New technologies and software excite me.", tags: ["I", "IT"] },
    { q: "I’m comfortable speaking to large groups.", tags: ["E", "S"] },
    { q: "I enjoy planning events or operations.", tags: ["C", "E"] },
    { q: "I’d like a job that involves nature/outdoors or real-world equipment.", tags: ["R"] },
    { q: "Justice and societal rules are important topics for me.", tags: ["LAW", "S"] },
    { q: "I enjoy crafting visual layouts or interfaces.", tags: ["A", "DESIGN"] },
    { q: "I’d like to help people directly in their daily lives.", tags: ["S", "HEALTH"] },
    { q: "Troubleshooting devices or mechanical things is satisfying.", tags: ["R", "ENGINEERING"] },
    { q: "I’m motivated by building products or businesses.", tags: ["E", "BUSINESS"] },
];

// Heuristic → majors/jobs (we aggregate scores and pick)
const SUGGESTIONS = [
    {
        key: "IT",
        majors: ["Computer Science", "Software Engineering", "Information Systems"],
        jobs: ["Software Engineer", "Data Analyst", "DevOps Engineer", "QA Engineer", "ML Engineer", "Product Engineer"],
        weight: (s) => s.IT + s.I,
    },
    {
        key: "DESIGN",
        majors: ["UX/UI Design", "Graphic Design", "Industrial Design"],
        jobs: ["UX/UI Designer", "Product Designer", "Graphic Designer", "Content Designer", "Creative Technologist", "Motion Designer"],
        weight: (s) => s.DESIGN + s.A,
    },
    {
        key: "BUSINESS",
        majors: ["Business Administration", "Marketing", "Finance", "Management"],
        jobs: ["Product Manager", "Marketing Manager", "Business Analyst", "Growth Manager", "Operations Manager", "Account Manager"],
        weight: (s) => s.BUSINESS + s.E + 0.3 * s.C,
    },
    {
        key: "HEALTH",
        majors: ["Nursing", "Medicine (Pre-Med)", "Physiotherapy", "Public Health"],
        jobs: ["Nurse", "Physician Assistant", "Clinical Research Associate", "Physiotherapist", "Public Health Specialist", "Medical Technologist"],
        weight: (s) => s.HEALTH + s.S + 0.2 * s.I,
    },
    {
        key: "LAW",
        majors: ["Law / Pre-Law", "Political Science", "Criminology"],
        jobs: ["Lawyer", "Paralegal", "Compliance Officer", "Policy Analyst", "Legal Operations", "Mediator"],
        weight: (s) => s.LAW + 0.5 * s.E + 0.3 * s.S,
    },
    {
        key: "EDUC",
        majors: ["Education", "Psychology", "Instructional Design"],
        jobs: ["Teacher", "Instructional Designer", "School Counselor", "Corporate Trainer", "Academic Advisor", "Education Coordinator"],
        weight: (s) => s.EDUC + s.S,
    },
    {
        key: "ENGINEERING",
        majors: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering"],
        jobs: ["Mechanical Engineer", "Electrical Engineer", "Civil Engineer", "Hardware Engineer", "Manufacturing Engineer", "Robotics Engineer"],
        weight: (s) => s.ENGINEERING + s.R + 0.2 * s.I,
    },
    {
        key: "ANALYTICS",
        majors: ["Data Science", "Statistics", "Biology/Chemistry (Research)"],
        jobs: ["Data Scientist", "Research Scientist", "Bioinformatics Analyst", "Quant Analyst", "Lab Technician", "Epidemiology Analyst"],
        weight: (s) => s.I + 0.2 * s.C,
    },
    {
        key: "OPS",
        majors: ["Accounting", "Operations Management", "Information Systems"],
        jobs: ["Accountant", "Operations Analyst", "Project Coordinator", "Supply Chain Analyst", "PMO Analyst", "Compliance Analyst"],
        weight: (s) => s.C + 0.3 * s.E,
    },
];

// Simple bars
const Bar = ({ value, max = 96 }) => {
    const w = Math.max(6, Math.min(max, Math.round(value)));
    return (
        <div className="w-full h-2 rounded bg-white/10">
            <div className="h-2 rounded" style={{ width: `${w}%`, background: TOKENS.mint }} />
        </div>
    );
};

export default function Quiz({ setCurrent }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState([]); // store 0..4 per question
    const [done, setDone] = useState(false);

    const total = QUESTIONS.length;

    const scores = useMemo(() => {
        const s = Object.fromEntries(CAT_KEYS.map((k) => [k, 0]));
        answers.forEach((val, idx) => {
            const weight = typeof val === "number" ? val : 0;
            (QUESTIONS[idx]?.tags || []).forEach((t) => {
                s[t] += weight;
            });
        });
        return s;
    }, [answers]);

    const traitSummary = useMemo(() => {
        // Normalize RIASEC to 0..100 range for display (max per trait ≈ #questions touching it * 4)
        const maxPerTrait = {};
        CAT_KEYS.forEach((k) => (maxPerTrait[k] = 0));
        QUESTIONS.forEach((q) => q.tags.forEach((t) => (maxPerTrait[t] += 4)));

        const showKeys = ["R", "I", "A", "S", "E", "C"];
        const rows = showKeys.map((k) => {
            const raw = scores[k];
            const max = maxPerTrait[k] || 1;
            const pct = (raw / max) * 100;
            return { key: k, label: CAT_LABELS[k], raw, pct };
        });
        rows.sort((a, b) => b.pct - a.pct);
        return rows;
    }, [scores]);

    const result = useMemo(() => {
        // Rank suggestion buckets by weighted score
        const ranked = SUGGESTIONS
            .map((g) => ({ key: g.key, majors: g.majors, jobs: g.jobs, score: g.weight(scores) || 0 }))
            .sort((a, b) => b.score - a.score);

        const majors = [];
        const jobs = [];
        for (const r of ranked.slice(0, 4)) {
            r.majors.forEach((m) => majors.push({ m, score: r.score }));
            r.jobs.forEach((j) => jobs.push({ j, score: r.score }));
        }

        // De-dupe, then pick top weighted
        const uniqMajors = [];
        const seenM = new Set();
        for (const x of majors) if (!seenM.has(x.m)) { seenM.add(x.m); uniqMajors.push(x); }
        const uniqJobs = [];
        const seenJ = new Set();
        for (const x of jobs) if (!seenJ.has(x.j)) { seenJ.add(x.j); uniqJobs.push(x); }

        uniqMajors.sort((a, b) => b.score - a.score);
        uniqJobs.sort((a, b) => b.score - a.score);

        return {
            topMajors: uniqMajors.slice(0, 3).map((x) => x.m),
            topJobs: uniqJobs.slice(0, 6).map((x) => x.j),
            rankedBuckets: ranked,
        };
    }, [scores]);

    const onPick = (v) => {
        const next = answers.slice();
        next[step] = v;
        setAnswers(next);
        if (step < total - 1) setStep(step + 1);
        else setDone(true);
    };

    const onBack = () => {
        if (step > 0) setStep(step - 1);
    };

    // (Optional) Try to save (non-blocking)
    const saveResult = async () => {
        try {
            await fetch("/api/quiz/result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, scores, result }),
                credentials: "include",
            });

        } catch (_) {
            // ignore if endpoint not present
        }
        try { localStorage.setItem("jobsight_quiz_result", JSON.stringify({ result, scores, at: Date.now() })); } catch {}

    };

    if (done) {
        // save once on finish (fire & forget)
        saveResult();


        return (
            <section className="py-12">
                <div
                    className="rounded-2xl border p-6 md:p-8"
                    style={{ borderColor: TOKENS.stroke, background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))" }}
                >
                    <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: TOKENS.ink }}>
                        Your best-fit directions
                    </h1>
                    <p className="mt-2 text-slate-300">
                        Based on your answers, here are the top matches for majors and roles. You can refine by retaking the quiz anytime.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <div className="rounded-xl border p-5" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}>
                            <div className="text-sm text-slate-300 mb-3">Top traits</div>
                            <div className="space-y-3">
                                {traitSummary.slice(0, 4).map((t) => (
                                    <div key={t.key}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-200">{t.label}</span>
                                            <span className="text-slate-400">{Math.round(t.pct)}%</span>
                                        </div>
                                        <Bar value={t.pct} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border p-5" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}>
                            <div className="text-sm text-slate-300 mb-3">Recommended majors</div>
                            <ul className="space-y-2 list-disc pl-5 text-slate-200">
                                {result.topMajors.map((m) => (
                                    <li key={m}>{m}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-xl border p-5 mt-6" style={{ borderColor: TOKENS.stroke }}>
                        <div className="text-sm text-slate-300 mb-3">Suggested roles</div>
                        <div className="flex flex-wrap gap-2">
                            {result.topJobs.map((j) => (
                                <span key={j} className="px-3 py-1.5 rounded-full border text-sm" style={{ borderColor: TOKENS.stroke }}>
                  {j}
                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <button
                            className="px-4 py-2 rounded-lg"
                            style={{ background: TOKENS.blue, color: "white" }}
                            onClick={() => setCurrent && setCurrent("explore")}
                        >
                            Explore matching jobs
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg"
                            style={{ background: TOKENS.mint, color: "#05261a" }}
                            onClick={() => setCurrent && setCurrent("roadmap")}
                        >
                            Build my roadmap
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg border"
                            style={{ borderColor: TOKENS.stroke }}
                            onClick={() => {
                                setDone(false);
                                setStep(0);
                                setAnswers([]);
                            }}
                        >
                            Retake quiz
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    const progress = Math.round(((step + 1) / total) * 100);
    const q = QUESTIONS[step];

    return (
        <section className="py-12">
            <div
                className="rounded-2xl border p-6 md:p-8"
                style={{ borderColor: TOKENS.stroke, background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))" }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-slate-300">
                        Question {step + 1} of {total}
                    </div>
                    <div className="w-48">
                        <Bar value={progress} max={100} />
                    </div>
                </div>

                <h1 className="text-xl md:text-2xl font-semibold" style={{ color: TOKENS.ink }}>
                    {q.q}
                </h1>

                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {OPTIONS.map((o) => {
                        const selected = answers[step] === o.v;
                        return (
                            <button
                                key={o.v}
                                onClick={() => onPick(o.v)}
                                className={`px-3 py-3 rounded-xl border text-sm transition ${
                                    selected ? "translate-y-[-1px]" : ""
                                }`}
                                style={{
                                    borderColor: selected ? TOKENS.mint : TOKENS.stroke,
                                    background: selected ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                                    color: TOKENS.ink,
                                }}
                            >
                                {o.label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        disabled={step === 0}
                        className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                        style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                    >
                        Back
                    </button>
                    <div className="text-slate-400 text-sm">Progress: {progress}%</div>
                </div>
            </div>
        </section>
    );
}
