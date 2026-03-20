import React, { useState } from 'react';
import { ExtensionCode } from './components/ExtensionCode';
import { UrlAnalyzer } from './components/UrlAnalyzer';
import { Shield, Search, Zap, Github, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'extension'>('analyzer');

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-zinc-900 font-sans">
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
            <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('analyzer')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'analyzer' 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Search size={16} />
                <span>Analyzer</span>
              </button>
              <button
                onClick={() => setActiveTab('extension')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'extension' 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Terminal size={16} />
                <span>Extension Code</span>
              </button>
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
            {activeTab === 'analyzer' ? 'WebMCP Readiness Analyzer' : 'WebMCP Detection Extension'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            {activeTab === 'analyzer' 
              ? 'Analyze any website to discover potential WebMCP tools and generate declarative function code for ingestion.'
              : 'Recreate the Chrome extension that detects WebMCP tools natively using experimental Chromium APIs.'}
          </motion.p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'analyzer' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'analyzer' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'analyzer' ? <UrlAnalyzer /> : <ExtensionCode />}
          </motion.div>
        </AnimatePresence>
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
