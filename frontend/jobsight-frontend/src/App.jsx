// src/App.jsx
import React, { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Explore from "./pages/Explore.jsx";
import Roadmap from "./pages/Roadmap.jsx";
import Quiz from "./pages/Quiz.jsx";
import Compare from "./pages/Compare.jsx";
import Cabinet from "./pages/Cabinet.jsx";


import AuthModal from "./components/AuthModal";
import { useAuth } from "./context/AuthContext"; // <-- use the context, not local setMe

// Premium Blue + Mint tokens (same palette)
const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    bg: "#0B1220",
    panel: "rgba(255,255,255,0.06)",
    stroke: "rgba(255,255,255,0.10)",
    subtext: "#94A3B8",
};


function Shell({ current, setCurrent, me, onLoginClick, onLogout, children }) {

    const [displayName, setDisplayName] = React.useState(() => {
        try {
            const p = JSON.parse(localStorage.getItem("jobsight_profile_v1") || "{}");
            return p.displayName || "";
        } catch { return ""; }
    });

    useEffect(() => {
        const refresh = () => {
            try {
                const p = JSON.parse(localStorage.getItem("jobsight_profile_v1") || "{}");
                setDisplayName(p.displayName || "");
            } catch {
                setDisplayName("");
            }
        };
        window.addEventListener("storage", refresh);
        window.addEventListener("jobsight:profile-updated", refresh);
        return () => {
            window.removeEventListener("storage", refresh);
            window.removeEventListener("jobsight:profile-updated", refresh);
        };
    }, []);

    return (
        <div
            className="text-white"
            style={{
                minHeight: "100vh",
                background: `radial-gradient(900px 500px at -10% -10%, ${TOKENS.mint}20, transparent),
                     radial-gradient(800px 400px at 110% 0%, ${TOKENS.blue}25, transparent),
                     linear-gradient(180deg, ${TOKENS.bg} 0%, ${TOKENS.bg} 60%, #0D1326 100%)`,
            }}
        >
            <header
                className="sticky top-0 z-40 backdrop-blur-md"
                style={{ background: "rgba(9,13,25,0.6)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}
            >
                <div
                    className="max-w-[1160px] mx-auto px-4 grid items-center h-14"
                    style={{gridTemplateColumns: "1fr auto 1fr"}}
                >
                    {/* left: brand (clickable) */}
                    <button
                        type="button"
                        onClick={() => setCurrent("dashboard")}
                        className="flex items-center gap-3 bg-transparent border-0 p-0 cursor-pointer select-none"
                        aria-label="Go to Dashboard"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setCurrent("dashboard");
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-xl"
                            style={{ background: "linear-gradient(135deg, #2563EB, #10B981)" }}
                        />
                        <div className="font-semibold tracking-wide" style={{ color: "#E5E7EB" }}>
                            JobSight
                        </div>
                    </button>


                    {/* center: nav (centered) */}
                    <nav className="hidden md:flex items-center gap-2 text-sm justify-center">
                        {[
                            {id: "dashboard", label: "Dashboard"},
                            {id: "explore", label: "Explore"},
                            {id: "compare", label: "Compare"},
                            {id: "roadmap", label: "Build my roadmap"},
                            {id: "quiz", label: "Quiz"},
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setCurrent(t.id)}
                                className={`px-3 py-2 rounded-lg ${current === t.id ? "bg-white/10" : "hover:bg-white/5"}`}
                                style={{
                                    border: `1px solid ${current === t.id ? "rgba(255,255,255,0.10)" : "transparent"}`,
                                    color: "#E5E7EB",
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>

                    {/* right: auth menu */}
                    <div className="flex items-center gap-2 justify-end">
                        {!me ? (
                            <button
                                onClick={onLoginClick}
                                className="px-3 py-2 rounded-lg bg-white/5 border text-sm"
                                style={{borderColor: "rgba(255,255,255,0.10)", color: "#E5E7EB"}}
                            >
                                Log in
                            </button>
                        ) : (
                            <div className="relative group">
                                {/* Trigger */}
                                <button
                                    className="px-3 py-2 rounded-lg bg-white/5 border text-sm"
                                    style={{borderColor: "rgba(255,255,255,0.10)", color: "#E5E7EB"}}
                                >
                                    {displayName || me.email}

                                </button>

                                {/* Invisible hover bridge */}
                                <div className="absolute top-full left-0 w-full h-4"></div>

                                {/* Dropdown */}
                                <div
                                    className="absolute right-0 mt-2 hidden group-hover:block min-w-[200px] rounded-xl border p-2 shadow-lg"
                                    style={{
                                        borderColor: "rgba(255,255,255,0.10)",
                                        background: "rgba(17,24,39,0.98)",
                                    }}
                                >
                                    <button
                                        onClick={() => setCurrent("cabinet")}

                                        className="block w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm"
                                    >
                                        My Cabinet
                                    </button>
                                    <button
                                        onClick={onLogout}
                                        className="block w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm"
                                    >
                                        Log out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div/>
                </div>
            </header>

            <main className="max-w-[1160px] mx-auto px-4">{children}</main>
        </div>
    );
}

export default function App() {
    const [current, setCurrent] = useState("dashboard");
    const [authOpen, setAuthOpen] = useState(false);

    // from AuthContext
    const {me, refresh, logout} = useAuth();

    // try to fetch current user on mount; 401 is normal before login
    useEffect(() => {
        refresh()
    }, [refresh])


    const onAuthed = async () => {
        setAuthOpen(false);
        await refresh().catch(() => {
        });
    };

    return (
        <Shell
            current={current}
            setCurrent={setCurrent}
            me={me}
            onLoginClick={() => setAuthOpen(true)}
            onLogout={logout}
        >
            {current === "dashboard" && <Dashboard setCurrent={setCurrent}/>}
            {current === "explore" && <Explore/>}
            {current === "roadmap" && <Roadmap/>}
            {current === "compare" && <Compare setCurrent={setCurrent}/>}
            {current === "quiz" && <Quiz setCurrent={setCurrent}/>}

            {current === "cabinet" && <Cabinet setCurrent={setCurrent} />}

            <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthed={onAuthed}/>
        </Shell>
    );
}
