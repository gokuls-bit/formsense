import { motion } from "framer-motion";
import { History, FileText } from "lucide-react";

interface HistoryTabProps {
    history: any[];
    onRefresh: () => void;
}

export function HistoryTab({ history, onRefresh }: HistoryTabProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <History className="w-6 h-6 text-indigo-400" />
                    Processing History
                </h2>
                <button onClick={onRefresh} className="text-xs text-indigo-400 font-bold hover:underline">Refresh List</button>
            </div>

            <div className="space-y-3">
                {history.length > 0 ? history.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                                <FileText className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-200">{doc.filename}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{doc.id} • {new Date(doc.upload_time).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.document_category}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 text-slate-500">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No documents found in history.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
