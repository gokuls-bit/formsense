import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface PaymentGatewayProps {
    show: boolean;
    step: number;
}

export function PaymentGateway({ show, step }: PaymentGatewayProps) {
    const steps = [
        "Connecting to secure gateway...",
        "Validating payment method...",
        "Processing transaction...",
        "Authorized. Provisioning Premium Tier..."
    ];

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/40">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl text-center">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-10 overflow-hidden relative">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full" />
                            <ShieldCheck className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-black mb-4">Secure Checkout</h2>
                        <div className="space-y-4 text-slate-400 text-sm mb-12 h-16">
                            <AnimatePresence mode="wait">
                                <motion.p key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="font-mono italic">
                                    {steps[step]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 rounded-2xl border border-slate-800">
                                <span className="text-slate-500 text-xs">Transaction ID</span>
                                <span className="text-indigo-400 font-mono text-xs">TXN_{Math.random().toString(36).substring(7).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 rounded-2xl border border-slate-800">
                                <span className="text-slate-500 text-xs">Status</span>
                                <span className="text-amber-500 font-bold text-xs uppercase animate-pulse">Processing...</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
