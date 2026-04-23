import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GraduationCap, Rocket, Shield, Terminal, ArrowRight, Activity, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email,
        role,
        displayName: name,
        createdAt: Date.now()
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: userCred.user.email || '',
          role,
          displayName: userCred.user.displayName || 'Operator',
          createdAt: Date.now()
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign up failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg-deep flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-800">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl cad-panel p-10 md:p-14 relative z-10 bg-white shadow-2xl border-slate-200"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
             <UserPlus className="w-8 h-8 text-brand-primary" />
          </div>
          <div className="flex items-center gap-2 text-brand-primary font-black uppercase text-[10px] tracking-[0.4em] mb-2">
            <Activity className="w-4 h-4" /> New Account
          </div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
            Join <span className="text-slate-400 not-italic">PCB.AI</span>
          </h1>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            [ERROR]: {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block text-center">Choose Your Role</label>
            <div className="grid grid-cols-2 gap-4">
              <RoleOption 
                selected={role === 'student'} 
                onClick={() => setRole('student')}
                icon={<GraduationCap className="w-5 h-5" />}
                label="Student"
              />
              <RoleOption 
                selected={role === 'startup'} 
                onClick={() => setRole('startup')}
                icon={<Rocket className="w-5 h-5" />}
                label="Startup"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Your Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="cad-input w-full h-12"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">System Email</label>
                  <input 
                    type="email" 
                    placeholder="operator@pcb.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="cad-input w-full h-12"
                  />
               </div>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Keyphrase</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="cad-input w-full h-12"
                  />
               </div>
               <button 
                type="submit" 
                disabled={loading}
                className="cad-button w-full h-12 group mt-5"
              >
                {loading ? 'Initializing...' : <span className="flex items-center gap-3 italic">RUN_START <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>}
              </button>
            </div>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-black"><span className="bg-white px-4 text-slate-400">Other Sign Up Options</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full h-12 border border-slate-200 hover:border-brand-primary bg-slate-50 text-slate-500 hover:text-brand-primary rounded-xl transition-all flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] border-t border-slate-50 pt-8">
            Already have an account? <Link to="/login" className="text-brand-primary hover:underline ml-2 italic">Back to Login</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

function RoleOption({ selected, onClick, icon, label }: { selected: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-5 transition-all group overflow-hidden border rounded-2xl flex flex-col items-center gap-3 ${
        selected ? 'bg-brand-primary/10 border-brand-primary shadow-md' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
      }`}
    >
      <div className={`transition-transform duration-500 group-hover:scale-110 ${selected ? 'text-brand-primary' : 'text-slate-400'}`}>{icon}</div>
      <span className={`text-[9px] font-black tracking-widest uppercase ${selected ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
      {selected && <div className="absolute top-2 right-2"><div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div></div>}
    </button>
  );
}
