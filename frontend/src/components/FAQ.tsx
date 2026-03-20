export function FAQ() {
    return (
        <div className="max-w-3xl mx-auto space-y-10 py-10">
            <h2 className="text-4xl font-black text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
                {[
                    { q: "How secure is my data?", a: "We use AES-256 encryption at rest and TLS 1.3 in transit. We are SOC2 Type II compliant and never train our public models on your private data." },
                    { q: "Does the Quarterly plan include priority support?", a: "Yes. All Quarterly and Annual subscribers get a dedicated account manager and 1-hour SLA on critical tickets." },
                    { q: "Can I cancel my subscription anytime?", a: "Absolutely. You can manage your subscription settings directly from your dashboard. Quarterly plans are billed every 90 days." }
                ].map((faq, i) => (
                    <div key={i} className="p-8 bg-slate-950/50 border border-slate-900 rounded-3xl hover:border-slate-800 transition-colors">
                        <h4 className="font-bold text-lg mb-3 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {faq.q}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
