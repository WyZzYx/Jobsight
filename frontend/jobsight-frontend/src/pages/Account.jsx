// src/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Account() {
    const { user, logout } = useAuth();
    const [searches,setSearches]=useState([]);
    const [compares,setCompares]=useState([]);
    const [quizzes,setQuizzes]=useState([]);
    const [roadmaps,setRoadmaps]=useState([]);

    useEffect(()=>{ if(!user) return;
        const fetchAll = async ()=>{
            const j = async (u)=> (await fetch(u,{credentials:"include"})).json();
            setSearches(await j("/api/saved/searches"));
            setCompares(await j("/api/saved/compares"));
            setQuizzes(await j("/api/saved/quiz"));
            setRoadmaps(await j("/api/saved/roadmaps"));
        };
        fetchAll();
    },[user]);

    if(!user) return <section className="py-12">Please sign in.</section>;

    return (
        <section className="py-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl">Your Account</h2>
                <button className="px-3 py-2 rounded bg-white/10" onClick={logout}>Log out</button>
            </div>

            <h3 className="font-semibold mb-2">Saved Searches</h3>
            <ul className="mb-6">{searches.map(s=><li key={s.id}>{s.what} @ {s.where} ({s.sortBy})</li>)}</ul>

            <h3 className="font-semibold mb-2">Saved Compares</h3>
            <ul className="mb-6">{compares.map(c=><li key={c.id}>{c.title || "Compare set"} — {new Date(c.createdAt).toLocaleString()}</li>)}</ul>

            <h3 className="font-semibold mb-2">Saved Quiz Results</h3>
            <ul className="mb-6">{quizzes.map(q=><li key={q.id}>{new Date(q.createdAt).toLocaleString()}</li>)}</ul>

            <h3 className="font-semibold mb-2">Saved Roadmaps</h3>
            <ul className="mb-6">{roadmaps.map(r=><li key={r.id}>{r.title || r.source} — {new Date(r.createdAt).toLocaleString()}</li>)}</ul>
        </section>
    );
}
