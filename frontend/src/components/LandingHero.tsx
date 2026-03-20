import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface LandingHeroProps {
    onGetStarted: () => void;
    onViewPricing: () => void;
}

export function LandingHero({ onGetStarted, onViewPricing }: LandingHeroProps) {
    return (
        <div className="text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-8"
            >
                <Zap className="w-4 h-4 fill-indigo-400" /> New: Enterprise NLP v4.0 Released
            </motion.div>
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9]"
            >
                Document AI <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-400">
                    Built for SaaS.
                </span>
            </motion.h1>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
                Automate your data extraction workflow with millisecond latency.
                Classify, extract, and summarize with enterprise-grade accuracy.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-6">
                <button
                    onClick={onGetStarted}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                    Get Started Free
                </button>
                <button
                    onClick={onViewPricing}
                    className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                    View Enterprise Plans
                </button>
            </div>
        </div>
    );
}
