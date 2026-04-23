import React from 'react';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';

export default function TermsOfService() {
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
            <Info className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Terms of Service</h1>
        </div>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="italic">By accessing and using PCB.AI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Usage Rules</h2>
            <p className="italic">You agree to use the service only for lawful product development and engineering purposes. Any attempt to reverse engineer, abuse the API, or scrape data is strictly prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Intellectual Property</h2>
            <p className="italic">The designs generated using PCB.AI based on your prompts belong to you. We do not claim ownership over the generated schematics and board layouts you export.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Liability</h2>
            <p className="italic">PCB.AI provides AI-assisted design drafts. It is your responsibility to verify the generated circuits before manufacturing. We are not liable for any faulty manufacturing or unverified edge cases in generated hardware.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
