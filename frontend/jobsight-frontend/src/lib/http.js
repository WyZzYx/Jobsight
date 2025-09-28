// src/lib/http.js
let BEARER = null;                        // <— in-memory token

export function setBearer(t) { BEARER = t || null; }

function withAuth(opts = {}) {
    const headers = new Headers(opts.headers || {});
    if (BEARER) headers.set('Authorization', `Bearer ${BEARER}`);
    return { ...opts, headers, credentials: 'include' }; // keep cookie too
}

export async function jget(url) {
    const res = await fetch(url, withAuth());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function jpost(url, body) {
    const res = await fetch(url, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
    }));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
