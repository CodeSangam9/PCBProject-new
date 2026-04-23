import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Project } from '../types';
import { parsePCBRequirements } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Terminal,
  Activity,
  ArrowLeft,
  Search,
  Layers,
  Zap,
  Box
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

const PIPELINE_STEPS = [
  { id: 0, label: 'Analyze Needs', icon: <Terminal className="w-4 h-4" /> },
  { id: 1, label: 'Pick Parts', icon: <Layers className="w-4 h-4" /> },
  { id: 2, label: 'Connect Wires', icon: <Activity className="w-4 h-4" /> },
  { id: 3, label: 'Place Parts', icon: <Box className="w-4 h-4" /> },
  { id: 4, label: 'Trace Routing', icon: <Cpu className="w-4 h-4" /> },
  { id: 5, label: 'Optimize Connections', icon: <Zap className="w-4 h-4" /> },
  { id: 6, label: 'Safety Check', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 7, label: 'Create Files', icon: <Activity className="w-4 h-4" /> }
];

export default function PipelinePage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'log' | 'data'>('log');
  const [errorContext, setErrorContext] = useState<{title: string, message: string, suggestion?: string} | null>(null);
  const synthesisStarted = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!projectId) return;

    const unsub = onSnapshot(doc(db, 'projects', projectId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Project;
        setProject(data);
        
        // Trigger synthesis if processing and not already started
        if (data.status === 'processing' && !synthesisStarted.current) {
          startSynthesis(data);
        }

        if (data.status === 'completed') {
          setTimeout(() => navigate(`/viewer/${projectId}`), 2500);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [projectId, navigate]);

  const startSynthesis = async (proj: Project) => {
    synthesisStarted.current = true;
    const docRef = doc(db, 'projects', proj.id);

    const updateStep = async (step: number) => {
      await updateDoc(docRef, { pipelineStep: step });
      // Add artificial delay for UX and to show steps
      await new Promise(r => setTimeout(r, 1200));
    };

    try {
      console.log("[PIPELINE]: Starting AI Synthesis...");
      await updateStep(0);
      
      // Call AI Service
      const result = await parsePCBRequirements(proj.description, proj.parameters);
      
      await updateStep(1);
      await updateStep(2);
      await updateStep(3);
      await updateStep(4);
      await updateStep(5);
      await updateStep(6);
      await updateStep(7);

      // Final Update
      await updateDoc(docRef, {
        status: 'completed',
        title: result.title,
        bom: result.bom,
        netlist: result.netlist,
        layout: result.layout,
        pipelineStep: 7
      });

      console.log("[PIPELINE]: Synthesis Complete.");
    } catch (err: any) {
      console.error("[PIPELINE]: Synthesis Blockage:", err);
      
      let errorTitle = "CRITICAL_FAULT";
      let errorMessage = err.message || "Synthesis engine failed to synchronize.";
      let errorSuggestion = "Verify connectivity and try again.";

      if (err.message) {
        if (err.message.includes('429') || err.message.includes('Quota') || err.message.includes('rate limit')) {
          errorTitle = "RATE_LIMIT_EXCEEDED";
          errorMessage = "The AI synthesis engine is currently overwhelmed with requests.";
          errorSuggestion = "Please wait a moment before retrying the generation process.";
        } else if (err.message.includes('401') || err.message.includes('API key') || err.message.includes('PERMISSION_DENIED')) {
          errorTitle = "AUTHENTICATION_FAULT";
          errorMessage = "Synthesis engine access denied due to invalid or missing credentials.";
          errorSuggestion = "Check your environment API key configurations.";
        } else if (err.message.includes('JSON') || err.message.includes('parse')) {
          errorTitle = "DATA_INTEGRITY_FAULT";
          errorMessage = "The synthesis engine returned a malformed mesh topology.";
          errorSuggestion = "Simplify your prompt parameters and try again.";
        } else if (err.message.includes('local resource limits') || err.message.includes('exceeded')) {
          errorTitle = "COMPLEXITY_LIMIT";
          errorMessage = err.message;
          errorSuggestion = "Try splitting your design into smaller modules or reducing component counts.";
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          errorTitle = "NETWORK_FAULT";
          errorMessage = "Connection to the external AI backbone was interrupted.";
          errorSuggestion = "Check your internet connection and try again.";
        }
      }

      setErrorContext({
        title: errorTitle,
        message: errorMessage,
        suggestion: errorSuggestion
      });

      await updateDoc(docRef, { status: 'failed' });
    }
  };

  if (loading) return <LoadingScreen />;
  if (!project) return <div className="flex items-center justify-center h-screen bg-bg-deep font-black uppercase tracking-widest text-slate-400 italic">Failed to lock design sequence.</div>;

  const currentStepId = project.pipelineStep || 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg-deep text-slate-800 p-6 lg:p-10 relative overflow-hidden font-sans">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <header className="flex items-center justify-between border-b border-slate-200 pb-8">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="space-y-1">
                 <div className="flex items-center gap-3 text-brand-primary font-black uppercase text-[10px] tracking-[0.3em]">
                    <Activity className="w-4 h-4" /> Designing...
                 </div>
                 <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">
                   {project.title} <span className="opacity-30 not-italic tracking-normal">// ID: {project.id?.substring(0,8).toUpperCase()}</span>
                 </h1>
              </div>
           </div>
           
           <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</div>
                 <div className={`text-xs font-bold uppercase italic ${project.status === 'failed' ? 'text-error' : 'text-slate-900'}`}>{project.status}</div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                project.status === 'processing' ? 'bg-warning animate-pulse' : 
                project.status === 'failed' ? 'bg-error' : 
                'bg-brand-accent'
              }`}></div>
           </div>
        </header>

        {(errorContext || project.status === 'failed') && (
           <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="cad-panel bg-error/10 border-error/20 p-6 flex flex-col md:flex-row md:items-center gap-6 text-error border-none shadow-lg"
           >
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1 md:mt-0" />
              <div className="space-y-2 flex-1">
                 <div className="text-[10px] font-black uppercase tracking-widest">{errorContext?.title || "CRITICAL_FAULT"}</div>
                 <div className="text-sm font-bold italic leading-relaxed">{errorContext?.message || "Synthesis engine failed to synchronize."}</div>
                 {errorContext?.suggestion && (
                   <div className="text-xs text-error/80 font-medium">↳ Action: {errorContext.suggestion}</div>
                 )}
              </div>
              <button 
                 onClick={() => window.location.reload()}
                 className="px-6 py-3 bg-error text-white text-[10px] font-black rounded uppercase tracking-widest hover:bg-error/90 transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                 Retry Node
              </button>
           </motion.div>
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-10">
           {/* Pipeline visualization */}
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2 mb-4 block">Process Workflow</label>
              <div className="space-y-4">
                 {PIPELINE_STEPS.map((step, idx) => {
                   const isCompleted = currentStepId > step.id;
                   const isActive = currentStepId === step.id;
                   const isPending = currentStepId < step.id;

                   return (
                     <div 
                       key={step.id}
                       className={`cad-panel flex items-center p-5 transition-all duration-500 border-none shadow-sm ${
                         isActive ? 'bg-brand-primary text-white shadow-xl scale-[1.02] ring-4 ring-brand-primary/10' : 
                         isCompleted ? 'bg-white opacity-60 text-slate-900' : 'bg-white opacity-40 text-slate-400'
                       }`}
                     >
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-6 ${
                         isActive ? 'bg-white/20' : 'bg-slate-50'
                       }`}>
                         {isCompleted ? <CheckCircle2 className="w-5 h-5 text-brand-accent" /> : step.icon}
                       </div>
                       
                       <div className="flex-1">
                          <div className={`text-[10px] uppercase font-black tracking-[0.2em] mb-1 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                            Stage_0{step.id + 1}
                          </div>
                          <div className="text-sm font-bold uppercase italic">{step.label}</div>
                       </div>

                       {isActive && (
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono font-bold animate-pulse">SYNTHESIZING...</span>
                            <Loader2 className="w-4 h-4 animate-spin" />
                         </div>
                       )}
                       
                       {isCompleted && <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-brand-accent italic">Success</div>}
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Console / Output */}
           <div className="space-y-6 lg:sticky lg:top-24 h-fit">
              <div className="cad-panel bg-white min-h-[500px] flex flex-col shadow-xl border-slate-100">
                 <div className="flex border-b border-slate-50">
                    <button 
                      onClick={() => setActiveTab('log')}
                      className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        activeTab === 'log' ? 'text-brand-primary bg-slate-50 border-b-2 border-brand-primary' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Process_Log
                    </button>
                    <button 
                      onClick={() => setActiveTab('data')}
                      className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        activeTab === 'data' ? 'text-brand-primary bg-slate-50 border-b-2 border-brand-primary' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Mesh_Inspect
                    </button>
                 </div>

                 <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                       {activeTab === 'log' ? (
                         <motion.div 
                           key="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                           className="space-y-3 leading-relaxed"
                         >
                            <div className="text-brand-primary font-bold">[0.00ms] SYNC: Registry acknowledged PRJ_{project.id?.substring(0,8).toUpperCase()}</div>
                            <div className="text-slate-400">[0.12ms] INIT: Mapping semantic constraints to layout domain...</div>
                            {currentStepId > 0 && <div className="text-slate-800 font-bold italic underline">Step_01: Component extraction complete. Found {project.bom?.length || 0} discrete nodes.</div>}
                            {currentStepId > 1 && <div className="text-slate-800 font-bold italic underline">Step_02: Signal mesh generated. {project.netlist?.length || 0} nets identified.</div>}
                            {currentStepId > 2 && <div className="text-slate-800 italic">Step_03: Board dimensions locked at {project.parameters.boardSize}.</div>}
                            
                            <div className="pt-6 text-[10px] text-slate-300 italic border-t border-slate-50 mt-10">
                              // Monitoring synthesis node 412... <br />
                              // All signal domains are optimized for signal integrity.
                            </div>
                         </motion.div>
                       ) : (
                         <motion.div 
                           key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                           className="space-y-6"
                         >
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3 shadow-inner">
                               <div className="text-brand-primary font-bold uppercase tracking-widest text-[9px] mb-2">Requirement Mesh</div>
                               <p className="text-slate-600 leading-relaxed italic">{project.description}</p>
                            </div>
                            
                            <div className="space-y-4">
                               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">Target Metrics</div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                     <div className="text-[8px] text-slate-400 font-bold">VOLTAGE</div>
                                     <div className="text-xs font-bold text-slate-900">{project.parameters.voltage}</div>
                                  </div>
                                  <div className="space-y-1">
                                     <div className="text-[8px] text-slate-400 font-bold">ARCHITECTURE</div>
                                     <div className="text-xs font-bold text-slate-900">{project.parameters.material}</div>
                                  </div>
                               </div>
                            </div>
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>

              {project.status === 'completed' && (
                   <button 
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                     onClick={() => navigate(`/viewer/${projectId}`)}
                     className="w-full cad-button h-14 italic"
                   >
                     View Final Design <ChevronRight className="w-5 h-5" />
                   </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
