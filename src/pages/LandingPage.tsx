import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Cpu, Zap, Box, ShieldCheck, ChevronRight, Mail, Phone, Users, Info, Lightbulb } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-bg-deep min-h-screen flex flex-col font-sans text-slate-800">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none"></div>
      
      {/* Removed Top Navbar Simulation here as it is handled by the global Navbar */}
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 flex-1 flex flex-col justify-center z-10">
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] uppercase tracking-[0.3em] text-brand-primary font-black mb-10">
              Easy Circuit Design
            </div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-6xl md:text-8xl lg:text-[112px] font-black tracking-tighter mb-8 text-slate-900 leading-[0.88]"
            >
              AI PCB Design <br /><span className="text-brand-primary">Tool.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-16 leading-relaxed font-medium"
            >
              Experience the future of electronics. Generate high-quality PCB designs, part lists, and diagrams simply by typing your needs.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link to="/register" className="cad-button h-14 px-12 text-xs group">
                Get Started Now <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="h-14 px-10 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-black text-slate-600 transition-all uppercase tracking-[0.2em] flex items-center shadow-sm">
                Login
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Details Sections */}
      <section className="py-24 px-6 bg-white relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-start">
            {/* What is our project? */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="w-12 h-12 bg-brand-primary/10 flex items-center justify-center rounded-2xl text-brand-primary mb-6">
                <Info className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">What is PCB.AI?</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                PCB.AI is a smart tool designed to make electronic design easy. Using smart AI, we turn simple instructions into ready-to-make PCB designs, part lists, and diagrams. Our mission is to turn your ideas into real hardware quickly.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium italic">
                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                  Real-time 2D/3D View
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium italic">
                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                  Automatic Part Lists and Connections
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium italic">
                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                  Immediate Design Check
                </li>
              </ul>
            </motion.div>

            {/* To whom it will help? */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="w-12 h-12 bg-brand-primary/10 flex items-center justify-center rounded-2xl text-brand-primary mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Who It Helps?</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-brand-primary uppercase text-xs tracking-widest mb-2">Students & Educators</h4>
                  <p className="text-slate-600 text-sm italic">Learn electronics by seeing immediate results. Perfect for rapid prototyping of university projects.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-brand-primary uppercase text-xs tracking-widest mb-2">Startups & Makers</h4>
                  <p className="text-slate-600 text-sm italic">Make making hardware easier. Go from early ideas to final files without expensive software.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-brand-primary uppercase text-xs tracking-widest mb-2">Professional Engineers</h4>
                  <p className="text-slate-600 text-sm italic">Speed up the design process. Use AI to handle the tedious tasks while you focus on architecture.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-slate-50 relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 italic">Efficiency Redefined.</h2>
          <p className="text-slate-500 font-medium">Built for the next generation of hardware developers.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="p-8 bg-white cad-panel border-none">
            <Zap className="w-10 h-10 text-brand-primary mb-6" />
            <h3 className="text-xl font-bold mb-4">Ultra Fast</h3>
            <p className="text-sm text-slate-500 italic">Reduce design cycles from weeks to hours with automated net routing.</p>
          </div>
          <div className="p-8 bg-white cad-panel border-none">
            <Lightbulb className="w-10 h-10 text-brand-primary mb-6" />
            <h3 className="text-xl font-bold mb-4">Intelligent Placement</h3>
            <p className="text-sm text-slate-500 italic">Optimized component placement for thermal and signal integrity.</p>
          </div>
          <div className="p-8 bg-white cad-panel border-none">
            <ShieldCheck className="w-10 h-10 text-brand-primary mb-6" />
            <h3 className="text-xl font-bold mb-4">Design Ready</h3>
            <p className="text-sm text-slate-500 italic">Automatic verification against industry standard design rules.</p>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="bg-bg-panel py-20 px-6 border-t border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-primary flex items-center justify-center font-black text-white italic text-lg shadow-lg">α</div>
              <span className="font-black tracking-[0.2em] text-[18px] uppercase text-slate-900 border-b-2 border-brand-primary">PCB.AI</span>
            </div>
            <p className="text-slate-500 max-w-sm text-sm italic font-medium leading-relaxed">
              The world's easiest AI PCB design tool. Making hardware design easy for everyone.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Links</h4>
            <ul className="space-y-4 text-sm font-bold uppercase tracking-widest text-slate-600">
              <li><Link to="/" className="hover:text-brand-primary transition-colors">Home</Link></li>
              <li><Link to="/login" className="hover:text-brand-primary transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-brand-primary transition-colors">Register</Link></li>
              <li><Link to="/admin-access" className="hover:text-brand-primary transition-colors">Admin Vault</Link></li>
              <li><Link to="/dashboard" className="hover:text-brand-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Support</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-bold">sangambhure8@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-bold">9158504103</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-50 flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.4em]">
          <span>© 2026 PCB.AI</span>
          <div className="flex gap-8">
            <Link to="/privacy-policy" className="cursor-pointer hover:text-brand-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="cursor-pointer hover:text-brand-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
