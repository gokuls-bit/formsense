import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
    activeTab: string;
    setActiveTab: (tab: "upload" | "history" | "stats" | "landing") => void;
    isPremium: boolean;
    premiumType: "monthly" | "quarterly" | null;
    onShowPricing: () => void;
}

export function Navbar({ activeTab, setActiveTab, isPremium, premiumType, onShowPricing }: NavbarProps) {
    return (
        <nav className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab("landing")}>
                    <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        FormSense <span className="text-indigo-400">AI</span>
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    <button onClick={() => setActiveTab("landing")} className={cn("hover:text-white transition-colors", activeTab === "landing" && "text-white")}>Features</button>
                    <button onClick={() => setActiveTab("upload")} className={cn("hover:text-white transition-colors", activeTab === "upload" && "text-white")}>Dashboard</button>
                    <button onClick={() => setActiveTab("history")} className={cn("hover:text-white transition-colors", activeTab === "history" && "text-white")}>History</button>
                    <button onClick={() => setActiveTab("stats")} className={cn("hover:text-white transition-colors", activeTab === "stats" && "text-white")}>Analytics</button>
                    <button onClick={onShowPricing} className="hover:text-white transition-colors">Pricing</button>
                </div>

                <div className="flex items-center gap-4">
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-all",
                        isPremium
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                    )}>
                        {isPremium ? `${premiumType} Premium` : "Free Plan"}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 group relative">
                        GS
                        <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
                            <p className="text-[10px] text-slate-500 mb-1">Signed in as</p>
                            <p className="text-xs text-white truncate">gokul.kumar@formsense.ai</p>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
