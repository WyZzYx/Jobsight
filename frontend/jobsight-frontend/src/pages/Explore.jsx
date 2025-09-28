// src/pages/Explore.jsx
import React, { useEffect, useMemo, useState } from "react";
import { addPick } from "../lib/compareStore";
import { auth } from "../lib/auth";
import { useAuth } from "../context/AuthContext";

const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    panel: "rgba(255,255,255,0.06)",
    stroke: "rgba(255,255,255,0.10)",
    subtext: "#94A3B8",
};

/* ---------- Robust coercion helpers ---------- */

// Coerce any value to a safe display string.
const toText = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);

    // Known patterns
    if (typeof v === "object") {
        // Common API shapes:
        if (typeof v.display_name === "string") return v.display_name;
        if (typeof v.label === "string") return v.label;
        if (typeof v.name === "string") return v.name;
        if (typeof v.title === "string") return v.title;
        if (typeof v.value === "string") return v.value;

        // Some backends embed type info (e.g., {"__CLASS__":"java.lang.String","value":"Acme"}).
        if ("__CLASS__" in v && typeof v.value === "string") return v.value;

        // Last resort: avoid rendering objects directly
        try {
            return JSON.stringify(v);
        } catch {
            return "";
        }
    }
    try {
        return String(v);
    } catch {
        return "";
    }
};

// Strip HTML and normalize whitespace; safe on non-strings
const cleanText = (t) =>
    toText(t).replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();

// Parse a wide variety of date shapes
const parseDate = (val) => {
    if (!val && val !== 0) return null;

    // ISO string or millis number
    if (typeof val === "string" || typeof val === "number") {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }

    if (typeof val === "object") {
        // Java Instant-ish shapes
        if (typeof val.epochSecond === "number") {
            const ms =
                val.epochMilli != null
                    ? Number(val.epochMilli)
                    : Number(val.epochSecond) * 1000;
            const d = new Date(ms);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof val.epochMilli === "number") {
            const d = new Date(Number(val.epochMilli));
            return isNaN(d.getTime()) ? null : d;
        }

        // ZonedDateTime-ish
        if (val.year && val.month && val.day) {
            const d = new Date(
                Number(val.year),
                Number(val.month) - 1,
                Number(val.day),
                Number(val.hour || 0),
                Number(val.minute || 0),
                Number(val.second || 0)
            );
            return isNaN(d.getTime()) ? null : d;
        }

        // Polymorphic with type marker
        if ("__CLASS__" in val && typeof val.value !== "undefined") {
            return parseDate(val.value);
        }
    }
    return null;
};

// Always return array
const asArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.results)) return payload.results; // Adzuna passthrough
    if (Array.isArray(payload.content)) return payload.content; // Spring Page
    if (Array.isArray(payload.data)) return payload.data; // generic
    return [];
};

const workTypeOf = (title, loc) => {
    const t = toText(title).toLowerCase();
    const l = toText(loc).toLowerCase();
    if (t.includes("remote") || l.includes("remote")) return "Remote";
    if (t.includes("hybrid") || l.includes("hybrid")) return "Hybrid";
    return "Onsite";
};

const toMonthly = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return undefined;
    return v >= 100000 ? Math.round(v / 12) : Math.round(v);
};

/* ---------- Normalizer: unify backend shapes ---------- */
const normalizeJob = (j, idx = 0) => {
    if (!j || typeof j !== "object") return { id: `job-${idx}` };

    const looksAdzuna =
        j.company?.display_name ||
        j.location?.display_name ||
        j.redirect_url ||
        typeof j.salary_min === "number" ||
        typeof j.salary_max === "number";

    if (looksAdzuna) {
        return {
            id: j.id ?? `adz-${idx}`,
            title: toText(j.title) || "Untitled role",
            company: toText(j.company?.display_name ?? j.company) || "—",
            location:
                toText(j.location?.display_name) ||
                (Array.isArray(j.location?.area) ? j.location.area.join(", ") : "") ||
                "",
            description: toText(j.description),
            created: j.created ?? j.created_at ?? null,
            salary_min: Number.isFinite(j.salary_min) ? Number(j.salary_min) : null,
            salary_max: Number.isFinite(j.salary_max) ? Number(j.salary_max) : null,
            currency: toText(j.currency),
            categoryLabel: toText(j.category?.label ?? j.category),
            url: toText(j.redirect_url ?? j.url) || "#",
        };
    }

    // DTO shape
    return {
        id: j.id ?? `dto-${idx}`,
        title: toText(j.title) || "Untitled role",
        company: toText(j.company) || "—",
        location: toText(j.location),
        description: toText(j.description),
        created: j.postedAt ?? j.created ?? null,
        salary_min: Number.isFinite(j.salaryMin) ? Number(j.salaryMin) : null,
        salary_max: Number.isFinite(j.salaryMax) ? Number(j.salaryMax) : null,
        currency: toText(j.currency),
        categoryLabel: toText(j.category?.label ?? j.category),
        url: toText(j.url) || "#",
    };
};

