// src/lib/compareStore.js
const KEY = "jobsight_compare_v1";

/** Strip basic HTML from Adzuna descriptions */
const clean = (t) => (t || "").replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();

const toLocation = (loc) => {
    if (!loc) return "—";
    if (loc.display_name) return loc.display_name;
    if (Array.isArray(loc.area)) return loc.area.join(", ");
    return "—";
};

/** Normalize a job object so Compare has stable fields */
export const normalizeJob = (j) => ({
    // primary identity
    id: j?.id ?? null,
    key: j?.id ?? j?.redirect_url ?? Math.random().toString(36).slice(2),

    // display
    title: j?.title || "Untitled role",
    company: j?.company?.display_name || "—",
    location: toLocation(j?.location),
    created: j?.created || null,
    contract_type: j?.contract_type || "—",
    salary_min: typeof j?.salary_min === "number" ? j.salary_min : null,
    salary_max: typeof j?.salary_max === "number" ? j.salary_max : null,
    category: j?.category?.label || "—",
    description: clean(j?.description || ""),
    redirect_url: j?.redirect_url || null,
});

const loadRaw = () => {
    try {
        const s = localStorage.getItem(KEY);
        const arr = s ? JSON.parse(s) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
};

const saveRaw = (arr) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(arr));
    } catch {
        // ignore
    }
};

export const loadPicks = () => loadRaw();

export const clearPicks = () => saveRaw([]);

export const removePick = (keyOrId) => {
    const items = loadRaw().filter((p) => (p.id ?? p.key) !== keyOrId && p.key !== keyOrId);
    saveRaw(items);
    return items;
};

export const addPick = (job) => {
    const items = loadRaw();
    const pick = normalizeJob(job);

    // dedupe
    if (items.some((p) => (p.id ?? p.key) === (pick.id ?? pick.key))) {
        return { ok: false, reason: "Already added" };
    }
    if (items.length >= 3) {
        return { ok: false, reason: "You can compare up to 3 jobs" };
    }

    const next = [...items, pick];
    saveRaw(next);
    return { ok: true, items: next };
};
