import { motion } from "framer-motion";
import { FileText, Zap, ShieldCheck, BarChart3 } from "lucide-react";
import { Stats } from "@/types";
import { cn } from "@/lib/utils";

interface StatsTabProps {
    stats: Stats;
}

export function StatsTab({ stats }: StatsTabProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
            {[
                { icon: FileText, value: stats.total_documents, label: "Docs Processed", color: "text-indigo-400" },
                { icon: Zap, value: `${stats.avg_processing_time}s`, label: "Avg Execution", color: "text-amber-400" },
                { icon: ShieldCheck, value: `${Math.round(stats.avg_confidence * 100)}%`, label: "AI Confidence", color: "text-emerald-400" },
                { icon: BarChart3, value: Object.keys(stats.categories).length, label: "Cat Identified", color: "text-violet-400" }
            ].map((stat, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 text-center">
                    <stat.icon className={cn("w-8 h-8 mx-auto mb-4", stat.color)} />
                    <p className="text-3xl font-black mb-1 font-mono tracking-tighter">{stat.value}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </div>
            ))}

            <div className="md:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                <h3 className="font-bold mb-6 text-slate-300">Category Insights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Object.entries(stats.categories).map(([cat, count], i) => (
                        <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                            <div className="text-indigo-400 font-bold text-xl mb-1">{count}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
