// src/lib/auth.js
import { jget, jpost, setBearer } from './http';

export const auth = {
    me: () => jget('/api/auth/me'),
    login: async (email, password) => {
        const r = await jpost('/api/auth/login', { email, password });
        setBearer(r?.token);       // <— store token if present
        return r;
    },
    register: async (email, password) => {
        const r = await jpost('/api/auth/register', { email, password });
        setBearer(r?.token);       // optional, if you also return token there
        return r;
    },
    logout: async () => {
        try { await jpost('/api/auth/logout'); } catch {}
        setBearer(null);
    },
};
