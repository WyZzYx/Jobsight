// src/pages/Cabinet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loadPicks, clearPicks } from "../lib/compareStore";

const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    stroke: "rgba(255,255,255,0.10)",
    subtext: "#94A3B8",
    panel: "rgba(255,255,255,0.06)",
};

const Section = ({ title, action, children }) => (
    <div className="rounded-2xl border p-5 md:p-6" style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: TOKENS.ink }}>{title}</h3>
            {action}
        </div>
        {children}
    </div>
);

// add near the top of the file:
async function jget(url) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
async function jdel(url) {
    const res = await fetch(url, { method: "DELETE", credentials: "include" });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const getLS = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };


export default function Cabinet({ setCurrent }) {
    const { me, logout } = useAuth();

    // ---------- Profile (local fields + email from auth) ----------
    const [profile, setProfile] = useState(() =>
        getLS("jobsight_profile_v1", { displayName: "", country: "", headline: "" })
    );
    const saveProfile = () => {
        setLS("jobsight_profile_v1", profile);
        // toast-lite
        alert("Profile saved");
    };

    // -------- Saved Searches (backend) --------
    const [savedSearches, setSavedSearches] = useState([]);
    const [loadingSearches, setLoadingSearches] = useState(true);
    const [errSearches, setErrSearches] = useState("");

    useEffect(() => {
        (async () => {
            setLoadingSearches(true); setErrSearches("");
            try {
                const s = await jget("/api/saved/searches");
                setSavedSearches(Array.isArray(s) ? s : []);
            } catch (e) {
                setErrSearches(e?.message || "Failed to load");
                setSavedSearches([]);
            } finally {
                setLoadingSearches(false);
            }
        })();
    }, []);

    const removeSearch = async (id) => {
        await jdel(`/api/saved/searches/${id}`);
        setSavedSearches(prev => prev.filter(x => x.id !== id));
    };

    const runSearch = (s) => {
        // "prefill" for Explore to pick up
        setLS("jobsight_explore_prefill_v1", {
            what: s.what || "",
            where: s.where || "",
            fullTime: !!s.fullTime,
            permanent: !!s.permanent,
            sortBy: s.sortBy || "date",
        });
        setCurrent?.("explore");
    };


    // ---------- Saved compares ----------
    const [picks, setPicks] = useState(() => loadPicks());
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "jobsight_compare_v1") setPicks(loadPicks());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    const goCompare = () => setCurrent?.("compare");
    const clearAllCompares = () => { clearPicks(); setPicks([]); };

    // ---------- Saved roadmaps ----------

    // --- Saved roadmaps from server ---
    const [roadmaps, setRoadmaps] = useState([]);
    const [rmLoading, setRmLoading] = useState(false);
    const [rmErr, setRmErr] = useState("");

    const loadRoadmaps = async () => {
        setRmLoading(true);
        setRmErr("");
        try {
            const res = await fetch("/api/saved/roadmaps", { credentials: "include" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setRoadmaps(Array.isArray(data) ? data : []);
        } catch (e) {
            setRmErr(e?.message || "Failed to load roadmaps");
            setRoadmaps([]);
        } finally {
            setRmLoading(false);
        }
    };

    useEffect(() => { loadRoadmaps(); }, []);

    // ---------- Quiz ----------
    const quiz = useMemo(() => getLS("jobsight_quiz_result", null), []);
    const quizTop = useMemo(() => (quiz?.result?.topMajors || []).slice(0, 5), [quiz]);

    return (
        <section className="py-12">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold" style={{ color: TOKENS.ink }}>My Cabinet</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={logout}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: TOKENS.blue, color: "white" }}
                    >
                        Log out
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* -------- Profile -------- */}
                <Section
                    title="Profile"
                    action={
                        <button onClick={saveProfile} className="px-3 py-1.5 rounded-lg text-sm"
                                style={{ background: TOKENS.mint, color: "#05261a" }}>
                            Save
                        </button>
                    }
                >
                    <div className="grid gap-4">
                        <div>
                            <div className="text-xs mb-1" style={{ color: TOKENS.subtext }}>Email</div>
                            <div className="px-3 py-2 rounded-lg border bg-white/5"
                                 style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}>
                                {me?.email || "—"}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: TOKENS.subtext }}>Display name</label>
                            <input
                                value={profile.displayName}
                                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                placeholder="Your name"
                                className="px-3 py-2 rounded-lg bg-white/5 border w-full focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: TOKENS.subtext }}>Country</label>
                            <input
                                value={profile.country}
                                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                placeholder="PL / US / …"
                                className="px-3 py-2 rounded-lg bg-white/5 border w-full focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: TOKENS.subtext }}>Headline</label>
                            <input
                                value={profile.headline}
                                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                                placeholder="Junior Java Developer looking for…"
                                className="px-3 py-2 rounded-lg bg-white/5 border w-full focus:outline-none"
                                style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                            />
                        </div>
                    </div>
                </Section>

                <Section
                    title="Saved searches"
                    action={null} // remove "Open Explore" button per your request
                >
                    {loadingSearches && <div className="text-slate-300">Loading…</div>}
                    {errSearches && <div className="text-rose-300 text-sm">{errSearches}</div>}
                    {!loadingSearches && !errSearches && (
                        savedSearches.length === 0 ? (
                            <div className="text-sm" style={{ color: TOKENS.subtext }}>
                                You have no saved searches yet.
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {savedSearches.map((s) => (
                                    <li key={s.id} className="flex items-center justify-between gap-2 rounded border p-2"
                                        style={{ borderColor: TOKENS.stroke }}>
                                        <div className="text-sm" style={{ color: TOKENS.ink }}>
                                            <span className="font-medium">{s.what || "—"}</span>
                                            {" "}<span className="text-slate-400">in</span>{" "}
                                            <span className="font-medium">{s.where || "Anywhere"}</span>
                                            {s.sortBy ? <span className="text-slate-400"> • {s.sortBy}</span> : null}
                                            {s.createdAt ? (
                                                <span className="text-slate-500"> • {new Date(s.createdAt).toLocaleString()}</span>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => runSearch(s)}
                                                className="px-2.5 py-1 rounded bg-white/10 text-xs"
                                            >
                                                Run
                                            </button>
                                            <button
                                                onClick={() => removeSearch(s.id)}
                                                className="px-2.5 py-1 rounded bg-white/10 text-xs"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </Section>


                {/* -------- Saved Compares -------- */}
                <Section
                    title="Saved compares"
                    action={
                        <div className="flex items-center gap-2">
                            <button onClick={goCompare} className="px-3 py-1.5 rounded-lg text-sm bg-white/10">
                                Open Compare
                            </button>
                            {picks.length > 0 && (
                                <button onClick={clearAllCompares} className="px-3 py-1.5 rounded-lg text-sm bg-white/10">
                                    Clear
                                </button>
                            )}
                        </div>
                    }
                >
                    {picks.length === 0 ? (
                        <div className="text-sm" style={{ color: TOKENS.subtext }}>
                            Nothing saved yet. Add jobs from Explore → “Add to compare”.
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {picks.map((p, i) => (
                                <div key={p.id ?? i} className="rounded border p-2" style={{ borderColor: TOKENS.stroke }}>
                                    <div className="text-sm" style={{ color: TOKENS.ink }}>
                                        <span className="font-medium">{p.title}</span>
                                        {p.company ? <span className="text-slate-400"> — {p.company}</span> : null}
                                    </div>
                                    <div className="text-xs text-slate-400">{p.location || "—"}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* -------- Saved Roadmaps (server) -------- */}
                <Section
                    title="Saved roadmaps"
                    action={
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrent?.("roadmap")} className="px-3 py-1.5 rounded-lg text-sm bg-white/10">
                                Build new
                            </button>
                            <button onClick={loadRoadmaps} className="px-3 py-1.5 rounded-lg text-sm bg-white/10">
                                Refresh
                            </button>
                        </div>
                    }
                >
                    {rmLoading && <div className="text-sm" style={{color: TOKENS.subtext}}>Loading…</div>}
                    {rmErr && <div className="text-sm text-rose-300">{rmErr}</div>}
                    {!rmLoading && !rmErr && roadmaps.length === 0 && (
                        <div className="text-sm" style={{ color: TOKENS.subtext }}>
                            No roadmaps saved yet. Generate one on the Roadmap page and click “Save”.
                        </div>
                    )}
                    {!rmLoading && !rmErr && roadmaps.length > 0 && (
                        <ul className="space-y-2">
                            {roadmaps.map((r) => (
                                <li key={r.id} className="rounded border p-2" style={{ borderColor: TOKENS.stroke }}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="text-sm font-medium" style={{ color: TOKENS.ink }}>
                                                {r.title || "Untitled roadmap"}
                                            </div>
                                            <div className="text-xs" style={{ color: TOKENS.subtext }}>
                                                {r.createdAt ? new Date(r.createdAt).toLocaleString() : "saved"}
                                                {r.source ? ` • ${r.source}` : ""}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Download the text version if present */}
                                            {r.planText && (
                                                <button
                                                    onClick={() => {
                                                        const blob = new Blob([r.planText], { type: "text/plain;charset=utf-8" });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement("a");
                                                        a.href = url;
                                                        a.download = `${(r.title || "roadmap").replace(/[^\w\-]+/g, "_")}.txt`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="px-2.5 py-1 rounded bg-white/10 text-xs"
                                                >
                                                    Download
                                                </button>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    if (!confirm("Delete this saved roadmap?")) return;
                                                    try {
                                                        const res = await fetch(`/api/saved/roadmaps/${r.id}`, {
                                                            method: "DELETE",
                                                            credentials: "include",
                                                        });
                                                        if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
                                                        setRoadmaps((prev) => prev.filter((x) => x.id !== r.id));
                                                    } catch (e) {
                                                        alert(e?.message || "Delete failed");
                                                    }
                                                }}
                                                className="px-2.5 py-1 rounded bg-white/10 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    {/* Optional: small preview */}
                                    {r.planText && (
                                        <pre className="mt-2 text-xs whitespace-pre-wrap text-slate-300 max-h-40 overflow-auto">
{r.planText.slice(0, 1200)}
            </pre>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>


                {/* -------- Quiz -------- */}
                <Section
                    title="Quiz"
                    action={
                        <button onClick={() => setCurrent?.("quiz")} className="px-3 py-1.5 rounded-lg text-sm bg-white/10">
                            Open Quiz
                        </button>
                    }
                >
                    {!quiz ? (
                        <div className="text-sm" style={{ color: TOKENS.subtext }}>
                            No quiz results yet.
                        </div>
                    ) : (
                        <div>
                            <div className="text-sm" style={{ color: TOKENS.ink }}>
                                Top matches:
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {quizTop.map((m) => (
                                    <span key={m} className="px-2.5 py-1 rounded border text-xs"
                                          style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}>
                    {m}
                  </span>
                                ))}
                            </div>
                        </div>
                    )}
                </Section>
            </div>
        </section>
    );
}
