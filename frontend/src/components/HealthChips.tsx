import { cn } from "@/lib/utils";

interface HealthChipsProps {
    health: Record<string, boolean>;
}

export function HealthChips({ health }: HealthChipsProps) {
    return (
        <div className="flex gap-4 mb-12">
            {Object.entries(health).map(([key, ok]) => (
                <div key={key} className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-sm",
                    ok ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-red-500/5 border-red-500/20 text-red-400"
                )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", ok ? "bg-emerald-400" : "bg-red-400")} />
                    {key.toUpperCase()}
                </div>
            ))}
        </div>
    );
}
