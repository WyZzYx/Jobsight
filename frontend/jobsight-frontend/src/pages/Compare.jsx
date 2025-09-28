// src/pages/Compare.jsx
import React, { useEffect, useMemo, useState } from "react";
import { loadPicks, removePick, clearPicks } from "../lib/compareStore";


const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    stroke: "rgba(255,255,255,0.10)",
};

const posted = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

// --- helpers to safely read strings from various shapes (Adzuna objects etc.)
const str = (v) =>
    typeof v === "string"
        ? v
        : v && typeof v === "object"
            ? v.display_name || v.name || v.label || ""
            : "";

const textHaystack = (job) => {
    const parts = [
        str(job?.title),
        str(job?.company),
        str(job?.location),
        Array.isArray(job?.location?.area) ? job.location.area.join(", ") : "",
        job?.description || "",
        str(job?.category),
    ];
    return parts.join(" ").toLowerCase();
};

/** Very light skill extraction for heuristics */
const SKILLS = [
    "java",
    "python",
    "kotlin",
    "spring",
    "spring boot",
    "hibernate",
    "react",
    "angular",
    "vue",
    "typescript",
    "javascript",
    "sql",
    "postgres",
    "mysql",
    "mongodb",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "terraform",
    "kafka",
    "spark",
    "hadoop",
    "airflow",
    "git",
    "jira",
    "confluence",
    "jenkins",
    "ci/cd",
    "microservices",
    "android",
    "ios",
    "swift",
    "objective-c",
    "node",
    "django",
    "flask",
    "graphql",
    "rest",
];

const has = (text, word) =>
    new RegExp(`\\b${word.replace(/\+/g, "\\+")}\\b`, "i").test(text || "");
const countSkills = (desc = "") =>
    SKILLS.reduce((n, s) => (has(desc, s) ? n + 1 : n), 0);

const levelFromTitle = (title = "") => {
    const t = String(title || "").toLowerCase();
    if (/intern|trainee/.test(t)) return { label: "Intern", score: 1 };
    if (/\bjunior\b|jr\./.test(t)) return { label: "Junior", score: 2 };
    if (/\b(mid|regular)\b/.test(t)) return { label: "Mid", score: 3 };
    if (/\bsenior\b|sr\./.test(t)) return { label: "Senior", score: 4 };
    if (/\b(lead|principal|architect|manager|head)\b/.test(t))
        return { label: "Lead+", score: 5 };
    return { label: "Unspecified", score: 3 };
};

const isRemoteish = (text = "") => /(remote|work from home|hybrid)/i.test(text);

const isBigBrand = (company) => {
    const c = str(company).toLowerCase();
    return /(google|amazon|aws|microsoft|meta|facebook|apple|netflix|hsbc|ing|accenture|ibm|samsung|oracle|sap|siemens)/i.test(
        c
    );
};

const largeMetro = (loc) => {
    const l =
        `${str(loc)} ${
            Array.isArray(loc?.area) ? loc.area.join(", ") : ""
        }`.toLowerCase();
    return /(warsaw|warszawa|krak[oó]w|wrocław|pozn[aá]ń|london|paris|berlin|new york|san francisco|sydney|toronto|amsterdam|dublin)/i.test(
        l
    );
};

/** Median salary: use (min+max)/2 if both present; otherwise fallback to whichever exists; otherwise "—" */
const medianSalary = (job) => {
    const min =
        typeof job?.salary_min === "number" ? job.salary_min : job?.salaryMin;
    const max =
        typeof job?.salary_max === "number" ? job.salary_max : job?.salaryMax;
    const nMin = typeof min === "number" ? min : null;
    const nMax = typeof max === "number" ? max : null;
    if (nMin != null && nMax != null) return Math.round((nMin + nMax) / 2);
    if (nMin != null) return nMin;
    if (nMax != null) return nMax;
    return null;
};

const inferCurrency = (job) => {
    const dn = str(job?.location);
    const area = Array.isArray(job?.location?.area)
        ? job.location.area.join(", ").toLowerCase()
        : "";
    const hay = `${dn} ${area}`.toLowerCase();

    if (/polska|poland|warsz|krak/.test(hay)) return "PLN";
    if (/united kingdom|uk|london|england|scotland|wales/.test(hay)) return "GBP";
    if (/united states|usa|new york|california|san francisco|austin|boston/.test(hay))
        return "USD";
    if (/germany|deutschland|berlin|munich|münchen|frankfurt/.test(hay))
        return "EUR";
    if (/france|paris/.test(hay)) return "EUR";
    if (/netherlands|amsterdam/.test(hay)) return "EUR";
    if (/spain|españa|madrid|barcelona/.test(hay)) return "EUR";
    if (/ireland|dublin/.test(hay)) return "EUR";
    return "";
};

const fmtMoney = (n, cur) => {
    if (n == null) return "—";
    try {
        return (
            new Intl.NumberFormat(undefined, {
                maximumFractionDigits: 0,
            }).format(n) + (cur ? ` ${cur}` : "")
        );
    } catch {
        return `${n}${cur ? " " + cur : ""}`;
    }
};

