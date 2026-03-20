import { Zap, ShieldCheck, BarChart3, Lock } from "lucide-react";

export function FeatureGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[2rem] p-10 flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
                <div>
                    <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6">
                        <Zap className="w-7 h-7 text-indigo-400" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">Neural OCR Engine</h3>
                    <p className="text-slate-400 text-lg max-w-md">Our custom OCR engine handles messy handwriting, low-light scans, and complex table structures with 99.8% precision.</p>
                </div>
                <div className="mt-12 flex items-center gap-4">
                    <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400">conf {">"} 0.99</div>
                    <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400">latency {"<"} 40ms</div>
                </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-10 group overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-violet-600/10 blur-[60px] -mb-24 -mr-24 rounded-full" />
                <div className="w-14 h-14 bg-violet-600/20 rounded-2xl flex items-center justify-center mb-6">
                    <ShieldCheck className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">SOC2 Compliant</h3>
                <p className="text-slate-400">Enterprise security is baked in. Your documents are encrypted rest and in-transit.</p>
                <div className="mt-8 pt-8 border-t border-slate-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-10 relative overflow-hidden group">
                <div className="relative z-10">
                    <BarChart3 className="w-10 h-10 text-indigo-400 mb-6" />
                    <h3 className="text-2xl font-bold mb-2">Advanced Analytics</h3>
                    <p className="text-slate-400 text-sm">Real-time data visualization of your document processing fleet.</p>
                </div>
                <div className="absolute bottom-[-20px] left-[-20px] right-[-20px]">
                    <div className="flex items-end gap-1 px-4 opacity-30 group-hover:opacity-60 transition-opacity">
                        {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85].map((h, i) => (
                            <div key={i} className="flex-1 bg-indigo-500 rounded-t-sm" style={{ height: `${h}px` }} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[2rem] p-10 flex items-center gap-10">
                <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Automated Labeling</h3>
                    <p className="text-slate-400 text-lg">Classify documents into 12+ categories automatically using our proprietary zero-shot transformer models.</p>
                </div>
                <div className="hidden md:flex flex-col gap-3 flex-shrink-0">
                    {["Invoice", "ID Card", "Contract", "Form"].map((cat, i) => (
                        <div key={i} className="px-6 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" /> {cat}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
