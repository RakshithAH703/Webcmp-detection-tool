import React, { useState } from 'react';
import { Globe, CheckCircle2, Loader2, AlertTriangle, Monitor, Activity, ServerCrash, Copy } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateNonToolsCode = async (actualNonTools: string[]) => {
    if (!actualNonTools || actualNonTools.length === 0) return;
    setIsGeneratingNonTools(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Here is a raw list of interactive UI elements scraped from a webpage: ${JSON.stringify(actualNonTools)}. 
Your job is to act as a strict WebMCP architect. Do NOT generate code for every item. 
First, FILTER OUT all trivial UI elements. You MUST IGNORE:
- Cookie banners (Accept, Deny, Settings)
- Legal/Footer links (Privacy Policy, Terms, Disclaimer)
- Pagination (1, 2, 3, Next, Previous, ...)
- Simple navigation links (Home, About Us, Contact Us)
- Granular UI state toggles (e.g., specific miles/radius buttons, specific filter checkboxes like 'Phase 1')

Only keep HIGH-VALUE actions that an AI Agent would actually need a dedicated tool for (e.g., 'Search Clinical Trials', 'Apply Filters', 'Generate Report', 'Submit Form'). 
For the filtered list of high-value actions ONLY, write a brief description and the exact JavaScript plug-and-play code to register it. The output array should be MUCH shorter than the input array because of this strict filtering.

For the code generation for plug and play do this:
1. Traditional JS / Drop-in Ready: The code must be written in modern Vanilla JavaScript. Wrap it in a self-contained initialization function (e.g., function initWebMCPTools() { ... }) so developers can drop it into any existing codebase.
2. Graceful Degradation: The code MUST check if ('modelContext' in navigator) before attempting to register anything.
3. Wrap Real APIs (No Mock Data): Do NOT use local mock data arrays. Assume the website uses a backend API. The handler function must demonstrate making a real fetch() call to a hypothetical endpoint (e.g., /api/v1/search).
4. Imperative API: Use the standard imperative format: navigator.modelContext.registerTool({ name, description, schema, handler }).
5. Strict Schema: Provide a realistic JSON Schema for the schema property based on what the action requires (e.g., search queries, filter IDs).
6. Formatting: The plugAndPlayCode MUST be beautifully formatted with proper indentation and newline characters (\\n). Do NOT minify or compress the code into a single line.

OUTPUT FORMAT:
Return a strict JSON array of objects matching this schema:
{ name: string, description: string, plugAndPlayCode: string }`,
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
              onKeyDown={(e) => e.key === 'Enter' && scanWebsite()}
            />
          </div>
        </div>
        
        <div className="flex mt-6 justify-center">
          <button
            onClick={scanWebsite}
            disabled={isDetecting || !url}
            className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isDetecting ? <Loader2 className="animate-spin" size={18} /> : <Activity size={18} />}
            <span>Scan Website</span>
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
                ? `Successfully connected to the page and found ${liveData.registeredTools?.length || 0} registered tools.` 
                : 'The navigator.modelContext API was not found on this page.'}
            </p>
          </div>

          {liveData.enabled && liveData.registeredTools && liveData.registeredTools.length > 0 && (
            <div className="space-y-6 mt-8">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-emerald-900 flex items-center mb-2">
                  <CheckCircle2 className="mr-2 text-emerald-500" />
                  Registered WebMCP Tools
                </h3>
                <p className="text-emerald-700 text-sm">These tools are already registered and active on the live site.</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {liveData.registeredTools.map((tool: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-bold text-zinc-900">{tool.name || tool.title || 'Unnamed Tool'}</h4>
                      <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} className="mr-1" /> Active
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 mb-4">{tool.description || 'No description provided.'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Non-Tools Code */}
          {liveData?.actualNonTools && liveData.actualNonTools.length > 0 && (
            <div className="space-y-6 mt-8">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-amber-900 flex items-center mb-2">
                  <Monitor className="mr-2 text-amber-500" />
                  Non-WebMCP Tools Detected
                </h3>
                <p className="text-amber-700 text-sm">We found interactive elements on the page that aren't WebMCP enabled. Here is the plug-and-play code to register them.</p>
              </div>

              {isGeneratingNonTools ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200">
                  <Loader2 className="animate-spin text-indigo-500 mr-3" size={24} />
                  <span className="text-zinc-600 font-medium">Generating plug-and-play code with Gemini...</span>
                </div>
              ) : generatedNonTools ? (
                <div className="grid grid-cols-1 gap-6">
                  {generatedNonTools.map((tool, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold text-zinc-900">{tool.name}</h4>
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} className="mr-1" /> Needs Implementation
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 mb-4">{tool.description}</p>
                      
                      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 mt-4">
                        <div className="px-3 py-1.5 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                          <span className="text-zinc-400 text-xs font-mono">Plug-and-Play Code</span>
                          <button 
                            onClick={() => copyToClipboard(tool.plugAndPlayCode)}
                            className="text-zinc-400 hover:text-white transition-colors flex items-center text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded"
                          >
                            <Copy size={12} className="mr-1" /> Copy
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre">
                          <code>{tool.plugAndPlayCode}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
