import React from 'react';
import { UrlAnalyzer } from './components/UrlAnalyzer';
import { Shield, Zap, Github } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col relative overflow-hidden">
      {/* Ambient Neon Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Zap className="text-indigo-400" size={20} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-100">WebMCP Detection Tool</span>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-slate-200 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight mb-4 drop-shadow-sm"
          >
            WebMCP Detection Tool
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Analyze any website to detect live WebMCP tools and generate plug-and-play code for interactive UI elements.
          </motion.p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <UrlAnalyzer />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-2xl mt-auto relative z-10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Zap className="text-indigo-400" size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-100">WebMCP Detection Tool</span>
              </div>
              <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
                The industry standard for analyzing, detecting, and generating WebMCP integrations for modern web applications.
              </p>
              <div className="flex items-center space-x-4 pt-2">
                <a href="#" className="text-slate-500 hover:text-indigo-400 transition-colors">
                  <Github size={20} />
                </a>
                <a href="#" className="text-slate-500 hover:text-indigo-400 transition-colors">
                  <Shield size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-slate-100 font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">WebMCP Spec</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">GitHub Repository</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-100 font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-500 text-sm">
            <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-xs font-medium text-slate-300">Systems Operational</span>
            </div>
            <p>© 2026 WebMCP Detection Tool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
