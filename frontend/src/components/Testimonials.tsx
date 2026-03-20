export function Testimonials() {
    return (
        <div className="space-y-12">
            <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">Enterprise Success Stories</h2>
                <p className="text-slate-500">How leading companies use FormSense AI to automate their workflows.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    {
                        name: "Sarah Chen",
                        role: "CTO @ Fintech Solutions",
                        text: "FormSense AI reduced our mortgage processing time from 4 days to 30 seconds. The classification accuracy is unmatched in the industry.",
                        image: "SC"
                    },
                    {
                        name: "David Kumar",
                        role: "Operations Lead @ Global Logix",
                        text: "We process 50,000 invoices a month. The quarterly plan is the best value investment we make. Support is 24/7 and top-tier.",
                        image: "DK"
                    }
                ].map((t, i) => (
                    <div key={i} className="p-10 bg-slate-900/20 border border-slate-800 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full" />
                        <p className="text-slate-300 text-lg mb-8 relative z-10 font-medium leading-relaxed italic">"{t.text}"</p>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">{t.image}</div>
                            <div>
                                <p className="font-bold text-white leading-none mb-1">{t.name}</p>
                                <p className="text-xs text-slate-500">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
