import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";

interface PricingModalProps {
    show: boolean;
    onClose: () => void;
    onSelectPlan: (type: "monthly" | "quarterly") => void;
}

export function PricingModal({ show, onClose, onSelectPlan }: PricingModalProps) {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-16"
                    >
                        <div className="text-center mb-16">
                            <h2 className="text-5xl font-black mb-4">Choose Your Plan</h2>
                            <p className="text-slate-400">Scale your document workflow with predictable pricing.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Standard Monthly */}
                            <div className="p-10 bg-slate-950 rounded-[2rem] border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
                                <div>
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h3 className="text-3xl font-bold mb-2">Pro Monthly</h3>
                                            <p className="text-slate-500 text-sm">For individuals & startups.</p>
                                        </div>
                                        <div className="px-4 py-1 bg-indigo-500/10 rounded-full text-indigo-400 font-bold text-[10px] uppercase tracking-widest border border-indigo-500/20">Popular</div>
                                    </div>
                                    <div className="flex items-baseline mb-10">
                                        <span className="text-6xl font-black">$49</span>
                                        <span className="text-slate-500 ml-2">/month</span>
                                    </div>
                                    <ul className="space-y-4 text-sm text-slate-400">
                                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> High Accuracy Model Selection</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 1,000 Documents / Month</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Export to JSON/CSV</li>
                                    </ul>
                                </div>
                                <button onClick={() => onSelectPlan("monthly")} className="mt-12 w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Subscribe Now</button>
                            </div>

                            {/* Quarterly Plan */}
                            <div className="p-10 bg-slate-950 rounded-[2rem] border border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10"><Star className="w-10 h-10 text-amber-500/20 group-hover:scale-125 transition-transform" /></div>
                                <div>
                                    <div className="mb-10">
                                        <h3 className="text-3xl font-bold mb-2 text-amber-500">Quarterly Pro</h3>
                                        <p className="text-slate-500 text-sm italic">Great for semester long projects.</p>
                                    </div>
                                    <div className="flex items-baseline mb-10">
                                        <span className="text-6xl font-black">$45</span>
                                        <span className="text-slate-500 ml-2">/month*</span>
                                    </div>
                                    <p className="text-[10px] text-amber-500/60 font-bold uppercase mb-8 italic tracking-widest">*Billed as $135 every 3 months</p>
                                    <ul className="space-y-4 text-sm text-slate-400">
                                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Everything in Pro Monthly</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-500" /> No Rate Limits</li>
                                        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Dedicated AI Instance</li>
                                    </ul>
                                </div>
                                <button onClick={() => onSelectPlan("quarterly")} className="mt-12 w-full py-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all">Get Quarterly Deal</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