/** Difficulty of the job itself (1..5) */
const difficulty = (job) => {
    const lvl = levelFromTitle(job.title);
    const skills = countSkills(job.description || "");
    let score = lvl.score;

    if (skills >= 10) score += 1;
    else if (skills >= 6) score += 0.5;

    if ((job.description || "").length > 1200) score += 0.5;

    score = Math.max(1, Math.min(5, score));
    const labels = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
    const idx = Math.round(score) - 1;
    return { score, label: labels[idx] || "Medium" };
};

/** How hard it is to LAND the job (competition proxy, 1..5) */
const competitiveness = (job) => {
    let score = 2.5;
    const lvl = levelFromTitle(job.title).score;

    if (lvl >= 4) score += 0.5;
    if (isRemoteish(job.description)) score += 0.5;
    if (isBigBrand(job.company)) score += 0.5;
    if (largeMetro(job.location)) score += 0.5;

    const med = medianSalary(job);
    if (med && med > 300000) score += 0.5; // higher pay attracts more applicants

    score = Math.max(1, Math.min(5, score));
    const labels = ["Low", "Low-Medium", "Medium", "High", "Very High"];
    const idx = Math.round(score) - 1;
    return { score, label: labels[idx] || "Medium" };
};

const meter = (val, max = 5) => {
    const filled = Math.round(val);
    return (
        <span className="inline-flex items-center gap-1 align-middle">
      {Array.from({ length: max }).map((_, i) => (
          <span
              key={i}
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{
                  background: i < filled ? TOKENS.mint : "rgba(255,255,255,0.12)",
              }}
          />
      ))}
    </span>
    );
};

// --- QUIZ FIT ---------------------------------------------------------------

