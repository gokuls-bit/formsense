import { motion } from "framer-motion";
import { FileText, Zap, ShieldCheck, Lock } from "lucide-react";
import { DocumentResult } from "@/types";

interface ResultPanelProps {
    result: DocumentResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
            <div className="md:col-span-2 space-y-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                <FileText className="w-7 h-7 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">{result.filename}</h2>
                                <p className="text-slate-500 text-sm">Automated analysis result • {result.id}</p>
                            </div>
                        </div>
                        <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold text-sm">{result.document_category}</div>
                    </div>

                    <div className="p-8 bg-slate-950/50 rounded-3xl border border-slate-800/50 mb-8">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Neural Summary</h4>
                        <p className="text-slate-300 leading-relaxed text-lg italic underline decoration-indigo-500/30 underline-offset-8">"{result.summary}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Processing Time</h4>
                            <p className="text-2xl font-mono font-bold text-indigo-400">{result.processing_time}s</p>
                        </div>
                        <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">AI Confidence</h4>
                            <p className="text-2xl font-mono font-bold text-violet-400">{Math.round(result.category_confidence * 100)}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
                    <h3 className="font-bold flex items-center gap-2 mb-6 text-slate-300">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Raw Extracted Text
                    </h3>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/50 max-h-60 overflow-y-auto custom-scrollbar">
                        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                            {result.extracted_text}
                        </pre>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-md shadow-2xl">
                    <h3 className="font-bold flex items-center gap-2 mb-8 text-indigo-400 uppercase text-xs tracking-widest"><ShieldCheck className="w-4 h-4" /> Extracted Records</h3>
                    <div className="space-y-6">
                        {Object.entries(result.entities).map(([key, items]: [string, any]) => (
                            items.length > 0 && (
                                <div key={key}>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">{key}</span>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map((it: string, j: number) => (
                                            <span key={j} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">{it}</span>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl items-center text-center py-10 transition-all hover:border-slate-700">
                    <Lock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-400">Export as JSON</h4>
                    <p className="text-[10px] text-slate-600 px-4 mt-1 leading-tight">Secure JSON export available for enterprise subscribers</p>
                    <button className="mt-4 text-indigo-400 text-xs font-bold hover:underline">Upgrade to Unlock</button>
                </div>
            </div>
        </motion.div>
    );
}
