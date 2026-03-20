"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";

// Types
import { DocumentResult, Stats } from "@/types";

// Components
import { Navbar } from "@/components/Navbar";
import { HealthChips } from "@/components/HealthChips";
import { LandingHero } from "@/components/LandingHero";
import { FeatureGrid } from "@/components/FeatureGrid";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { DashboardUpload } from "@/components/DashboardUpload";
import { ResultPanel } from "@/components/ResultPanel";
import { HistoryTab } from "@/components/HistoryTab";
import { StatsTab } from "@/components/StatsTab";
import { PricingModal } from "@/components/PricingModal";
import { PaymentGateway } from "@/components/PaymentGateway";

const API_BASE = "http://localhost:8000";

export default function SaaSPage() {
    const [activeTab, setActiveTab] = useState<"upload" | "history" | "stats" | "landing">("landing");
    const [isPremium, setIsPremium] = useState(false);
    const [premiumType, setPremiumType] = useState<"monthly" | "quarterly" | null>(null);
    const [showPricing, setShowPricing] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentStep, setPaymentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pipelineStep, setPipelineStep] = useState(0);
    const [result, setResult] = useState<DocumentResult | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [health, setHealth] = useState({ api: false, ocr: false, nlp: false, classifier: false });

    // Load initial data
    useEffect(() => {
        checkHealth();
        // Restore premium status
        const savedPremium = localStorage.getItem("fs_premium") === "true";
        if (savedPremium) {
            setIsPremium(true);
            setPremiumType(localStorage.getItem("fs_premium_type") as any);
        }

        if (activeTab === "history") fetchHistory();
        if (activeTab === "stats") fetchStats();
    }, [activeTab]);

    const checkHealth = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/api/health`);
            setHealth({
                api: data.services.api === "operational",
                ocr: data.services.ocr_easyocr === "available" || data.services.ocr_tesseract === "available",
                nlp: data.services.nlp_spacy === "available",
                classifier: data.services.classifier === "operational"
            });
        } catch (e) {
            setHealth({ api: false, ocr: false, nlp: false, classifier: false });
        }
    };

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/api/documents`);
            setHistory(data.documents);
        } catch (e) { console.error(e); }
    };

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/api/stats`);
            setStats(data);
        } catch (e) { console.error(e); }
    };

    const handleUpload = async (file: File) => {
        setIsProcessing(true);
        setResult(null);
        setPipelineStep(0);

        const formData = new FormData();
        formData.append("file", file);
        if (isPremium) formData.append("accuracy", "high");

        try {
            const interval = setInterval(() => {
                setPipelineStep(prev => (prev < 3 ? prev + 1 : prev));
            }, 1000);

            const { data } = await axios.post(`${API_BASE}/api/upload`, formData);

            clearInterval(interval);
            setPipelineStep(4);
            setResult(data);
            setTimeout(() => setIsProcessing(false), 800);
        } catch (e) {
            alert("Processing failed. Please check backend.");
            setIsProcessing(false);
        }
    };

    const simulatePayment = (type: "monthly" | "quarterly") => {
        setShowPricing(false);
        setShowPayment(true);
        setPaymentStep(0);

        const steps = 4;
        let step = 0;
        const interval = setInterval(() => {
            if (step < steps - 1) {
                step++;
                setPaymentStep(step);
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    localStorage.setItem("fs_premium", "true");
                    localStorage.setItem("fs_premium_type", type);
                    setIsPremium(true);
                    setPremiumType(type);
                    setShowPayment(false);
                    setActiveTab("upload");
                }, 1000);
            }
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 font-sans">
            <Navbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isPremium={isPremium}
                premiumType={premiumType}
                onShowPricing={() => setShowPricing(true)}
            />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <HealthChips health={health} />

                {activeTab === "landing" ? (
                    <div className="space-y-24">
                        <LandingHero
                            onGetStarted={() => setActiveTab("upload")}
                            onViewPricing={() => setShowPricing(true)}
                        />

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-10 border-t border-slate-900 flex flex-col items-center gap-8"
                        >
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Trusted by Forward-Thinking Engineering Teams</p>
                            <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                                {["MICROSOFT", "STRIPE", "CHASE", "GOKUL_CORP", "AIRBNB"].map((logo, i) => (
                                    <span key={i} className="text-xl font-black italic tracking-tighter text-slate-400">{logo}</span>
                                ))}
                            </div>
                        </motion.div>

                        <FeatureGrid />
                        <Testimonials />
                        <FAQ />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === "upload" && (
                            <div className="space-y-12">
                                <DashboardUpload
                                    isPremium={isPremium}
                                    isProcessing={isProcessing}
                                    pipelineStep={pipelineStep}
                                    onUpload={handleUpload}
                                />
                                {result && <ResultPanel result={result} />}
                            </div>
                        )}

                        {activeTab === "history" && (
                            <HistoryTab history={history} onRefresh={fetchHistory} />
                        )}

                        {activeTab === "stats" && stats && (
                            <StatsTab stats={stats} />
                        )}
                    </AnimatePresence>
                )}
            </main>

            <PricingModal
                show={showPricing}
                onClose={() => setShowPricing(false)}
                onSelectPlan={simulatePayment}
            />

            <PaymentGateway
                show={showPayment}
                step={paymentStep}
            />

            <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900 text-center">
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                    © 2026 FormSense AI • Semester Project Submission • Gokul Kumar Sant
                </p>
            </footer>
        </div>
    );
}
