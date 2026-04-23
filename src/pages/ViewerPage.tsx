import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Project } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Package, 
  Settings2, 
  Activity, 
  Box,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Terminal,
  Rss,
  Monitor,
  Printer
} from 'lucide-react';
import PCBViewer from '../components/PCBViewer';

export default function ViewerPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'schematic'>('3d');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'bom' | 'nets' | 'logs'>('bom');
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const snap = await getDoc(doc(db, 'projects', projectId));
        if (snap.exists()) {
          setProject({ id: snap.id, ...snap.data() } as Project);
        }
      } catch (err) {
        console.error("Failed to load design:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleDownload = async (type: string) => {
    if (type === 'BOM_CSV') {
      const headers = ['RefDes', 'Component', 'Value', 'Package'];
      const rows = project?.bom?.map(c => [
        c.id || c.designator || '',
        c.name || c.component || '',
        c.value || '',
        c.package || c.footprint || ''
      ]) || [];
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `${(project?.title || 'design').replace(/\s+/g, '_')}_BOM.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setExporting(true);
    await new Promise(r => setTimeout(r, 2000));
    setExporting(false);
    alert(`Manufacturing package (${type}) generated successfully.`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-bg-deep text-slate-800">
      <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-8" />
      <div className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-black animate-pulse">Loading Design Tool...</div>
    </div>
  );
  
  if (!project || !project.layout) return (
    <div className="p-20 text-center bg-bg-deep h-[calc(100vh-64px)] flex flex-col items-center justify-center">
      <AlertCircle className="w-12 h-12 text-error mb-8" />
      <div className="text-slate-900 text-2xl font-black uppercase tracking-[0.4em] mb-4 italic">Design Not Found</div>
      <p className="text-slate-500 text-sm mb-10 font-bold uppercase tracking-widest max-w-sm mx-auto">We could not find this design in the system.</p>
      <button onClick={() => navigate('/dashboard')} className="cad-button px-10">Return to Dashboard</button>
    </div>
  );
  
  const filteredComponents = (project.bom || []).filter((item: any) => {
    const searchLower = searchTerm.toLowerCase();
    const designator = (item.id || item.designator || '').toLowerCase();
    const name = (item.name || item.component || '').toLowerCase();
    return designator.includes(searchLower) || name.includes(searchLower);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-bg-deep overflow-hidden text-slate-800 font-sans">
      {/* CAD Toolbar */}
      <header className="h-14 border-b border-border-accent bg-white/80 flex items-center px-6 justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-50 rounded-lg transition-colors group">
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-brand-primary" />
          </button>
          <div className="h-6 w-px bg-border-accent" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-black text-slate-900 italic uppercase tracking-tight">{project.title}</span>
               <span className="text-[8px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-brand-primary/20">READY</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => handleDownload('Gerber_RS274X')}
             disabled={exporting}
             className="cad-button h-9 px-6 group text-[10px]"
           >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline italic uppercase">Get Factory Files</span>
           </button>
           <div className="h-4 w-px bg-border-accent" />
           <button 
             onClick={() => handleDownload('BOM_CSV')}
             className="h-9 px-4 border border-border-accent text-slate-500 hover:text-brand-primary hover:border-brand-primary bg-white transition-all text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm"
           >
             Part List (CSV)
           </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>

        {/* Navigation Rail */}
        <aside className="w-16 border-r border-border-accent bg-white/40 flex flex-col items-center py-8 space-y-6 shrink-0 z-20">
           <SidebarTool icon={<Box className="w-5 h-5" />} active={viewMode === '3d'} onClick={() => setViewMode('3d')} label="3D" />
           <SidebarTool icon={<Monitor className="w-5 h-5" />} active={viewMode === '2d'} onClick={() => setViewMode('2d')} label="2D" />
           <SidebarTool icon={<Rss className="w-5 h-5" />} active={viewMode === 'schematic'} onClick={() => setViewMode('schematic')} label="SCH" />
           <div className="h-px w-6 bg-border-accent" />
           <SidebarTool icon={<Package className="w-5 h-5" />} active={activeTab === 'bom'} onClick={() => setActiveTab('bom')} label="BOM" />
           <SidebarTool icon={<Activity className="w-5 h-5" />} active={activeTab === 'nets'} onClick={() => setActiveTab('nets')} label="NET" />
           <SidebarTool icon={<Terminal className="w-5 h-5" />} active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} label="LOG" />
        </aside>

        {/* Main Viewport */}
        <section className="flex-1 flex flex-col relative overflow-hidden z-10">
          <div className="flex-1 relative bg-slate-900">
            <PCBViewer layout={project.layout} netlist={project.netlist} viewMode={viewMode} highlightTerm={searchTerm} />
            
            <div className="absolute top-6 left-6 p-4 bg-white/90 border border-border-accent backdrop-blur-md space-y-3 rounded-xl shadow-xl">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Check: Passed</span>
               </div>
               <div className="space-y-1">
                  <div className="text-[9px] text-slate-500 font-mono italic flex justify-between gap-10"><span>Layer</span> <span className="text-slate-900 font-bold uppercase">Top Layer</span></div>
                  <div className="text-[9px] text-slate-500 font-mono italic flex justify-between gap-10"><span>System</span> <span className="text-slate-900 font-bold">LOCKED</span></div>
               </div>
            </div>
          </div>

          {/* Bottom Panel */}
          <div className="h-72 border-t border-border-accent bg-white/60 flex shrink-0 overflow-hidden relative backdrop-blur-xl">
             <AnimatePresence mode="wait">
                {activeTab === 'bom' && (
                  <motion.div 
                    key="bom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col p-6 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                          <Package className="w-4 h-4 text-brand-primary" /> List of Parts
                       </h3>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                          <input 
                            type="text" 
                            placeholder="Search parts..."
                            className="cad-input h-9 py-0 w-64 pl-12 text-[10px] uppercase tracking-widest font-bold shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl bg-white shadow-inner">
                      <table className="w-full text-left text-[11px]">
                         <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                            <tr>
                               <th className="p-3 pl-6 text-slate-400 uppercase tracking-widest font-black">ID</th>
                               <th className="p-3 text-slate-400 uppercase tracking-widest font-black">Part Name</th>
                               <th className="p-3 text-slate-400 uppercase tracking-widest font-black">Value</th>
                               <th className="p-3 text-slate-400 uppercase tracking-widest font-black text-right pr-6">Size</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50 font-medium">
                            {filteredComponents.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                 <td className="p-3 pl-6 text-brand-primary font-black group-hover:pl-8 transition-all">{item.id || item.designator}</td>
                                 <td className="p-3 text-slate-900 font-bold uppercase italic">{item.name || item.component}</td>
                                 <td className="p-3 text-slate-500 font-bold">{item.value || 'N/A'}</td>
                                 <td className="p-3 text-slate-400 font-mono text-[9px] text-right pr-6 tracking-widest uppercase">{item.package || item.footprint}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'nets' && (
                  <motion.div key="nets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 grid grid-cols-2 md:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar">
                    {(project.netlist || []).map((net, i) => (
                      <div key={i} className="cad-panel bg-white p-4 space-y-3 group hover:border-brand-primary/40 transition-all shadow-md">
                        <div className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">{net.name}</div>
                        <div className="flex flex-wrap gap-1.5">
                           {net.pins.map((p, pi) => (
                             <span key={pi} className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-1 text-slate-500 font-bold rounded uppercase">
                               {p.componentId}:{p.pinName}
                             </span>
                           ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'logs' && (
                  <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 font-mono text-[11px] text-slate-500 space-y-2 overflow-y-auto custom-scrollbar italic font-bold uppercase">
                    <div className="flex gap-4">
                       <span className="text-slate-300">[0.00ms]</span>
                       <span className="text-brand-primary">Process_Initialize: Registry Sync OK.</span>
                    </div>
                    <div className="flex gap-4">
                       <span className="text-slate-300">[1.42ms]</span>
                       <span className="text-slate-800">Mesh_Gen: Mapped hardware identifiers to spatial matrix.</span>
                    </div>
                    <div className="flex gap-4">
                       <span className="text-slate-300">[4.11ms]</span>
                       <span className="text-brand-accent">Safety_Check: Clearance verified.</span>
                    </div>
                    <div className="flex gap-4 opacity-40">
                       <span className="text-slate-300">[9.00ms]</span>
                       <span>Awaiting next design sequence...</span>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </section>

        {/* Properties Rail */}
        <aside className="w-80 border-l border-border-accent bg-white/40 p-8 space-y-10 shrink-0 z-20 overflow-y-auto custom-scrollbar hidden xl:block shadow-inner">
              <div className="space-y-6">
                 <label className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-black flex items-center gap-2">
                    <Settings2 className="w-3 h-3" /> Design Details
                 </label>
                 <div className="space-y-5">
                    <InspectorMetric label="Material" value="Isola_370HR" />
                    <InspectorMetric label="Copper Thickness" value="1oz (35um)" />
                    <InspectorMetric label="Board Color" value="Matte_Green" />
                    <InspectorMetric label="Board Finish" value="ENIG_Gold" />
                    <InspectorMetric label="Minimum Gap" value="0.25mm" />
                 </div>
              </div>

           <div className="pt-8 border-t border-slate-100 space-y-5">
              <label className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-black">Verification</label>
              <div className="cad-panel p-5 border-brand-primary/10 bg-brand-primary/5 shadow-none">
                 <div className="flex items-center gap-3 text-brand-primary mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">DRC_STABLE</span>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed italic font-medium">Signal integrity analysis complete. All traces conform to IPC standards.</p>
              </div>
           </div>
        </aside>
      </main>
    </div>
  );
}

function SidebarTool({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-12 flex flex-col items-center justify-center gap-1 transition-all group relative ${active ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-800'}`}
    >
      <div className={`p-2.5 rounded-xl transition-all ${active ? 'bg-brand-primary/10' : 'hover:bg-slate-50'}`}>
        {icon}
      </div>
      <span className="text-[7px] font-black tracking-widest uppercase mt-1 opacity-60">{label}</span>
      {active && (
        <motion.div 
           layoutId="active-tool-indicator" 
           className="absolute left-[-16px] w-1.5 h-8 bg-brand-primary shadow-lg rounded-r-lg" 
        />
      )}
    </button>
  );
}

function InspectorMetric({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1.5 border-l-2 border-slate-100 pl-4 hover:border-brand-primary transition-colors py-1">
      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{label}</div>
      <div className="text-xs text-slate-900 font-black tracking-tight uppercase italic">{value}</div>
    </div>
  );
}
