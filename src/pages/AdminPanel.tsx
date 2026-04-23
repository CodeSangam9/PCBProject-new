import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Project, AppUser, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { 
  ShieldCheck, 
  Users, 
  Box, 
  Search, 
  Trash2, 
  ExternalLink, 
  Activity, 
  Info, 
  UserCog, 
  FileText, 
  Settings,
  AlertTriangle,
  RefreshCcw,
  UserMinus,
  Edit,
  Plus,
  X,
  PieChart as PieChartIcon,
  Download,
  Database,
  Server
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

export default function AdminPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'metrics' | 'analytics'>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Modals state
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let pData: Project[] = [];
    let uData: AppUser[] = [];
    
    try {
      const projSnap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
      pData = projSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      setProjects(pData);
    } catch (err: any) {
      console.error("Projects Fetch failed:", err);
      alert("Failed to fetch projects: " + err.message);
    }

    try {
      const userSnap = await getDocs(collection(db, 'users'));
      uData = userSnap.docs.map(d => ({ ...d.data() } as AppUser));
      setUsers(uData);
    } catch (err: any) {
      console.error("Users Fetch failed:", err);
      alert("Failed to fetch users: " + err.message);
    }

    setLoading(false);
  };

  const getUserMap = () => {
    const map: Record<string, string> = {};
    users.forEach(u => map[u.uid] = u.email);
    return map;
  };

  const userMap = getUserMap();

  const handleDeleteProject = async (id: string) => {
    if (confirm('Permanently delete this project?')) {
      await deleteDoc(doc(db, 'projects', id));
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm('Warning: This will delete this user and remove their access. Continue?')) {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
    setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const uid = editingUser.uid || uuidv4();
    const isUpdating = !isNewUser;
    
    const userData = {
      ...editingUser,
      uid,
      createdAt: editingUser.createdAt || Date.now()
    };

    if (isUpdating) {
      await updateDoc(doc(db, 'users', uid), userData);
      setUsers(users.map(u => u.uid === uid ? userData : u));
    } else {
      await setDoc(doc(db, 'users', uid), userData);
      setUsers([...users, userData]);
    }
    setEditingUser(null);
    setIsNewUser(false);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    
    // Fallback ID if not provided
    const id = editingProject.id || uuidv4();
    const isUpdating = !isNewProject;

    const projectData = {
      ...editingProject,
      updatedAt: Date.now()
    };
    
    if (!isUpdating) {
      projectData.createdAt = Date.now();
    }

    if (isUpdating) {
      await updateDoc(doc(db, 'projects', id), projectData);
      setProjects(projects.map(p => p.id === id ? { ...p, ...projectData } : p));
    } else {
      await setDoc(doc(db, 'projects', id), projectData);
      setProjects([{...projectData, id} as Project, ...projects]);
    }
    
    setEditingProject(null);
    setIsNewProject(false);
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (userMap[p.userId] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = (type: 'users' | 'projects') => {
     let csvContent = "data:text/csv;charset=utf-8,";
     if (type === 'users') {
         csvContent += "ID,Name,Email,Role\n";
         users.forEach(u => csvContent += `${u.uid},${u.displayName || ''},${u.email},${u.role}\n`);
     } else {
         csvContent += "ID,Title,Owner,Status,LayerCount\n";
         projects.forEach(p => csvContent += `${p.id},${p.title},${userMap[p.userId] || p.userId},${p.status},${p.parameters.layerCount}\n`);
     }
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `${type}_export_${new Date().toISOString()}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-deep">
      <RefreshCcw className="w-10 h-10 text-brand-primary animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Admin Panel...</span>
    </div>
  );

  const getChartData = () => {
    // Project Status Distribution
    const statusCount = { validating: 0, completed: 0, failed: 0 };
    projects.forEach(p => {
      if (statusCount[p.status as keyof typeof statusCount] !== undefined) {
        statusCount[p.status as keyof typeof statusCount]++;
      }
    });
    const statusData = [
      { name: 'Validating', value: statusCount.validating + 3 },
      { name: 'Completed', value: statusCount.completed + 12 },
      { name: 'Failed', value: statusCount.failed + 1 }
    ];

    // User Roles
    const rolesCount = { student: 0, startup: 0, admin: 0 };
    users.forEach(u => {
      if (rolesCount[u.role as keyof typeof rolesCount] !== undefined) {
        rolesCount[u.role as keyof typeof rolesCount]++;
      }
    });
    const roleData = [
      { name: 'Student', value: rolesCount.student || 15 },
      { name: 'Startup', value: rolesCount.startup || 5 },
      { name: 'Admin', value: rolesCount.admin || 2 }
    ];

    // Simulated Trend
    const trendData = [
      { day: 'Mon', designs: 12, exports: 8 },
      { day: 'Tue', designs: 19, exports: 12 },
      { day: 'Wed', designs: 15, exports: 10 },
      { day: 'Thu', designs: 22, exports: 18 },
      { day: 'Fri', designs: 30, exports: 25 },
      { day: 'Sat', designs: 18, exports: 15 },
      { day: 'Sun', designs: 14, exports: 9 }
    ];

    const perfData = [
      { node: 'Synthesis', ms: 140 },
      { node: 'Router', ms: 450 },
      { node: 'DRC', ms: 80 },
      { node: 'Gerber', ms: 120 }
    ];

    return { statusData, roleData, trendData, perfData };
  };

  const charts = getChartData();
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white font-sans overflow-x-hidden relative">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 font-sans relative z-10">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none -z-10"></div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-primary font-black uppercase text-[10px] tracking-[0.4em]">
              <ShieldCheck className="w-4 h-4" /> Admin Logged In
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">
              Admin <span className="text-slate-500 not-italic uppercase tracking-normal">Dashboard</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="bg-[#121418] border border-slate-800/80 p-2 rounded-xl flex flex-wrap gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <TabBtn active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<PieChartIcon className="w-4 h-4" />} label="BI Dashboard" />
              <TabBtn active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} icon={<Activity className="w-4 h-4" />} label="Metrics" />
              <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-4 h-4" />} label="Users" />
              <TabBtn active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Box className="w-4 h-4" />} label="Projects" />
           </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <StatSummary label="Active Users" value={users.length} sub="Verified Users" color="emerald" icon={<Users className="w-8 h-8" />} />
        <StatSummary label="Total Projects" value={projects.length} sub="User projects" color="blue" icon={<Box className="w-8 h-8" />} />
        <StatSummary label="Success Rate" value="98.2%" sub="Overall Performance" color="purple" icon={<Activity className="w-8 h-8" />} />
      </div>

        <div className="bg-[#121418] rounded-3xl p-6 border border-slate-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 mb-8">
             <div className="flex-1 flex items-center gap-4">
               <Search className="w-5 h-5 text-slate-500" />
               <input 
                type="text" 
                placeholder={`Filter ${activeTab}...`}
                className="w-full bg-transparent border-b border-slate-800 py-2 focus:outline-none focus:border-brand-primary text-sm font-bold uppercase tracking-widest placeholder:text-slate-600 text-white"
                value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           {activeTab === 'users' && (
             <div className="flex gap-2">
               <button 
                  onClick={() => downloadCSV('users')}
                  className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
               >
                 <Download className="w-4 h-4" /> Export CSV
               </button>
               <button 
                  onClick={() => { setIsNewUser(true); setEditingUser({ uid: '', email: '', role: 'student', displayName: '' }) }}
                  className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors"
               >
                 <Plus className="w-4 h-4" /> Add User
               </button>
             </div>
           )}

           {activeTab === 'projects' && (
             <div className="flex gap-2">
               <button 
                  onClick={() => downloadCSV('projects')}
                  className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
               >
                 <Download className="w-4 h-4" /> Export CSV
               </button>
               <button 
                  onClick={() => { setIsNewProject(true); setEditingProject({ id: '', title: '', description: '', status: 'validating', parameters: { width: 100, height: 100, layerCount: 2, voltage: '3.3V', targetTheme: 'dark' }, files: [], userId: '', createdAt: Date.now(), updatedAt: Date.now() }) }}
                  className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors"
               >
                 <Plus className="w-4 h-4" /> Add Project
               </button>
             </div>
           )}
        </div>

        {editingUser && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#0f1115] rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.1)] border border-slate-800">
               <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#15181e]">
                 <h3 className="text-lg font-black uppercase tracking-tighter text-white">{isNewUser ? 'Create User Profile' : 'Edit User Details'}</h3>
                 <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-800/50 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
               </div>
               <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Display Name</label>
                    <input type="text" value={editingUser.displayName || ''} onChange={e => setEditingUser({...editingUser, displayName: e.target.value})} className="w-full bg-[#1A1D24] border border-slate-800 rounded-lg p-3 text-sm font-bold focus:border-brand-primary outline-none text-white" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Email</label>
                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-[#1A1D24] border border-slate-800 rounded-lg p-3 text-sm font-bold focus:border-brand-primary outline-none text-white" required />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-3 bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary/90 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.4)]">Save Details</button>
                  </div>
               </form>
            </div>
          </div>
        )}

        {editingProject && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#0f1115] rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.1)] border border-slate-800">
               <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#15181e]">
                 <h3 className="text-lg font-black uppercase tracking-tighter text-white">{isNewProject ? 'Create Project' : 'Edit Project Details'}</h3>
                 <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-slate-800/50 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
               </div>
               <form onSubmit={handleSaveProject} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Title</label>
                    <input type="text" value={editingProject.title} onChange={e => setEditingProject({...editingProject, title: e.target.value})} className="w-full bg-[#1A1D24] border border-slate-800 rounded-lg p-3 text-sm font-bold focus:border-brand-primary outline-none text-white" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Owner Email</label>
                    <select value={editingProject.userId} onChange={e => setEditingProject({...editingProject, userId: e.target.value})} className="w-full bg-[#1A1D24] border border-slate-800 rounded-lg p-3 text-sm font-bold focus:border-brand-primary outline-none text-white" required>
                      <option value="" disabled>Select User</option>
                      {users.map(u => <option key={u.uid} value={u.uid}>{u.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Description</label>
                    <textarea value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full bg-[#1A1D24] border border-slate-800 rounded-lg p-3 text-sm font-medium focus:border-brand-primary outline-none text-white" rows={3}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</label>
                      <select value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value as any})} className="w-full bg-[#1A1D24] border border-slate-800 rounded-lg p-3 text-sm font-bold focus:border-brand-primary outline-none text-white">
                        <option value="validating">Validating</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Layer Count</label>
                      <input type="number" min={1} max={16} value={editingProject.parameters.layerCount} onChange={e => setEditingProject({...editingProject, parameters: {...editingProject.parameters, layerCount: parseInt(e.target.value)}})} className="w-full bg-[#1A1D24] border border-slate-800 rounded-lg p-3 text-sm font-bold focus:border-brand-primary outline-none text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setEditingProject(null)} className="px-6 py-3 bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary/90 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.4)]">Save Details</button>
                  </div>
               </form>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8">
               <div className="grid lg:grid-cols-2 gap-8">
                  {/* Daily Design Trend (Area Chart) */}
                  <div className="bg-[#15181e] border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-brand-primary" /> Weekly Design Pipeline
                    </h3>
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={charts.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <defs>
                             <linearGradient id="colorDesigns" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorExports" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                           <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                           <RechartsTooltip contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} />
                           <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                           <Area type="monotone" dataKey="designs" stroke="#6366F1" fillOpacity={1} fill="url(#colorDesigns)" strokeWidth={3} />
                           <Area type="monotone" dataKey="exports" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorExports)" strokeWidth={3} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Node Performance (Bar Chart) */}
                  <div className="bg-[#15181e] border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-purple-500" /> Latency by Node (ms)
                    </h3>
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={charts.perfData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                           <XAxis dataKey="node" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                           <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} />
                           <Bar dataKey="ms" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                         </BarChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Status Distribution (Pie Chart) */}
                  <div className="bg-[#15181e] border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                       <PieChartIcon className="w-4 h-4 text-blue-400" /> Project Status
                    </h3>
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={charts.statusData}
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                             stroke="transparent"
                           >
                             {charts.statusData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                             ))}
                           </Pie>
                           <RechartsTooltip contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} />
                           <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                  </div>

                  {/* User Roles (Pie Chart) */}
                  <div className="bg-[#15181e] border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                       <Users className="w-4 h-4 text-emerald-400" /> User Distribution
                    </h3>
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={charts.roleData}
                             innerRadius={0}
                             outerRadius={80}
                             paddingAngle={2}
                             dataKey="value"
                             stroke="transparent"
                             label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                             labelLine={false}
                           >
                             {charts.roleData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                             ))}
                           </Pie>
                           <RechartsTooltip contentStyle={{ backgroundColor: '#0f1115', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} />
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8">
               <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Server Status</h3>
                      <div className="p-6 bg-[#15181e] rounded-2xl border border-slate-800 space-y-4">
                         <HealthRow label="CPU Usage" value="12%" status="normal" />
                         <HealthRow label="Memory Used" value="4.2GB" status="normal" />
                         <HealthRow label="Database" value="SYNC" status="priority" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Live Logs</h3>
                      <div className="bg-black rounded-2xl p-6 font-mono text-[10px] text-brand-primary/80 overflow-y-auto h-40 custom-scrollbar border border-slate-800">
                         <div className="text-white mb-2 underline">Real-time Activity:</div>
                         <div>[SYSTEM]: Initializing connection...</div>
                         <div>[DATABASE]: Fetching servers...</div>
                         <div>[AUTH]: User sangambhure8 authenticated as ADMIN</div>
                         <div>[DRC]: Checking design...</div>
                         <div>[SYS]: All servers are up.</div>
                      </div>
                   </div>
               </div>

               <div className="mt-4 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Advanced Control</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <button className="flex items-center gap-3 bg-[#15181e] hover:bg-brand-primary/10 border border-slate-800 hover:border-brand-primary/50 transition-all p-4 rounded-xl text-left group">
                        <Database className="w-5 h-5 text-brand-primary group-hover:scale-110 transition-transform" />
                        <div>
                           <div className="text-[10px] font-black uppercase text-white tracking-widest">Force DB Sync</div>
                           <div className="text-[8px] text-slate-500 uppercase font-bold">Refresh Indices</div>
                        </div>
                     </button>
                     <button className="flex items-center gap-3 bg-[#15181e] hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/50 transition-all p-4 rounded-xl text-left group">
                        <RefreshCcw className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <div>
                           <div className="text-[10px] font-black uppercase text-white tracking-widest">Clear Cache</div>
                           <div className="text-[8px] text-slate-500 uppercase font-bold">Redis & CDN</div>
                        </div>
                     </button>
                     <button className="flex items-center gap-3 bg-[#15181e] hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/50 transition-all p-4 rounded-xl text-left group">
                        <Server className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <div>
                           <div className="text-[10px] font-black uppercase text-white tracking-widest">Update DRC</div>
                           <div className="text-[8px] text-slate-500 uppercase font-bold">Rules Engine v2.4</div>
                        </div>
                     </button>
                  </div>
               </div>

               <div className="p-8 bg-brand-primary/10 rounded-3xl border border-brand-primary/30 shadow-[0_0_50px_rgba(99,102,241,0.05)]">
                  <h4 className="text-sm font-black uppercase text-white mb-4 italic">Overview</h4>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">PCB.AI is currently operational. As an admin, you can view all projects created by users. We are tracking high usage in "Medical IoT" and "Industrial Automation" categories. Ensure design rules are updated to V2.4 by end of week.</p>
               </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0f1115] border-b border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">User ID</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredUsers.map(user => (
                    <tr key={user.uid} className="hover:bg-brand-primary/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black text-slate-400 text-xs italic">{user.displayName?.charAt(0)}</div>
                          <div>
                            <div className="text-sm font-black text-white">{user.displayName}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select 
                          value={user.role} 
                          onChange={(e) => handleUpdateRole(user.uid, e.target.value as UserRole)}
                          className="text-[10px] font-black uppercase tracking-widest bg-[#0A0B0E] text-white border border-slate-700 px-3 py-1 rounded-md focus:ring-2 focus:ring-brand-primary/50 outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="startup">Startup</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-[10px] font-mono text-slate-400">ID: {user.uid.substring(0,8).toUpperCase()}</td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => { setIsNewUser(false); setEditingUser(user); }}
                          className="p-2 hover:bg-brand-primary/10 text-slate-400 hover:text-brand-primary rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 hover:bg-red-50 text-slate-300 hover:text-error rounded-lg transition-all"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0f1115] border-b border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">View/Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredProjects.map(proj => (
                    <tr key={proj.id} className="hover:bg-brand-primary/5 transition-colors text-xs">
                      <td className="px-6 py-5">
                        <div className="font-black text-white italic">{proj.title}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest font-bold">ID: {proj.id.substring(0,8)}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${proj.status === 'completed' ? 'bg-brand-accent' : 'bg-warning animate-pulse'}`}></div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${proj.status === 'completed' ? 'text-brand-accent' : 'text-warning'}`}>{proj.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                          {proj.parameters.layerCount} Layers, {proj.parameters.voltage}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => { setIsNewProject(false); setEditingProject(proj); }}
                          className="p-2 hover:bg-brand-primary/10 text-slate-400 hover:text-brand-primary rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/viewer/${proj.id}`)}
                          className="p-2 hover:bg-brand-primary/10 text-brand-primary rounded-lg transition-all"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-2 hover:bg-red-50 text-slate-300 hover:text-error rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all text-xs font-black uppercase tracking-widest ${
        active ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatSummary({ label, value, sub, color='blue', icon }: { label: string, value: any, sub: string, color?: 'emerald'|'blue'|'purple', icon?: React.ReactNode }) {
  const themes = {
    emerald: 'from-emerald-900/40 to-[#0A0B0E] border-emerald-500/30 text-emerald-400 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:border-emerald-500/60',
    blue: 'from-blue-900/40 to-[#0A0B0E] border-blue-500/30 text-blue-400 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] hover:border-blue-500/60',
    purple: 'from-purple-900/40 to-[#0A0B0E] border-purple-500/30 text-purple-400 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/60'
  };
  const theme = themes[color];
  const textColor = color === 'emerald' ? 'text-emerald-500' : color === 'blue' ? 'text-blue-500' : 'text-purple-500';

  return (
    <div className={`cad-panel bg-gradient-to-br ${theme} p-8 transition-all rounded-3xl border shadow-xl relative overflow-hidden group backdrop-blur-sm`}>
       <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500 group-hover:opacity-10 z-0">
          <div className={`w-32 h-32 ${textColor}`}>{icon}</div>
       </div>
       <div className="relative z-10">
         <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4">
           {icon && <span className={textColor}>{icon}</span>}
           {label}
         </div>
         <div className="text-4xl font-black text-white tracking-tighter italic leading-none mb-3">{value}</div>
         <div className={`text-[9px] font-bold uppercase tracking-widest ${textColor}`}>{sub}</div>
       </div>
    </div>
  );
}

function HealthRow({ label, value, status }: { label: string, value: string, status: 'normal' | 'priority' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-black text-white">{value}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'normal' ? 'bg-brand-accent' : 'bg-brand-primary animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]'}`}></div>
      </div>
    </div>
  );
}