const loadQuiz = () => {
    try {
        const raw = localStorage.getItem("jobsight_quiz_result");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

// Map quiz majors to keyword sets we can match in job title/description
const MAJOR_KEYWORDS = {
    "Computer Science": [
        "computer science",
        "algorithms",
        "data structures",
        "software",
        "cs",
    ],
    "Software Engineering": [
        "software engineer",
        "backend",
        "frontend",
        "fullstack",
        "microservices",
        "spring",
        "react",
        "node",
    ],
    "Data Science": [
        "data science",
        "machine learning",
        "ml",
        "pandas",
        "numpy",
        "statistics",
        "model",
    ],
    "UX/UI Design": ["ux", "ui", "designer", "figma", "wireframe", "prototype"],
    "Business Administration": [
        "business",
        "analyst",
        "marketing",
        "strategy",
        "product",
    ],
    Marketing: ["marketing", "seo", "sem", "content", "brand"],
    Finance: ["finance", "financial", "analyst", "accounting", "audit"],
    Law: ["legal", "law", "compliance", "contract", "privacy", "gdpr"],
    Education: ["teacher", "teaching", "curriculum", "education"],
    Psychology: ["psychology", "cognitive", "clinical", "research"],
    "Mechanical Engineering": ["mechanical", "cad", "solidworks", "thermo"],
    "Electrical Engineering": ["electrical", "circuits", "embedded", "pcb"],
    "Civil Engineering": ["civil", "structural", "site", "autocad", "revit"],
    Nursing: ["nursing", "nurse", "clinical", "care"],
};

const fitLabel = (pct) => {
    if (pct >= 85) return "Excellent";
    if (pct >= 70) return "Great";
    if (pct >= 50) return "Good";
    if (pct >= 30) return "Fair";
    return "Poor";
};

const computeQuizFit = (job, quiz) => {
    if (!quiz?.result) return null;

    // Try to read majors the quiz said you’re best suited for
    const majors =
        quiz.result.topMajors ||
        quiz.result.topCareers ||
        quiz.result.majors ||
        [];

    const majorsArray = Array.isArray(majors) ? majors : [majors];

    if (majorsArray.length === 0) return null;

    const hay = textHaystack(job);

    let best = { major: "", hits: 0 };
    for (const m of majorsArray) {
        const name = String(m || "").trim();
        const kws = MAJOR_KEYWORDS[name];
        if (!kws) continue;
        const hits = kws.reduce((n, k) => (hay.includes(k) ? n + 1 : n), 0);
        if (hits > best.hits) best = { major: name, hits };
    }

    // Scale hits → 0..100 (cap at 5 hits)
    const pct = Math.min(100, Math.round((best.hits / 5) * 100));
    return {
        pct,
        label: fitLabel(pct),
        major: best.major || majorsArray[0],
    };
};

// ---------------------------------------------------------------------------

export default function Compare({ setCurrent }) {
    const [picks, setPicks] = useState(() => loadPicks());
    const quiz = useMemo(loadQuiz, []);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "jobsight_compare_v1") setPicks(loadPicks());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const onRemove = (p) => setPicks(removePick(p.id ?? p.key));
    const onClear = () => {
        clearPicks();
        setPicks([]);
    };

    const goExplore = () => {
        if (typeof setCurrent === "function") {
            setCurrent("explore");
            return;
        }
        // Fallbacks if Compare is routed directly:
        if (window?.__setCurrentPage) {
            try {
                window.__setCurrentPage("explore");
                return;
            } catch {}
        }
        // Last resort: navigate
        try {
            window.location.href = "/explore";
        } catch {}
    };

    return (
        <section className="py-12">
            <div className="flex items-center justify-between mb-4">
                <h1
                    className="text-xl md:text-2xl font-semibold"
                    style={{ color: TOKENS.ink }}
                >
                    Compare Jobs
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={goExplore}
                        className="px-3 py-2 rounded-lg bg-white/5 border text-sm"
                        style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                    >
                        Add more from Explore
                    </button>
                    {picks.length > 0 && (
                        <button
                            onClick={onClear}
                            className="px-3 py-2 rounded-lg text-sm"
                            style={{ background: TOKENS.blue, color: "white" }}
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {picks.length === 0 ? (
                <div
                    className="rounded-xl border p-6 text-slate-300"
                    style={{ borderColor: TOKENS.stroke }}
                >
                    Nothing to compare yet. Go to{" "}
                    <button onClick={goExplore} className="underline">
                        Explore
                    </button>{" "}
                    and click “Add to compare” on up to 3 jobs.
                </div>
            ) : (
                <>
                    <div className="text-xs text-slate-400 mb-2">
                        Note: “Difficulty” and “How hard to get” use simple heuristics from
                        title, skills and description.
                        {quiz ? (
                            <span className="ml-2">
                Using your quiz results to compute “Fit to your profile”.
              </span>
                        ) : (
                            <span className="ml-2">
                Take the quiz to unlock “Fit to your profile”.
              </span>
                        )}
                    </div>
                    <div
                        className="rounded-2xl border overflow-x-auto"
                        style={{ borderColor: TOKENS.stroke }}
                    >
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/[0.04]">
                            <tr>
                                <th className="text-left p-3 text-slate-300 w-48">Field</th>
                                {picks.map((p, i) => (
                                    <th
                                        key={p.key ?? i}
                                        className="text-left p-3 text-white min-w-[260px]"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{str(p.title) || "Untitled"}</span>
                                            <button
                                                onClick={() => onRemove(p)}
                                                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {[
                                ["Company", (p) => str(p.company) || "—"],
                                ["Location", (p) => str(p.location) || "—"],
                                ["Posted", (p) => posted(p.created)],
                                ["Category", (p) => str(p.category) || "—"],

                                // NEW: Fit to your quiz profile
                                [
                                    "Fit to your quiz profile",
                                    (p) => {
                                        if (!quiz) return "—";
                                        const f = computeQuizFit(p, quiz);
                                        if (!f) return "—";
                                        const bars = Math.max(1, Math.round(f.pct / 20)); // 1..5
                                        return (
                                            <span className="inline-flex items-center gap-2">
                          {meter(bars)}
                                                <span>
                            {f.label} ({f.pct}%)
                                                    {f.major ? ` — matches ${f.major}` : ""}
                          </span>
                        </span>
                                        );
                                    },
                                ],

                                // Difficulty of the job
                                [
                                    "How difficult is the job",
                                    (p) => {
                                        const d = difficulty(p);
                                        return (
                                            <span className="inline-flex items-center gap-2">
                          {meter(d.score)}
                                                <span>{d.label}</span>
                        </span>
                                        );
                                    },
                                ],

                                // How hard it is to get
                                [
                                    "How hard it is to get it",
                                    (p) => {
                                        const c = competitiveness(p);
                                        return (
                                            <span className="inline-flex items-center gap-2">
                          {meter(c.score)}
                                                <span>{c.label}</span>
                        </span>
                                        );
                                    },
                                ],

                                // Median salary
                                [
                                    "Median salary (est.)",
                                    (p) => {
                                        const cur = inferCurrency(p);
                                        const m = medianSalary(p);
                                        return fmtMoney(m, cur);
                                    },
                                ],

                                // Summary
                                [
                                    "Summary",
                                    (p) =>
                                        p.description
                                            ? String(p.description).slice(0, 260) + "…"
                                            : "—",
                                ],

                                [
                                    "Link",
                                    (p) =>
                                        p.redirect_url || p.url ? (
                                            <a
                                                href={p.redirect_url || p.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                                            >
                                                View posting
                                            </a>
                                        ) : (
                                            "—"
                                        ),
                                ],
                            ].map(([label, getter]) => (
                                <tr
                                    key={label}
                                    className="border-t"
                                    style={{ borderColor: TOKENS.stroke }}
                                >
                                    <td className="p-3 text-slate-300">{label}</td>
                                    {picks.map((p, i) => (
                                        <td
                                            key={label + "_" + (p.key ?? i)}
                                            className="p-3 text-slate-200 align-top"
                                        >
                                            {getter(p)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}
