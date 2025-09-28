import React, { useEffect, useState } from "react";
import { auth } from "../lib/auth";

const TOKENS = {
    stroke: "rgba(255,255,255,0.10)",
    ink: "#E5E7EB",
    blue: "#2563EB",
    sub: "#94A3B8",
};

export default function AuthModal({ open, onClose, onAuthed }) {
    const [mode, setMode] = useState("login"); // 'login' | 'register'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) { setErr(""); setEmail(""); setPassword(""); setMode("login"); }
    }, [open]);

    if (!open) return null;

    const submit = async (e) => {
        e.preventDefault();
        setErr(""); setLoading(true);
        try {
            if (mode === "login") await auth.login(email.trim(), password);
            else await auth.register(email.trim(), password);
            onAuthed?.();
            onClose?.();
        } catch (e) {
            setErr(e?.message || "Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="w-full max-w-md rounded-2xl border p-6"
                 style={{ borderColor: TOKENS.stroke, background: "rgba(17,24,39,0.96)" }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: TOKENS.ink }}>
                        {mode === "login" ? "Log in" : "Create account"}
                    </h3>
                    <button onClick={onClose} className="text-sm text-slate-400 hover:underline">Close</button>
                </div>

                <form onSubmit={submit} className="grid gap-3">
                    <input
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        type="email" placeholder="Email"
                        className="px-3 py-2 rounded-lg bg-white/5 border"
                        style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                    />
                    <input
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        type="password" placeholder="Password (min 6 chars)"
                        className="px-3 py-2 rounded-lg bg-white/5 border"
                        style={{ borderColor: TOKENS.stroke, color: TOKENS.ink }}
                    />

                    {err && <div className="text-rose-300 text-sm">{err}</div>}

                    <button
                        disabled={loading}
                        className="mt-2 px-4 py-2 rounded-lg"
                        style={{ background: TOKENS.blue, color: "white", opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? "Please wait…" : (mode === "login" ? "Log in" : "Register")}
                    </button>
                </form>

                <div className="mt-3 text-sm" style={{ color: TOKENS.sub }}>
                    {mode === "login" ? (
                        <>No account?{" "}
                            <button className="underline" onClick={() => setMode("register")}>Register</button>
                        </>
                    ) : (
                        <>Already have an account?{" "}
                            <button className="underline" onClick={() => setMode("login")}>Log in</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
