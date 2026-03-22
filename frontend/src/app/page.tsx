"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "react-hot-toast";

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
import { McpPanel } from "@/components/McpPanel";

// State
import { useAppStore } from "@/store";

const API_BASE = "http://localhost:8000";

export default function SaaSPage() {
    const queryClient = useQueryClient();
    
    // Global State
    const { 
        activeDocument, setActiveDocument, 
        pipelineStep, setPipelineStep, 
        isProcessing, setIsProcessing,
        setShowSkillPanel 
    } = useAppStore();

    // Local UI State
    const [activeTab, setActiveTab] = useState<"upload" | "history" | "stats" | "landing">("landing");
    const [isPremium, setIsPremium] = useState(false);
    const [premiumType, setPremiumType] = useState<"monthly" | "quarterly" | null>(null);
    const [showPricing, setShowPricing] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentStep, setPaymentStep] = useState(0);

    // React Query Hooks
    const healthQuery = useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const { data } = await axios.get(`${API_BASE}/api/health`);
            return data.services;
        },
        refetchInterval: 30000 
    });

    const documentsQuery = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
             const { data } = await axios.get(`${API_BASE}/api/documents`);
             return data.documents as DocumentResult[];
        },
        enabled: activeTab === "history" || activeTab === "upload" 
    });

    const statsQuery = useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
             const { data } = await axios.get(`${API_BASE}/api/stats`);
             return data as Stats;
        },
        enabled: activeTab === "stats"
    });

    useEffect(() => {
        const savedPremium = localStorage.getItem("fs_premium") === "true";
        if (savedPremium) {
            setIsPremium(true);
            setPremiumType(localStorage.getItem("fs_premium_type") as any);
        }
    }, []);

    // Upload Flow
    const handleUpload = async (file: File) => {
        setIsProcessing(true);
        setActiveDocument(null);
        setPipelineStep(0);

        const formData = new FormData();
        formData.append("file", file);
        if (isPremium) formData.append("accuracy", "high");

        try {
            const interval = setInterval(() => {
                setPipelineStep((prev: number) => (prev < 3 ? prev + 1 : prev));
            }, 800);

            const { data } = await axios.post(`${API_BASE}/api/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            clearInterval(interval);
            setPipelineStep(4);
            setActiveDocument(data);
            toast.success("Document analyzed successfully!");
            queryClient.invalidateQueries({ queryKey: ['documents'] }); // auto-refetch
            queryClient.invalidateQueries({ queryKey: ['stats'] });

            setTimeout(() => setIsProcessing(false), 800);
            
            // Trigger MCP Discovery notification
            setTimeout(() => toast.custom((t: any) => (
                <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-4 flex flex-col gap-2 shadow-xl shadow-indigo-500/20">
                    <p className="text-sm font-medium text-white">Advanced Parsing Available</p>
                    <button 
                        onClick={() => { toast.dismiss(t.id); setShowSkillPanel(true); }}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg transition-colors"
                    >
                        Activate MCP Skills Layer
                    </button>
                </div>
            ), { duration: 6000 }), 1500);

        } catch (e: any) {
            toast.error(e.response?.data?.message || "Processing failed. API error.");
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
                    toast.success("Welcome to Enterprise capabilities!");
                }, 1000);
            }
        }, 1200);
    };

    const parsedHealth = {
        api: healthQuery.data?.api === "operational",
        ocr: healthQuery.data?.ocr_easyocr === "available" || healthQuery.data?.ocr_tesseract === "mock_only" || healthQuery.data?.ocr_tesseract === "available",
        nlp: healthQuery.data?.nlp_spacy === "available" || healthQuery.data?.nlp_spacy === "mock_only",
        classifier: healthQuery.data?.classifier === "operational"
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 font-sans relative">
            <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(99,102,241,0.2)' } }} />
            
            {/* Global MCP Layer */}
            {<McpPanel />}

            <Navbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isPremium={isPremium}
                premiumType={premiumType}
                onShowPricing={() => setShowPricing(true)}
            />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <HealthChips health={parsedHealth} />

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
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-12">
                                <DashboardUpload
                                    isPremium={isPremium}
                                    isProcessing={isProcessing}
                                    pipelineStep={pipelineStep}
                                    onUpload={handleUpload}
                                />
                                {activeDocument && (
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-25"></div>
                                        <ResultPanel result={activeDocument} />
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={() => setShowSkillPanel(true)} 
                                                className="bg-indigo-950 border border-indigo-500/50 hover:bg-indigo-900 text-indigo-300 px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
                                            >
                                                Apply MCP Data Skills ✨
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === "history" && documentsQuery.data && (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                                <HistoryTab 
                                    history={documentsQuery.data} 
                                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['documents'] })} 
                                />
                            </motion.div>
                        )}

                        {activeTab === "stats" && statsQuery.data && (
                             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                                <StatsTab stats={statsQuery.data} />
                             </motion.div>
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

            <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900 text-center relative z-10">
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                    © 2026 FormSense AI • Semester Project Submission • Gokul Kumar Sant
                </p>
            </footer>
        </div>
    );
}
