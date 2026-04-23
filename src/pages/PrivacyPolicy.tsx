import React from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg-deep py-20 px-6 font-sans text-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-3xl p-10 md:p-16 shadow-sm border border-slate-100 relative z-10"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-brand-primary/10 flex items-center justify-center rounded-2xl text-brand-primary">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Privacy Policy</h1>
        </div>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Data Collection</h2>
            <p className="italic">We collect minimum necessary data to provide you with the best PCB design generation features. This includes account details, design specifications, and usage analytics.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. AI Processing</h2>
            <p className="italic">Your schematics and prompts are processed by our AI engines purely for the purpose of generating your requested circuits. We do not use private user data to train public models without explicit consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Data Security</h2>
            <p className="italic">All design files and generated outputs are stored securely. We utilize industry-standard encryption to ensure your intellectual property remains yours.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Contact Us</h2>
            <p className="italic">If you have any questions about this Privacy Policy, please contact our support team at sangambhure8@gmail.com.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
