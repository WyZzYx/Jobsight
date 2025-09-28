// src/pages/RoadmapPrecise.jsx
import React, { useMemo, useState } from "react";

// --- theme tokens (same palette you've been using)
const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    panel: "rgba(255,255,255,0.06)",
    stroke: "rgba(255,255,255,0.10)",
    subtext: "#94A3B8",
};

export default function RoadmapPrecise() {
    // minimal fields expected by /api/roadmap/precise
    const [targetRole, setTargetRole] = useState("Data Analyst");
    const [currentSkills, setCurrentSkills] = useState("excel, sql");
    const [timelineMonths, setTimelineMonths] = useState(4);
    const [country, setCountry] = useState("PL");

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [plan, setPlan] = useState("");
    const [model, setModel] = useState("");

    const canSubmit = useMemo(() => {
        if (!targetRole?.trim()) return false;
        const m = Number(timelineMonths);
        return Number.isFinite(m) && m >= 1 && m <= 18;
    }, [targetRole, timelineMonths]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setErr("");
        setPlan("");

        const payload = {
            targetRole: targetRole.trim(),
            currentSkills: (currentSkills || "").trim(),
            timelineMonths: String(timelineMonths),
            country: (country || "").trim(),
        };

        try {
            // use relative URL so it works in all envs behind the same origin/proxy
            const res = await fetch("/api/roadmap/precise", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });


            const text = await res.text();
            if (!res.ok) {
                try {
                    const j = JSON.parse(text);
                    throw new Error(j?.message || `HTTP ${res.status}`);
                } catch {
                    throw new Error(`HTTP ${res.status}`);
                }
            }
            const data = JSON.parse(text);
            setPlan(String(data.plan || ""));
            setModel(String(data.model || ""));
        } catch (e) {
            setErr(e?.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(plan);
        } catch {}
    };

    const onDownload = () => {
        const blob = new Blob([plan || ""], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeRole = (targetRole || "roadmap").replace(/[^\w\-]+/g, "_");
        a.href = url;
        a.download = `${safeRole}_roadmap.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    // in your Roadmap page
    const onSaveRoadmap = async () => {
        const txt = (plan || "").trim();        // `plan` is your generated text
        if (!txt) {
            alert("Generate a roadmap first.");
            return;
        }

        // Try to parse text as JSON; if it isn't JSON, we’ll just send `planText`
        let planObj = null;
        try {
            const maybe = JSON.parse(txt);
            if (maybe && typeof maybe === "object") planObj = maybe;
        } catch {}

        const payload = {
            title: `${(targetRole || "Roadmap").trim()}${timelineMonths ? ` (${timelineMonths} months)` : ""}`,
            source: "precise",          // or "from-skills" etc.
            planText: txt,              // always send text
            ...(planObj ? { plan: planObj } : {}), // only send `plan` if we parsed an object
            // optional extras (backend can ignore or map if you want to store them):
            targetRole: (targetRole || "").trim(),
            currentSkills: (currentSkills || "").trim(),
            timelineMonths: String(timelineMonths || ""),
            country: (country || "").trim(),
            model: (model || "").trim(),
            savedAt: new Date().toISOString(),
        };

        try {
            const res = await fetch("/api/saved/roadmaps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",           // important: cookie session
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`Save failed (${res.status}) ${t || ""}`);
            }
        } catch (e) {
        }
    };



    return (
        <section className="py-12">
            {/* Card */}
            <div
                className="rounded-2xl border p-6 md:p-8"
                style={{ borderColor: TOKENS.stroke, background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))" }}
            >
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <h2 className="text-xl md:text-2xl font-semibold" style={{ color: TOKENS.ink }}>
                        Precise Roadmap (LLM)
                    </h2>
                    {model && (
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${TOKENS.stroke}`, color: TOKENS.subtext }}>
              model: {model}
            </span>
                    )}
                </div>

                <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
                    {/* Target role */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm" style={{ color: TOKENS.subtext }}>Target role</label>
                        <input
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            placeholder="e.g., UX Designer, Data Analyst, Backend Developer"
                            className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                            style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                        />
                    </div>

                    {/* Timeline */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm" style={{ color: TOKENS.subtext }}>Timeline (months)</label>
                        <input
                            type="number"
                            min={1}
                            max={18}
                            value={timelineMonths}
                            onChange={(e) => setTimelineMonths(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                            style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                        />
                    </div>

                    {/* Current skills */}
                    <div className="md:col-span-2 flex flex-col gap-1">
                        <label className="text-sm" style={{ color: TOKENS.subtext }}>
                            Current skills (comma-separated, optional)
                        </label>
                        <textarea
                            rows={3}
                            value={currentSkills}
                            onChange={(e) => setCurrentSkills(e.target.value)}
                            placeholder="excel, sql, python basics"
                            className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                            style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                        />
                    </div>

                    {/* Country */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm" style={{ color: TOKENS.subtext }}>Country</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white/5 border focus:outline-none"
                            style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                        >
                            <option value="PL">PL</option>
                            <option value="US">US</option>
                            <option value="GB">GB</option>
                            <option value="DE">DE</option>
                            <option value="FR">FR</option>
                            <option value="IN">IN</option>
                            <option value="CA">CA</option>
                            <option value="AU">AU</option>
                            <option value="ES">ES</option>
                            <option value="IT">IT</option>
                        </select>
                    </div>

                    {/* Submit */}
                    <div className="md:col-span-2 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={!canSubmit || loading}
                            className="px-5 py-2.5 rounded-xl font-medium disabled:opacity-60"
                            style={{ background: TOKENS.blue, color: "white" }}
                        >
                            {loading ? "Generating…" : "Generate Roadmap"}
                        </button>

                        {err && (
                            <span className="text-rose-300 text-sm">{err}</span>
                        )}
                    </div>
                </form>

                {/* Output */}
                <div className="mt-6">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-sm" style={{color: TOKENS.subtext}}>Result</div>
                        <div className="flex gap-2">
                            <button
                                onClick={onCopy}
                                disabled={!plan}
                                className="px-3 py-1.5 rounded-lg text-sm bg-white/10 disabled:opacity-50"
                            >
                                Copy
                            </button>
                            <button
                                onClick={onDownload}
                                disabled={!plan}
                                className="px-3 py-1.5 rounded-lg text-sm bg-white/10 disabled:opacity-50"
                            >
                                Download .txt
                            </button>
                            <button
                                onClick={onSaveRoadmap}
                                disabled={!plan}
                                className="px-3 py-1.5 rounded-lg text-sm"
                                style={{background: TOKENS.mint, color: "#05261a"}}
                                title="Save to your account"
                            >
                                Save
                            </button>
                        </div>

                    </div>

                    <div
                        className="rounded-xl border p-4 whitespace-pre-wrap text-sm"
                        style={{
                            borderColor: TOKENS.stroke,
                            background: TOKENS.panel,
                            color: TOKENS.ink,
                            minHeight: "180px"
                        }}
                    >
                        {plan || (loading ? "" : "Your roadmap will appear here.")}
                    </div>
                </div>
            </div>

            {/* Helper note */}
            <p className="mt-3 text-xs" style={{color: TOKENS.subtext}}>
                Tip: keep timeline between 1–12 months for tighter plans. The model returns plain text following your requested structure.
            </p>
        </section>
    );
}
