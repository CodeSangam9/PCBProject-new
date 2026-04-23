import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Project, PCBParameters } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  ChevronRight, 
  Cpu, 
  Sparkles,
  Layers,
  Activity,
  History,
  Terminal,
  Grid3X3,
  Clock,
  CheckCircle2,
  Search,
  Settings2
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showParams, setShowParams] = useState(false);
  const [params, setParams] = useState<PCBParameters>({
    voltage: '5V',
    signalType: 'Digital',
    traceWidth: 0.25,
    layerCount: 2,
    boardSize: '50x50mm',
    frequency: 'Low',
    material: 'FR4',
    thermal: 'Natural',
    emi: 'Standard'
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !auth.currentUser) return;

    setIsGenerating(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        userId: auth.currentUser.uid,
        title: prompt.substring(0, 40) + "...",
        description: prompt,
        status: 'processing',
        pipelineStep: 0,
        createdAt: Date.now(),
        parameters: params
      });
      navigate(`/pipeline/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'projects', id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'processing').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  const examples = [
    "Arduino Nano shield with 3.3V regulator",
    "ESP32 smart hub with relay control",
    "Brushless DC motor driver module",
    "Mechanical keyboard controller"
  ];

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg-deep text-slate-800 p-6 lg:p-10 relative overflow-hidden font-sans">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-accent">
          <div className="space-y-1 mt-6">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              My Dashboard
            </h1>
            <p className="text-slate-500 font-medium">Design and manage your PCB projects</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/designer')}
              className="bg-brand-primary text-white h-11 px-6 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center gap-2 shadow"
            >
              <Cpu className="w-4 h-4" /> Manual Designer
            </button>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search your designs..." 
                className="cad-input w-72 pl-12 h-11 py-0 shadow-none border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<Layers className="text-brand-primary" />} label="Total Projects" value={stats.total} />
          <StatCard icon={<Clock className="text-warning" />} label="Active Sessions" value={stats.active} pulse />
          <StatCard icon={<CheckCircle2 className="text-brand-accent" />} label="Validated Designs" value={stats.completed} />
        </div>

        {/* Generator Section */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cad-panel bg-white p-8 md:p-12 relative overflow-hidden shadow-sm border-slate-200 border"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] pointer-events-none"></div>
            
            <div className="max-w-3xl space-y-8 relative">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm tracking-wide uppercase">
                  <Sparkles className="w-4 h-4" /> Synthesis Core
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                  Brief your <span className="text-brand-primary">PCB Idea</span>
                </h2>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your PCB requirements (e.g., An ESP32 based smart home hub with OLED display...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl min-h-[160px] p-6 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none shadow-inner"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm border border-slate-100">
                    <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-500 font-bold">Ready</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 py-2 items-center">
                  <span className="text-xs text-slate-500 font-bold mr-2">Templates:</span>
                  {examples.map((ex, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    type="submit" 
                    disabled={isGenerating || !prompt.trim()}
                    className="cad-button h-14 px-12 group flex-1 italic text-sm"
                  >
                    {isGenerating ? (
                       <span className="flex items-center gap-3"><Terminal className="w-5 h-5 animate-pulse" /> Designing...</span>
                    ) : (
                      <span className="flex items-center gap-3">Start Design <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowParams(!showParams)}
                    className="h-14 w-14 border border-slate-200 bg-white flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Settings2 className={`w-6 h-6 transition-transform duration-500 ${showParams ? 'rotate-180 text-brand-primary' : 'text-slate-400'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {showParams && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-100 mt-4">
                        <ParamField label="Voltage" value={params.voltage} options={['3.3V', '5V', '12V', '24V']} onChange={(v) => setParams({...params, voltage: v})} />
                        <ParamField label="Layers" value={params.layerCount} options={[1, 2, 4, 6]} onChange={(v) => setParams({...params, layerCount: parseInt(v)})} />
                        <ParamField label="Mode" value={params.signalType} options={['Digital', 'Analog', 'Mixed']} onChange={(v) => setParams({...params, signalType: v})} />
                        <ParamField label="Clearance" value={params.traceWidth} options={[0.15, 0.2, 0.25, 0.3]} onChange={(v) => setParams({...params, traceWidth: parseFloat(v)})} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>

          <aside className="space-y-8">
             <div className="cad-panel p-8 space-y-8 border-slate-100 bg-white">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Terminal className="w-5 h-5 text-brand-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Status</span>
                   </div>
                   <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                </div>
                <div className="space-y-4 font-mono text-[10px] text-slate-500 uppercase">
                   <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Connection</span>
                      <span className="text-brand-accent font-bold">Stable</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Sync</span>
                      <span className="text-slate-900 font-bold">LOCKED</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span>Type</span>
                      <span className="text-slate-900 font-bold">Standard_CMOS</span>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-[9px] line-clamp-4 leading-relaxed font-bold uppercase tracking-tight text-slate-400 opacity-80">
                  Awaiting instruction set. All design nodes are synchronized and ready for hardware synthesis.
                </div>
             </div>

             <div className="cad-panel p-6 bg-brand-primary text-white border-transparent">
                <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-white" /> Pro Features
                </h4>
                <p className="text-sm text-white/90 leading-relaxed mb-6">Upgrade to Admin access for multi-layer routing, high-density interconnections, and full pipeline control.</p>
                <button 
                  onClick={() => navigate('/admin-access')}
                  className="w-full h-11 bg-white text-brand-primary hover:bg-slate-50 transition-all text-sm font-bold rounded-lg shadow"
                >
                   Elevate Access
                </button>
             </div>
          </aside>
        </div>

        {/* Project List */}
        <div className="space-y-8 pb-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-primary" /> My Designs
            </h3>
            <div className="text-sm text-slate-500 font-medium">
              TOTAL: {projects.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {projects
                .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((project, idx) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(project.status === 'completed' ? `/viewer/${project.id}` : `/pipeline/${project.id}`)}
                  className="cad-panel group cursor-pointer hover:border-brand-primary transition-all flex flex-col h-full bg-white shadow-lg overflow-hidden border-slate-100"
                >
                  <div className="p-6 flex-1 space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                        <Cpu className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        project.status === 'completed' ? 'border-brand-accent/30 text-brand-accent bg-brand-accent/5' : 
                        project.status === 'failed' ? 'border-error/30 text-error bg-error/5' : 
                        'border-warning/30 text-warning bg-warning/5 animate-pulse-soft'
                      }`}>
                        {project.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                       <div className="text-xs text-slate-400 font-medium">NODE_{project.id?.substring(0,8).toUpperCase()}</div>
                       <h4 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors truncate">
                        {project.title}
                       </h4>
                       <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed h-10">
                        {project.description}
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-4 border-t border-slate-50 pt-4 mt-auto">
                       <ValueItem label="Stack" value={`${project.parameters.layerCount}L FR4`} />
                       <ValueItem label="Logic" value={project.parameters.voltage} />
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                    {confirmDelete === project.id ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleDelete(e, project.id || '')}
                          className="px-3 py-1.5 bg-error text-white text-xs font-bold rounded-md hover:bg-error/90 transition-all shadow"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                          className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-md hover:bg-slate-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(project.id || null); }}
                        className="p-2 hover:bg-error/10 text-slate-400 hover:text-error rounded-md transition-all active:scale-95"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className="text-sm font-bold text-slate-500 flex items-center gap-1.5 group-hover:text-brand-primary transition-colors">
                       View Design <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {projects.length === 0 && !loading && (
              <div className="col-span-full py-24 text-center space-y-6 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                   <Grid3X3 className="w-10 h-10" />
                </div>
                <div>
                   <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No Designs Yet</p>
                   <p className="text-slate-500 text-sm mt-3 max-w-xs mx-auto italic font-medium px-6">Enter your requirements above to start your first design.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, pulse }: { icon: React.ReactNode, label: string, value: number, pulse?: boolean }) {
  return (
    <div className="cad-panel p-6 bg-white flex items-center gap-6 relative group border-slate-100 hover:border-brand-primary/20 transition-all shadow-md">
      {pulse && <div className="absolute top-0 right-0 w-1 h-full bg-warning shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"></div>}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-brand-primary/10 transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{value.toString().padStart(2, '0')}</div>
        <div className="text-sm font-medium text-slate-500 mt-2">{label}</div>
      </div>
    </div>
  );
}

function ParamField({ label, value, options, onChange }: { label: string, value: any, options: any[], onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer shadow-sm"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ValueItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[8px] uppercase tracking-widest text-slate-400 font-black">{label}</div>
      <div className="text-[11px] text-slate-900 font-bold">{value}</div>
    </div>
  );
}
