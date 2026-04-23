import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Activity, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="h-16 border-b border-border-accent bg-white/95 backdrop-blur-md flex items-center justify-between px-8 shrink-0 sticky top-0 z-50 overflow-hidden font-sans shadow-sm">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>
      
      <div className="flex items-center gap-10 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-brand-primary flex items-center justify-center font-black text-white italic text-lg shadow-lg">α</div>
          <span className="font-black tracking-[0.3em] text-[16px] uppercase text-slate-900 border-b-2 border-transparent group-hover:border-brand-primary transition-all">PCB.AI</span>
        </Link>
        
        {user && (
          <div className="hidden md:flex items-center space-x-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Link to="/dashboard" className="hover:text-brand-primary transition-colors flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-primary" /> My Dashboard
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="hover:text-brand-primary transition-colors flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-secondary" /> Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6 relative z-10">
        {user ? (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5 border-l border-border-accent pl-6">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{user.displayName || 'Operator'}</span>
                <span className="text-[8px] text-brand-primary font-bold uppercase tracking-[0.2em] leading-none mt-1">{user.role === 'admin' ? 'Admin User' : user.role === 'student' ? 'Student User' : 'Startup User'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="h-10 w-10 border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-error hover:border-error transition-all rounded-lg active:scale-90 shadow-sm"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-primary transition-colors">
              Login
            </Link>
            <Link to="/register" className="cad-button h-10 px-6 text-[10px]">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
