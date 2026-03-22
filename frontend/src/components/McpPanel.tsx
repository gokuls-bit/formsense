import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TerminalSquare, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { useState } from 'react';

export function McpPanel() {
    const { activeDocument, showSkillPanel, setShowSkillPanel } = useAppStore();
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
    const [skillResult, setSkillResult] = useState<string | null>(null);

    const { data: skillsData, isLoading: isLoadingSkills } = useQuery({
        queryKey: ['mcp-skills'],
        queryFn: async () => {
            const { data } = await axios.get('/api/skills');
            return data.skills;
        },
        enabled: showSkillPanel,
    });

    const applySkillMutation = useMutation({
        mutationFn: async (skillId: string) => {
            const { data } = await axios.post('/api/skills/apply', {
                skillId,
                documentText: activeDocument?.extracted_text || "Blank Document",
            });
            return data.transformedData;
        },
        onSuccess: (data: string) => {
            setSkillResult(data);
        }
    });

    if (!showSkillPanel) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 h-screen w-96 bg-slate-950/80 backdrop-blur-2xl border-l border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.15)] z-50 flex flex-col"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
                        <TerminalSquare className="w-5 h-5 text-indigo-400" />
                        Stitch Skills Workspace
                    </h3>
                    <button onClick={() => setShowSkillPanel(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Active Target Banner */}
                    <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl">
                        <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-1">Active Target</p>
                        <p className="text-sm font-medium truncate">{activeDocument ? activeDocument.filename : "No Document Selected"}</p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" /> Available Skills
                        </h4>
                        
                        {isLoadingSkills ? (
                            <div className="flex items-center gap-3 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Fetching npx skills...</div>
                        ) : (
                            <div className="space-y-3">
                                {skillsData?.map((skill: any) => (
                                    <button
                                        key={skill.id}
                                        onClick={() => setSelectedSkill(skill.id)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${selectedSkill === skill.id ? 'bg-indigo-600/20 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
                                    >
                                        <p className="font-medium text-slate-200">{skill.name}</p>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{skill.desc}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Apply actions */}
                    <div className="pt-4 border-t border-white/5">
                        <button
                            disabled={!selectedSkill || !activeDocument || applySkillMutation.isPending}
                            onClick={() => selectedSkill && applySkillMutation.mutate(selectedSkill)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {applySkillMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Logic"}
                        </button>
                    </div>

                    {/* Output Layer */}
                    <AnimatePresence>
                        {skillResult && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                                <p className="text-xs text-emerald-400 mb-2 font-mono uppercase">MCP Execution Complete</p>
                                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">{skillResult}</pre>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}
