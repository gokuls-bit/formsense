import { useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardUploadProps {
    isPremium: boolean;
    isProcessing: boolean;
    pipelineStep: number;
    onUpload: (file: File) => void;
}

export function DashboardUpload({ isPremium, isProcessing, pipelineStep, onUpload }: DashboardUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-8">
            {/* Upload Zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative group h-80 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer",
                    "bg-slate-900/40 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-900/60 shadow-2xl overflow-hidden"
                )}
            >
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)]" />

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                />

                <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 transition-all shadow-xl">
                        <Upload className="w-10 h-10 text-slate-300 group-hover:text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold mb-1">Process New Document</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Upload an invoice, contract, or ID to start the AI analysis pipeline.</p>
                    </div>
                </div>

                {isPremium && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-widest leading-none">
                        <Star className="w-3 h-3 fill-amber-400" /> High Accuracy Model
                    </div>
                )}
            </div>

            {/* Pipeline Tracker */}
            {isProcessing && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-10 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="font-bold flex items-center gap-3 text-lg">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> AI Vision Processing...
                        </h3>
                        <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                            Executing Sequence 00{pipelineStep + 1}
                        </span>
                    </div>

                    <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden mb-8">
                        <motion.div
                            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(pipelineStep / 4) * 100}%` }}
                        />
                    </div>

                    <div className="flex justify-between">
                        {[
                            "Upload",
                            "OCR",
                            "Classify",
                            "Extract",
                            "Finalize"
                        ].map((step, i) => {
                            const active = i <= pipelineStep;
                            return (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full mb-1", active ? "bg-indigo-500" : "bg-slate-800")} />
                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", active ? "text-indigo-400" : "text-slate-600")}>{step}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
