import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

// Same tokens for consistent look
const TOKENS = {
    blue: "#2563EB",
    mint: "#10B981",
    ink: "#E5E7EB",
    panel: "rgba(255,255,255,0.06)",
    stroke: "rgba(255,255,255,0.10)",
};

const HeroCTA = ({ setCurrent }) => (
    <section className="py-16 md:py-24">
        <div
            className="relative overflow-hidden rounded-[28px] border"
            style={{
                borderColor: TOKENS.stroke,
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            }}
        >
            {/* Decorative gradients */}
            <div
                className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-20"
                style={{ background: `radial-gradient(closest-side, ${TOKENS.mint}, transparent)` }}
            />
            <div
                className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full opacity-20"
                style={{ background: `radial-gradient(closest-side, ${TOKENS.blue}, transparent)` }}
            />

            <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
                <div>
                    <motion.h1
                        className="text-3xl md:text-5xl font-semibold tracking-tight"
                        style={{ color: TOKENS.ink }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        Choose a career with clarity.
                    </motion.h1>
                    <motion.p
                        className="mt-4 text-slate-300 text-base md:text-lg max-w-xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        Compare jobs by salary, growth, remote options, and build a skill roadmap tailored to you.
                    </motion.p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <button
                            className="px-5 py-3 rounded-2xl font-medium"
                            style={{ background: TOKENS.blue }}
                            onClick={() => setCurrent("quiz")}
                        >
                            Start the 60-second quiz
                        </button>

                        <button
                            className="px-5 py-3 rounded-2xl font-medium border"
                            style={{ borderColor: TOKENS.stroke }}
                            onClick={() => setCurrent("roadmap")}
                        >
                            Build my roadmap
                        </button>
                    </div>

                    {/* Trust row */}
                    <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span
                className="px-3 py-1.5 rounded-full border"
                style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}
            >
              120+ careers
            </span>
                        <span
                            className="px-3 py-1.5 rounded-full border"
                            style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}
                        >
              Real PLN salaries
            </span>
                        <span
                            className="px-3 py-1.5 rounded-full border"
                            style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}
                        >
              Actionable roadmaps
            </span>
                    </div>
                </div>

                {/* Minimal visual */}
                <div className="hidden md:block">
                    <div
                        className="h-[320px] rounded-2xl border relative overflow-hidden"
                        style={{ borderColor: TOKENS.stroke, background: TOKENS.panel }}
                    >
                        <div className="absolute inset-x-8 bottom-8 flex items-end gap-2">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-3 rounded-t"
                                    style={{
                                        height: `${Math.max(6, Math.sin(i / 1.6) * 16 + 28)}px`,
                                        background: i % 3 === 0 ? `${TOKENS.mint}BB` : `${TOKENS.blue}BB`,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="absolute top-6 left-6 text-xs text-slate-300">Salary • Growth • Remote</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// 3 highlight tiles — whole tile is clickable
function HighlightTiles({ setCurrent }) {
    const tiles = [
        { t: "Explore careers", go: "explore" },
        { t: "Compare 2–4 roles", go: "compare" },
        { t: "Build my roadmap", go: "roadmap" },
    ];

    return (
        <section className="pb-20 grid md:grid-cols-3 gap-4">
            {tiles.map((card, i) => (
                <motion.div
                    key={card.t}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                >
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setCurrent(card.go)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setCurrent(card.go)}
                        className="p-5 rounded-2xl border hover:translate-y-[-2px] transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
                        style={{ borderColor: TOKENS.stroke, background: "rgba(255,255,255,0.04)" }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-slate-300">{card.t}</div>
                            <span className="mt-3 inline-flex items-center gap-1 text-sm" style={{ color: TOKENS.ink }}>
                Open <ChevronRight size={16} />
              </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </section>
    );
}

export default function Dashboard({ setCurrent }) {
    return (
        <>
            <HeroCTA setCurrent={setCurrent} />
            <HighlightTiles setCurrent={setCurrent} />
        </>
    );
}
