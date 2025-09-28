// src/pages/Auth.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
    const { user, login, register, logout } = useAuth();
    const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
    const [mode,setMode]=useState("login"); const [err,setErr]=useState("");

    if (user) {
        return (
            <section className="py-12">
                <h2 className="text-xl mb-4">Hello, {user.email}</h2>
                <button className="px-3 py-2 rounded bg-white/10" onClick={logout}>Log out</button>
            </section>
        );
    }

    const submit = async (e)=>{ e.preventDefault(); setErr(""); try{
        if(mode==="login") await login(email,pw); else await register(email,pw);
    }catch(e){ setErr(e.message); } };

    return (
        <section className="py-12 max-w-md">
            <h2 className="text-xl mb-4">{mode==="login"?"Sign in":"Create account"}</h2>
            <form onSubmit={submit} className="grid gap-3">
                <input className="px-3 py-2 rounded bg-white/5 border" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                <input className="px-3 py-2 rounded bg-white/5 border" placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
                <button className="px-4 py-2 rounded bg-blue-600 text-white">{mode==="login"?"Sign in":"Register"}</button>
                {err && <div className="text-rose-300 text-sm">{err}</div>}
            </form>
            <button className="mt-3 text-sm underline" onClick={()=>setMode(mode==="login"?"register":"login")}>
                {mode==="login"?"Create account":"Have an account? Sign in"}
            </button>
        </section>
    );
}
