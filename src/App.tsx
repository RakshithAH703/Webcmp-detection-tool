import React from 'react';
import { UrlAnalyzer } from './components/UrlAnalyzer';
import { Shield, Zap, Github } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-zinc-900 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-zinc-900 p-2 rounded-lg">
                <Zap className="text-white" size={20} />
              </div>
              <span className="text-lg font-bold tracking-tight">WebMCP Detective</span>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <a href="#" className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-12 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4"
          >
            WebMCP Readiness Analyzer
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            Analyze any website to detect live WebMCP tools and generate plug-and-play code for interactive UI elements.
          </motion.p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <UrlAnalyzer />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-zinc-500 text-sm">
            <div className="flex items-center space-x-2">
              <Shield size={16} />
              <span>Built for WebMCP Experimental Testing</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-zinc-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
            </div>
            <p>© 2026 WebMCP Detective. Experimental Chromium API Wrapper.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
