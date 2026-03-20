import React, { useState } from 'react';
import { Search, Globe, CheckCircle2, XCircle, Code, Database, Loader2, Sparkles, AlertTriangle, Monitor, Activity, ServerCrash } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ToolAnalysis {
  name: string;
  description: string;
  classification: 'AI_TOOL' | 'NON_TOOL_UI';
  reason: string;
  declarativeCode?: string;
}

export const UrlAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [results, setResults] = useState<ToolAnalysis[] | null>(null);
  const [liveData, setLiveData] = useState<{enabled: boolean, tools: any[]} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeUrl = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setLiveData(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the specific platform at the URL: ${url}. 
        Do NOT output generic web actions (like "Login", "Logout", "Search Database", or "Toggle Theme").
        Instead, identify 5 to 10 ACTUAL, highly specific core features, tools, and user actions unique to this exact platform's product or service.
        
        Divide the identified actions into two categories using the 'classification' field:
        AI_TOOL: Complex, platform-specific actions, data retrieval, or background tasks that an AI agent should be able to do via an API or WebMCP (e.g., if it's a code host, "Create Pull Request"; if it's a CRM, "Update Lead Status").
        NON_TOOL_UI: Ephemeral, visual, or local state changes that should strictly remain in the browser UI and NEVER be exposed to an AI agent (e.g., UI sorting, opening modals, local filtering).
        
        For NON_TOOL_UI items, explain in the 'reason' field why exposing this to an AI agent would be a bad architectural decision.
        For AI_TOOL items, provide a JSON-based declarative function definition in 'declarativeCode' that could be ingested into a database.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                classification: { 
                  type: Type.STRING, 
                  description: "Must be either 'AI_TOOL' or 'NON_TOOL_UI'" 
                },
                reason: { 
                  type: Type.STRING,
                  description: "Why this should be an AI tool, or why it should remain a UI-only non-tool."
                },
                declarativeCode: { type: Type.STRING }
              },
              required: ["name", "description", "classification", "reason"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the URL. Please ensure it's a valid URL and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectLiveTools = async () => {
    if (!url) return;
    setIsDetecting(true);
    setError(null);
    setResults(null);
    setLiveData(null);

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
      setLiveData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsDetecting(false);
    }
  };

  const aiTools = results?.filter(t => t.classification === 'AI_TOOL') || [];
  const nonTools = results?.filter(t => t.classification === 'NON_TOOL_UI') || [];

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-2 border border-zinc-100">
            <Globe className="ml-4 text-zinc-400" size={20} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL to analyze (e.g., https://example.com)"
              className="flex-1 px-4 py-3 outline-none text-zinc-700 placeholder-zinc-400 bg-transparent"
              onKeyDown={(e) => e.key === 'Enter' && analyzeUrl()}
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6 justify-center">
          <button
            onClick={analyzeUrl}
            disabled={isAnalyzing || isDetecting || !url}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span>Predict Tools (AI)</span>
          </button>
          
          <button
            onClick={detectLiveTools}
            disabled={isAnalyzing || isDetecting || !url}
            className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isDetecting ? <Loader2 className="animate-spin" size={18} /> : <Activity size={18} />}
            <span>Detect Actual Tools (Live)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {/* Live Data Results */}
      {liveData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`p-6 rounded-2xl border ${liveData.enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`text-xl font-bold flex items-center mb-2 ${liveData.enabled ? 'text-emerald-900' : 'text-red-900'}`}>
              {liveData.enabled ? <CheckCircle2 className="mr-2" /> : <ServerCrash className="mr-2" />}
              {liveData.enabled ? 'WebMCP Enabled' : 'WebMCP Not Enabled'}
            </h3>
            <p className={liveData.enabled ? 'text-emerald-700' : 'text-red-700'}>
              {liveData.enabled 
                ? `Successfully connected to the page and found ${liveData.tools.length} registered tools.` 
                : 'The navigator.modelContext API was not found on this page.'}
            </p>
          </div>

          {liveData.enabled && liveData.tools.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              <div className="px-4 py-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                <span className="text-zinc-300 font-mono text-sm">Registered Tools JSON</span>
                <Database size={16} className="text-zinc-500" />
              </div>
              <div className="p-4 text-sm font-mono text-zinc-300 overflow-x-auto">
                <pre>{JSON.stringify(liveData.tools, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Prediction Results */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* AI Tools Column */}
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-indigo-900 flex items-center mb-2">
                <Sparkles className="mr-2 text-indigo-500" />
                Predicted AI Tools
              </h3>
              <p className="text-indigo-700 text-sm">Complex actions suitable for WebMCP exposure.</p>
            </div>
            
            {aiTools.map((tool, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-bold text-zinc-900">{tool.name}</h4>
                  <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} className="mr-1" /> AI Tool
                  </span>
                </div>
                <p className="text-sm text-zinc-600 mb-4">{tool.description}</p>
                
                {tool.declarativeCode && (
                  <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 mt-4">
                    <div className="px-3 py-1.5 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                      <span className="text-zinc-400 text-xs font-mono">Declarative JSON</span>
                      <Database size={12} className="text-zinc-500" />
                    </div>
                    <div className="p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
                      <Markdown>{"\`\`\`json\\n" + tool.declarativeCode + "\\n\`\`\`"}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {aiTools.length === 0 && (
              <p className="text-zinc-500 italic text-center py-4">No AI Tools detected.</p>
            )}
          </div>

          {/* Non-Tools Column */}
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-amber-900 flex items-center mb-2">
                <Monitor className="mr-2 text-amber-500" />
                UI-Only Actions (Non-Tools)
              </h3>
              <p className="text-amber-700 text-sm">Ephemeral state changes that should NOT be exposed to AI.</p>
            </div>

            {nonTools.map((tool, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-bold text-zinc-900">{tool.name}</h4>
                  <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={10} className="mr-1" /> UI Only
                  </span>
                </div>
                <p className="text-sm text-zinc-600 mb-3">{tool.description}</p>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">Why isolate this?</span> {tool.reason}
                  </p>
                </div>
              </div>
            ))}
            {nonTools.length === 0 && (
              <p className="text-zinc-500 italic text-center py-4">No UI-Only actions detected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
