import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, Loader2, AlertTriangle, Monitor, Activity, ServerCrash, Copy, ScanLine } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface GeneratedTool {
  name: string;
  description: string;
  plugAndPlayCode: string;
}

export const UrlAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [liveData, setLiveData] = useState<{enabled: boolean, registeredTools: any[], actualNonTools?: string[]} | null>(null);
  const [generatedNonTools, setGeneratedNonTools] = useState<GeneratedTool[] | null>(null);
  const [isGeneratingNonTools, setIsGeneratingNonTools] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const scanMessages = ["Extracting DOM...", "Looking for WebMCP...", "Identifying tools..."];

  useEffect(() => {
    if (!isDetecting) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, scanMessages.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [isDetecting]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateNonToolsCode = async (actualNonTools: string[]) => {
    if (!actualNonTools || actualNonTools.length === 0) return;
    setIsGeneratingNonTools(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert WebMCP Architect. I am providing a raw list of interactive UI elements scraped from a live webpage: ${JSON.stringify(actualNonTools)}.

STEP 1: FILTER THE LIST (AGENT-CENTRIC FOCUS)
You must strictly curate this list based on what an AI Agent actually needs to interact with the system's data and business logic.

**DO NOT INCLUDE (Drop these completely):**
- Visual Navigation (e.g., 'Home', 'Dashboard', 'Menu', 'Back')
- Cookie banners (Accept, Deny, Settings)
- Legal/Footer links (Privacy Policy, Terms, Disclaimer)
- Pagination numbers and symbols (1, 2, 3, Next, Previous, ...)
- Granular UI state toggles or specific values (e.g., '10 mi', 'Phase 1', 'Status Ascending', 'Apply', 'Clear')

**MUST INCLUDE (Keep these high-value, agent-actionable features):**
- Search and Querying (e.g., 'Search', 'Search Clinical Trials')
- Data Retrieval and Inspection (e.g., 'View Study', 'View Details', 'Compare', 'Reports')
- Data Submission and Forms (e.g., 'Contact Us', 'Submit Form', 'Generate Report')
- Real product actions (e.g., 'Buy Medicines', 'Find Doctors', 'Lab Tests')

STEP 2: REMOVE DUPLICATES AND MERGE
- Merge similar actions into one single tool.
- Examples: "Find Doctors" + "Find a Doctor" -> "Find Doctors"
- "Order Medicines" + "Buy Medicines" -> "Buy Medicines"
- Ensure one action = one tool, and no duplicates across categories.

STEP 3: GENERATE PRODUCTION-GRADE CODE
For the filtered list of high-value actions ONLY, generate the exact 'plug-and-play' JavaScript code to register the tool.
1. Write modern Vanilla JavaScript wrapped in an initialization function (e.g., \`function init[ActionName]Tool() { ... }\`).
2. Include graceful degradation: \`if (!('modelContext' in navigator)) return;\`
3. Use the imperative API: \`navigator.modelContext.registerTool({ name, description, schema, handler })\`.
4. The \`handler\` MUST demonstrate making a real \`fetch()\` call to a hypothetical backend API (e.g., \`/api/v1/...\`). Do NOT use local mock data arrays.
5. Provide a realistic JSON Schema for the \`schema\` property based on the action (e.g., search parameters, form fields, or record IDs).
6. Non-WebMCP Implementation Warning: Immediately after the schema closing brace \`},\`, you MUST insert this exact comment: \`//update following code with your implementation\`.
Example:
schema: {
  type: "object",
  properties: {
    query: { type: "string", description: "The search term to look for." },
    limit: { type: "integer", description: "Maximum number of results to return." }
  },
  required: ["query"]
}, //update following code with your implementation
async handler({ query, limit = 10 }) {
  const response = await fetch(\`/api/v1/search?q=\${encodeURIComponent(query)}&limit=\${limit}\`);
  if (!response.ok) throw new Error("Search request failed");
  return await response.json();
}
7. Formatting: The plugAndPlayCode MUST be beautifully formatted with proper indentation and newline characters (\\n). Do NOT minify or compress the code into a single line.

Return a strict JSON array of objects: \`{ name: string, description: string, plugAndPlayCode: string }\``,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                plugAndPlayCode: { type: Type.STRING }
              },
              required: ["name", "description", "plugAndPlayCode"]
            }
          }
        }
      });
      const data = JSON.parse(response.text);
      setGeneratedNonTools(data);
    } catch (err) {
      console.error("Failed to generate code for non-tools", err);
    } finally {
      setIsGeneratingNonTools(false);
    }
  };

  const scanWebsite = async () => {
    if (!url) return;
    setIsDetecting(true);
    setError(null);
    setLiveData(null);
    setGeneratedNonTools(null);

    try {
      const response = await fetch('/api/detect-webmcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("API route not found. Note: Live Detection requires deployment to Vercel to run the Serverless Headless Browser.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to detect tools.");
      }

      const data = await response.json();
      
      // Log Cleanup: Remove "register webmcp tool" from the detected tools
      if (data.actualNonTools) {
        data.actualNonTools = data.actualNonTools.filter((item: string) => !item.toLowerCase().includes('register webmcp tool'));
      }
      
      setLiveData(data);
      if (data.actualNonTools && data.actualNonTools.length > 0) {
        generateNonToolsCode(data.actualNonTools);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsDetecting(false);
    }
  };

  const webmcpTools = liveData?.registeredTools?.length || 0;
  const nonWebmcpTools = generatedNonTools?.length || 0;
  const totalFinalTools = webmcpTools + nonWebmcpTools;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl p-2 border border-white/5 group-hover:border-indigo-500/30 transition-colors">
            <Globe className="ml-4 text-slate-400" size={20} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL to analyze (e.g., https://example.com)"
              className="flex-1 px-4 py-3 outline-none text-slate-200 placeholder-slate-500 bg-transparent"
              onKeyDown={(e) => e.key === 'Enter' && scanWebsite()}
            />
          </div>
        </div>
        
        <div className="flex mt-6 justify-center">
          <button
            onClick={scanWebsite}
            disabled={isDetecting || !url}
            className="w-full sm:w-auto bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-600 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-indigo-400/20"
          >
            {isDetecting ? <ScanLine className="animate-pulse" size={18} /> : <Activity size={18} />}
            <span>{isDetecting ? 'Analyzing DOM...' : 'Scan Website'}</span>
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20 text-center max-w-2xl mx-auto backdrop-blur-xl"
        >
          {error}
        </motion.div>
      )}

      {/* Loading State Animation */}
      {isDetecting && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-12 space-y-4"
        >
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-blue-400 animate-spin animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full border-b-2 border-indigo-300 animate-spin animation-delay-300"></div>
            <ScanLine className="text-indigo-400 animate-pulse" size={20} />
          </div>
          <div className="text-slate-400 font-mono text-sm animate-pulse">
            {scanMessages[messageIndex]}
          </div>
        </motion.div>
      )}

      {/* Live Data Results */}
      {liveData && !isDetecting && (
        <motion.div 
          initial="hidden" animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="space-y-6"
        >
          {/* Post-Scan Navigation UI */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row gap-4 mb-2">
            {(liveData.registeredTools && liveData.registeredTools.length > 0) && (
              <button onClick={() => document.getElementById('webmcp-tools')?.scrollIntoView({ behavior: 'smooth' })} className="flex-1 px-6 py-4 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 text-lg font-semibold shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center space-x-3">
                <CheckCircle2 size={24} />
                <span>WebMCP Tools</span>
              </button>
            )}
            {(isGeneratingNonTools || (generatedNonTools && generatedNonTools.length > 0)) && (
              <button onClick={() => document.getElementById('non-webmcp-tools')?.scrollIntoView({ behavior: 'smooth' })} className="flex-1 px-6 py-4 bg-amber-500/10 text-amber-400 rounded-2xl hover:bg-amber-500/20 transition-all border border-amber-500/20 text-lg font-semibold shadow-lg hover:shadow-amber-500/10 flex items-center justify-center space-x-3">
                <Monitor size={24} />
                <span>Non-WebMCP Tools</span>
              </button>
            )}
          </motion.div>

          {/* Header & Summary */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className={`p-6 rounded-3xl border backdrop-blur-xl shadow-2xl ${liveData.enabled ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-red-500/10 border-red-500/20'}`}
          >
            <h3 className={`text-xl font-bold flex items-center mb-2 ${liveData.enabled ? 'text-emerald-400' : 'text-red-400'}`}>
              {liveData.enabled ? <CheckCircle2 className="mr-2" /> : <ServerCrash className="mr-2" />}
              {liveData.enabled ? 'WebMCP Enabled' : 'WebMCP Not Enabled'}
            </h3>
            <p className={liveData.enabled ? 'text-emerald-400/80' : 'text-red-400/80'}>
              {isGeneratingNonTools ? (
                <span className="animate-pulse">Analyzing core actions...</span>
              ) : (
                liveData.enabled ? (
                  <>We identified <strong>{totalFinalTools} core actions</strong> in your application. Out of these, <strong>{webmcpTools} are WebMCP-enabled</strong> and <strong>{nonWebmcpTools} are not yet enabled</strong>.</>
                ) : (
                  <>We identified <strong>{totalFinalTools} core actions</strong> in your application. None of them are WebMCP-enabled.</>
                )
              )}
            </p>
          </motion.div>

          {liveData.enabled && liveData.registeredTools && liveData.registeredTools.length > 0 && (
            <motion.div id="webmcp-tools" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-6 mt-8 scroll-mt-24">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl p-6">
                <h3 className="text-xl font-bold text-slate-200 flex items-center mb-2">
                  <CheckCircle2 className="mr-2 text-emerald-400" />
                  WebMCP Tools
                </h3>
                <p className="text-slate-400 text-sm">These tools are already active on the live site.</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {liveData.registeredTools.map((tool: any, idx: number) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={idx} 
                    className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-2xl hover:border-emerald-400/30 transition-all"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-bold text-slate-200">{tool.name || tool.title || 'Unnamed Tool'}</h4>
                      <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                        <span className="relative flex h-2 w-2 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">{tool.description || 'No description provided.'}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Generated Non-Tools Code */}
          {(isGeneratingNonTools || (generatedNonTools && generatedNonTools.length > 0)) && (
            <motion.div id="non-webmcp-tools" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-6 mt-8 scroll-mt-24">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl p-6">
                <h3 className="text-xl font-bold text-slate-200 flex items-center mb-2">
                  <Monitor className="mr-2 text-amber-400" />
                  Non-WebMCP Tools Detected
                </h3>
                <p className="text-slate-400 text-sm">We found interactive elements on the page that aren't WebMCP enabled. Here is the suggested code to enable them.</p>
              </div>

              {isGeneratingNonTools ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl space-y-4">
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-orange-400 animate-spin animation-delay-150"></div>
                  </div>
                  <span className="text-slate-400 font-mono text-sm animate-pulse">Suggested code for WebMCP enablement...</span>
                </div>
              ) : generatedNonTools ? (
                <div className="grid grid-cols-1 gap-6">
                  {generatedNonTools.map((tool, idx) => (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      key={idx} 
                      className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold text-slate-200">{tool.name}</h4>
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} className="mr-1" /> Needs Implementation
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{tool.description}</p>
                      
                      <div className="bg-slate-950/80 rounded-xl overflow-hidden border border-white/10 mt-4 shadow-inner">
                        <div className="px-4 py-2 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
                          <span className="text-slate-400 text-xs font-mono">Suggested code for WebMCP enablement</span>
                          <button 
                            onClick={() => copyToClipboard(tool.plugAndPlayCode)}
                            className="text-slate-400 hover:text-white transition-colors flex items-center text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/5"
                          >
                            <Copy size={12} className="mr-1" /> Copy
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre">
                          <code>{tool.plugAndPlayCode}</code>
                        </pre>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};