export default function Explore() {
    const [what, setWhat] = useState("");
    const [where, setWhere] = useState("");

    const [fullTime, setFullTime] = useState(false);
    const [permanent, setPermanent] = useState(false);
    const [sortUi, setSortUi] = useState("date");
    const [remoteFilter, setRemoteFilter] = useState("any");
    const [postedWithin, setPostedWithin] = useState("any");
    const [minMonthly, setMinMonthly] = useState("");
    const [hasSalaryOnly, setHasSalaryOnly] = useState(false);
    const [companyFilter, setCompanyFilter] = useState("");
    const [excludeFilter, setExcludeFilter] = useState("");

    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(0);
    const [raw, setRaw] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const { me } = useAuth();

    const items = useMemo(() => asArray(raw).map((j, i) => normalizeJob(j, i)), [raw]);

    const fetchJobs = async (opts = {}) => {
        const effectiveSort = opts.sortUi ?? sortUi;
        const serverSort = effectiveSort === "relevance" ? "relevance" : "date";

        const q = {
            what: opts.what ?? what,
            where: opts.where ?? where,
            fullTime: (opts.fullTime ?? fullTime) ? "true" : "false",
            permanent: (opts.permanent ?? permanent) ? "true" : "false",
            sortBy: serverSort,
            page: String(opts.page ?? page),
            size: "12",
        };

        const url = `/api/jobs/search?${new URLSearchParams(q)}`;

        setLoading(true);
        setErr("");

        try {
            const res = await fetch(url, { credentials: "include" });
            const text = await res.text();

            if (!res.ok) {
                let msg = `Search failed (${res.status})`;
                try {
                    const j = JSON.parse(text);
                    if (j?.message) msg = j.message;
                } catch {}
                setErr(msg);
                setRaw({ results: [] });
                return;
            }

            let data = null;
            try {
                data = JSON.parse(text);
            } catch {
                setErr("Unexpected response format. Try changing filters.");
                setRaw({ results: [] });
                return;
            }

            setRaw(data);
        } catch (e) {
            setErr(e?.message || "Network error");
            setRaw({ results: [] });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs({ page: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSearch = () => {
        setPage(0);
        fetchJobs({ page: 0 });
    };

    const nextPage = () => {
        const p = page + 1;
        setPage(p);
        fetchJobs({ page: p });
    };
    const prevPage = () => {
        const p = Math.max(0, page - 1);
        setPage(p);
        fetchJobs({ page: p });
    };

    const filtered = useMemo(() => {
        let list = [...items];

        if (companyFilter.trim()) {
            const needle = companyFilter.trim().toLowerCase();
            list = list.filter((j) => j.company.toLowerCase().includes(needle));
        }

        if (excludeFilter.trim()) {
            const terms = excludeFilter
                .split(",")
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);
            if (terms.length) {
                list = list.filter((j) => {
                    const hay = `${j.title} ${j.description} ${j.company} ${j.location}`.toLowerCase();
                    return !terms.some((t) => hay.includes(t));
                });
            }
        }

        if (remoteFilter !== "any") {
            list = list.filter(
                (j) => workTypeOf(j.title, j.location).toLowerCase() === remoteFilter
            );
        }

        if (postedWithin !== "any") {
            const days = Number(postedWithin);
            const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
            list = list.filter((j) => {
                const d = parseDate(j.created);
                return d ? d.getTime() >= cutoff : false;
            });
        }

        const withMonthly = list.map((j) => ({
            ...j,
            _minMonthly: Number.isFinite(j.salary_min) ? toMonthly(j.salary_min) : undefined,
            _maxMonthly: Number.isFinite(j.salary_max) ? toMonthly(j.salary_max) : undefined,
        }));

        let out = withMonthly;

        if (hasSalaryOnly) {
            out = out.filter((j) => Number.isFinite(j._minMonthly) || Number.isFinite(j._maxMonthly));
        }

        const thresh = Number(minMonthly);
        if (Number.isFinite(thresh) && thresh > 0) {
            out = out.filter((j) => {
                const c = j._maxMonthly ?? j._minMonthly;
                return Number.isFinite(c) ? c >= thresh : false;
            });
        }

        if (sortUi === "salaryHigh") {
            out.sort((a, b) => {
                const av = a._maxMonthly ?? a._minMonthly ?? 0;
                const bv = b._maxMonthly ?? b._minMonthly ?? 0;
                return bv - av;
            });
        } else if (sortUi === "salaryLow") {
            out.sort((a, b) => {
                const av = a._minMonthly ?? a._maxMonthly ?? Infinity;
                const bv = b._minMonthly ?? b._maxMonthly ?? Infinity;
                return av - bv;
            });
        } else if (sortUi === "date") {
            out.sort((a, b) => {
                const ad = parseDate(a.created)?.getTime() ?? 0;
                const bd = parseDate(b.created)?.getTime() ?? 0;
                return bd - ad;
            });
        }
        return out;
    }, [
        items,
        sortUi,
        remoteFilter,
        postedWithin,
        minMonthly,
        hasSalaryOnly,
        companyFilter,
        excludeFilter,
    ]);

    return (
        <section className="py-12">
            {/* Basic bar: What / Where / Actions */}
            <div
                className="rounded-2xl border p-5 md:p-6 mb-6"
                style={{
                    borderColor: TOKENS.stroke,
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
                }}
            >
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-center">
                    <input
                        value={what}
                        onChange={(e) => setWhat(e.target.value)}
                        placeholder="What (e.g., java, react)"
                        className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                        style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                    />
                    <input
                        value={where}
                        onChange={(e) => setWhere(e.target.value)}
                        placeholder="Where (city / empty = anywhere)"
                        className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                        style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                    />

                    {/* Actions aligned together */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={onSearch}
                            className="px-4 py-2 rounded-lg"
                            style={{ background: TOKENS.blue, color: "white" }}
                        >
                            Search
                        </button>

                        <button
                            onClick={async () => {
                                if (!me) return alert("Log in to save searches.");
                                try {
                                    const payload = {
                                        what,
                                        where,
                                        // persist the server arguments you use
                                        fullTime,
                                        permanent,
                                        sortBy: (["date","relevance"].includes(sortUi) ? sortUi : "date"),
                                        page: "0",
                                        size: "12",
                                        savedAt: new Date().toISOString(),
                                    };
                                    const res = await fetch("/api/saved/searches", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" }, // cookie auth -> no Authorization header
                                        credentials: "include",
                                        body: JSON.stringify(payload),
                                    });
                                    if (!res.ok) {
                                        const t = await res.text().catch(() => "");
                                        throw new Error(`Save failed (${res.status}) ${t || ""}`);
                                    }
                                } catch (e) {
                                }
                            }}
                            className="px-4 py-2 rounded-lg bg-white/10 border"
                            style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                        >
                            Save this search
                        </button>

                        <button
                            onClick={() => setShowFilters((s) => !s)}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                            style={{ color: TOKENS.ink, border: `1px solid ${TOKENS.stroke}` }}
                        >
                            {showFilters ? "Hide Filters" : "Filters"}
                        </button>
                    </div>
                </div>



            {showFilters && (
                    <div
                        className="mt-4 rounded-xl border p-4 grid gap-3"
                        style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}
                    >
                        <div className="grid gap-3 md:grid-cols-5">
                            <select
                                value={remoteFilter}
                                onChange={(e) => setRemoteFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            >
                                <option value="any">Any work style</option>
                                <option value="remote">Remote</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="onsite">Onsite</option>
                            </select>

                            <select
                                value={postedWithin}
                                onChange={(e) => setPostedWithin(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            >
                                <option value="any">Any date</option>
                                <option value="3">Last 3 days</option>
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                            </select>

                            <input
                                value={minMonthly}
                                onChange={(e) => setMinMonthly(e.target.value.replace(/[^\d]/g, ""))}
                                inputMode="numeric"
                                placeholder="Min monthly salary"
                                className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            />

                            <select
                                value={sortUi}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setSortUi(v);
                                    if (v === "date" || v === "relevance") {
                                        setPage(0);
                                        fetchJobs({ sortUi: v, page: 0 });
                                    }
                                }}
                                className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            >
                                <option value="date">Newest</option>
                                <option value="relevance">Relevance</option>
                                <option value="salaryHigh">Salary (high → low)</option>
                                <option value="salaryLow">Salary (low → high)</option>
                            </select>

                            <label className="flex items-center gap-2 text-sm" style={{ color: TOKENS.ink }}>
                                <input
                                    type="checkbox"
                                    checked={hasSalaryOnly}
                                    onChange={(e) => setHasSalaryOnly(e.target.checked)}
                                />
                                With salary only
                            </label>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <input
                                value={companyFilter}
                                onChange={(e) => setCompanyFilter(e.target.value)}
                                placeholder="Company contains…"
                                className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            />

                            <input
                                value={excludeFilter}
                                onChange={(e) => setExcludeFilter(e.target.value)}
                                placeholder="Exclude words (comma-separated)"
                                className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            />

                            <label className="flex items-center gap-2 text-sm" style={{ color: TOKENS.ink }}>
                                <input
                                    type="checkbox"
                                    checked={fullTime}
                                    onChange={(e) => setFullTime(e.target.checked)}
                                />
                                Full-time
                            </label>
                            <label className="flex items-center gap-2 text-sm" style={{ color: TOKENS.ink }}>
                                <input
                                    type="checkbox"
                                    checked={permanent}
                                    onChange={(e) => setPermanent(e.target.checked)}
                                />
                                Permanent
                            </label>
                        </div>

                        <div className="flex gap-3 justify-end pt-1">
                            <button
                                onClick={() => {
                                    setRemoteFilter("any");
                                    setPostedWithin("any");
                                    setMinMonthly("");
                                    setHasSalaryOnly(false);
                                    setCompanyFilter("");
                                    setExcludeFilter("");
                                    setFullTime(false);
                                    setPermanent(false);
                                    setSortUi("date");
                                    setPage(0);
                                    fetchJobs({
                                        fullTime: false,
                                        permanent: false,
                                        sortUi: "date",
                                        page: 0,
                                    });
                                }}
                                className="px-4 py-2 rounded-lg bg-white/10"
                                style={{ color: TOKENS.ink }}
                            >
                                Reset filters
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="px-4 py-2 rounded-lg"
                                style={{ background: TOKENS.mint, color: "#05261a" }}
                            >
                                Apply & Close
                            </button>
                        </div>

                        {(fullTime || permanent) && (
                            <div className="text-xs" style={{ color: TOKENS.subtext }}>
                                Tip: some providers have sparse results for Full-time / Permanent. If you get few results, try relaxing those.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {loading && <div className="text-slate-300">Loading…</div>}
            {!loading && err && <div className="text-rose-300 mb-4">{err}</div>}
            {!loading && !err && filtered.length === 0 && (
                <div className="text-slate-300">No jobs found for this filter.</div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filtered.map((j, i) => {
                    const title = j.title || "Untitled role";
                    const company = j.company || "—";
                    const loc = j.location || "—";
                    const desc = cleanText(j.description).slice(0, 220);
                    const url = j.url || "#";
                    const postedDate = parseDate(j.created);
                    const posted = postedDate ? postedDate.toLocaleDateString() : "";

                    const minM =
                        typeof j._minMonthly === "number"
                            ? j._minMonthly
                            : typeof j.salary_min === "number"
                                ? toMonthly(j.salary_min)
                                : undefined;
                    const maxM =
                        typeof j._maxMonthly === "number"
                            ? j._maxMonthly
                            : typeof j.salary_max === "number"
                                ? toMonthly(j.salary_max)
                                : undefined;

                    const currency = j.currency || "PLN";
                    const wt = workTypeOf(j.title, j.location);

                    return (
                        <div
                            key={`${j.id ?? i}-${title}`}
                            className="p-5 rounded-2xl border hover:bg-white/[0.04] transition group flex flex-col"
                            style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.03)" }}
                        >
                            <div className="text-base font-semibold text-white">{title}</div>
                            <div className="text-sm text-slate-400 mt-0.5">
                                {company} • {loc} {posted ? `• ${posted}` : ""}
                            </div>

                            <p className="text-sm text-slate-300 mt-3 flex-1">
                                {desc}
                                {desc.length >= 220 ? "…" : ""}
                            </p>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-300 mt-3">
                                {typeof minM === "number" && (
                                    <span className="px-2 py-1 rounded border" style={{ borderColor: TOKENS.stroke }}>
                    Min: {minM.toLocaleString()} {currency}/mo
                  </span>
                                )}
                                {typeof maxM === "number" && (
                                    <span className="px-2 py-1 rounded border" style={{ borderColor: TOKENS.stroke }}>
                    Max: {maxM.toLocaleString()} {currency}/mo
                  </span>
                                )}
                                <span className="px-2 py-1 rounded border" style={{ borderColor: TOKENS.stroke }}>
                  {wt}
                </span>
                                {j.categoryLabel && (
                                    <span className="px-2 py-1 rounded border" style={{ borderColor: TOKENS.stroke }}>
                    {j.categoryLabel}
                  </span>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <a
                                    className="inline-block text-center py-2 rounded-lg text-sm border hover:opacity-90"
                                    style={{ background: TOKENS.blue, color: "white", borderColor: TOKENS.stroke }}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View posting
                                </a>
                                <button
                                    onClick={() => {
                                        const { ok, reason } = addPick(j);
                                        if (!ok) alert(reason);
                                    }}
                                    className="px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20"
                                >
                                    Add to compare
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
                <button
                    onClick={prevPage}
                    disabled={page === 0 || loading}
                    className="px-3 py-2 rounded-lg bg-white/5 border disabled:opacity-50"
                    style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                >
                    Prev
                </button>
                <span className="text-slate-300 text-sm">Page {page + 1}</span>
                <button
                    onClick={nextPage}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg bg-white/5 border"
                    style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                >
                    Next
                </button>
            </div>
        </section>
    );
}
