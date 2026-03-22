import { create } from 'zustand';
import { DocumentResult, Stats } from '@/types';

interface AppState {
    activeDocument: DocumentResult | null;
    setActiveDocument: (doc: DocumentResult | null) => void;
    
    pipelineStep: number;
    setPipelineStep: (step: number) => void;
    
    isProcessing: boolean;
    setIsProcessing: (status: boolean) => void;
    
    documents: DocumentResult[];
    setDocuments: (docs: DocumentResult[]) => void;
    
    stats: Stats | null;
    setStats: (stats: Stats | null) => void;
    
    showSkillPanel: boolean;
    setShowSkillPanel: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set: any) => ({
    activeDocument: null,
    setActiveDocument: (doc: DocumentResult | null) => set({ activeDocument: doc }),
    
    pipelineStep: 0,
    setPipelineStep: (step: number) => set({ pipelineStep: step }),
    
    isProcessing: false,
    setIsProcessing: (status: boolean) => set({ isProcessing: status }),
    
    documents: [],
    setDocuments: (docs: DocumentResult[]) => set({ documents: docs }),
    
    stats: null,
    setStats: (stats: Stats | null) => set({ stats: stats }),
    
    showSkillPanel: false,
    setShowSkillPanel: (show: boolean) => set({ showSkillPanel: show }),
}));
