import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Activity, ArrowRight, Home, UserCheck, AlertOctagon, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminAuth() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoogleElevation = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Elevation happens automatically via AuthContext/Elevation Protocol if password is provided later or email matches sangambhure8
      setSuccess('Google account connected. Please enter your Password to confirm admin access.');
    } catch (err: any) {
      setError('Google login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminElevation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const adminPassword = 'Sangam09';
    const primaryAdminEmail = 'sangambhure6@gmail.com';

    if (password !== adminPassword) {
      setError('Incorrect Password. Access Denied.');
      setLoading(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      const effectiveUser = user || (currentUser ? { uid: currentUser.uid, email: currentUser.email || '', role: 'student', displayName: currentUser.displayName || '' } : null);

      // SCENARIO 1: User is already logged in
      if (effectiveUser) {
        console.log("[ADMIN]: Session active. Verifying administrative eligibility...");
        const targetEmail = effectiveUser.email;
        const isAdminEmail = targetEmail === 'sangambhure8@gmail.com' || targetEmail === 'sangambhure6@gmail.com';
        
        // Even if not a "pre-defined" admin email, we elevate them if they have the password
        // because the user requested "only password require for admin"
        await updateDoc(doc(db, 'users', effectiveUser.uid), {
          role: 'admin'
        }).catch(async () => {
          await setDoc(doc(db, 'users', effectiveUser.uid), {
            uid: effectiveUser.uid,
            email: effectiveUser.email,
            role: 'admin',
            displayName: effectiveUser.displayName || 'Admin Node',
            createdAt: Date.now()
          }, { merge: true });
        });
        
        setSuccess(isAdminEmail ? 'Admin Identity Verified. Opening Vault...' : 'Access Granted via Override. Opening Panel...');
        setTimeout(() => navigate('/admin'), 1500);
        return;
      }

      // SCENARIO 2: No active session. Try to sign in as a dedicated admin account.
      console.log("[ADMIN]: Cold start. Attempting automated entry...");
      const sysAdminEmail = 'admin@pcb-ai.system';

      try {
        await signInWithEmailAndPassword(auth, sysAdminEmail, adminPassword);
        setSuccess(`Logged in securely as System Admin. Synchronizing...`);
        setTimeout(() => navigate('/admin'), 1500);
        return;
      } catch (err: any) {
        if (err.code !== 'auth/user-not-found' && err.code !== 'auth/invalid-credential' && err.code !== 'auth/wrong-password') {
          throw err;
        }
      }

      // If the dedicated account doesn't exist, create it.
      try {
        console.log("[ADMIN]: Provisioning dedicated admin node...");
        const userCred = await createUserWithEmailAndPassword(auth, sysAdminEmail, adminPassword);
        await updateProfile(userCred.user, { displayName: 'System Admin' });
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: sysAdminEmail,
          role: 'admin',
          displayName: 'System Admin',
          createdAt: Date.now()
        });
        setSuccess('System Admin account created and elevated. Redirecting...');
        setTimeout(() => navigate('/admin'), 1500);
      } catch (createErr: any) {
        throw createErr;
      }

    } catch (err: any) {
      console.error("Elevation Fault:", err);
      if (err.code === 'auth/network-request-failed') {
        setError('NETWORK_FAULT: The connection to the authentication server failed. Please check your internet connection or disable any strict ad-blockers, then try again.');
      } else {
        setError('PROTOCOL_ERROR: ' + (err.message || 'System fault'));
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      <div className="absolute inset-0 bg-blue-800 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-700 via-blue-900 to-slate-900 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-200 hover:text-white transition-colors z-20"
      >
        <Home className="w-4 h-4" /> Return Home
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-10 md:p-12 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-blue-400/20"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 bg-blue-50 border-4 border-blue-100 rounded-full flex items-center justify-center mb-6 shadow-xl">
             <ShieldCheck className="w-12 h-12 text-blue-600" />
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-[0.5em] mb-3">
            <Activity className="w-4 h-4 animate-pulse" /> Protected Area
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2 text-blue-900">
            Admin <span className="text-blue-500 not-italic uppercase tracking-normal">Vault</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Password Required</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[10px] font-bold uppercase tracking-widest leading-relaxed font-mono flex items-center gap-3">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>!! [ERROR]: {error}</span>
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-[10px] font-bold uppercase tracking-widest leading-relaxed font-mono flex items-center gap-3">
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {user ? (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-1">Current User</div>
            <div className="text-xs font-black text-blue-900 italic">{user.email}</div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
             <div className="text-[9px] uppercase tracking-widest text-yellow-700 font-bold leading-relaxed">
               Notice: You are not logged in. The system will try to create an admin account.
             </div>
          </div>
        )}

        <form onSubmit={handleAdminElevation} className="space-y-8">
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">Admin Password</label>
                <Lock className="w-3 h-3 text-blue-400 opacity-50" />
             </div>
             <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border-2 border-slate-200 h-14 px-6 rounded-xl focus:border-blue-500 outline-none transition-all text-center text-xl tracking-[0.5em] font-mono text-slate-900 shadow-inner"
              required
             />
             <div className="text-[8px] text-center text-blue-500 font-bold uppercase tracking-widest">Secure Connection</div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 group"
          >
            {loading ? 'Checking...' : (
              <span className="flex items-center gap-3 italic">Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            )}
          </button>

          <div className="relative py-2 hidden">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.2em] font-black"><span className="bg-white px-4 text-slate-400">OR</span></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleElevation}
            className="w-full h-12 border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" /> Login with Google
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
           <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
             Only authorized persons should access this area. Multiple failed attempts may lock you out.
           </div>
        </div>
      </motion.div>
    </div>
  );
}
