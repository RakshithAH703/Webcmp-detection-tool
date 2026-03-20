import React, { useState } from 'react';
import { Search, Globe, CheckCircle2, XCircle, Code, Database, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ToolAnalysis {
  name: string;
  description: string;
  isReady: boolean;
  reason?: string;
  declarativeCode?: string;
}

export const UrlAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ToolAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeUrl = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following website URL for potential WebMCP (Model Context Protocol) tool integration. 
        Website: ${url}
        
        Identify 5 potential actions/tools that could be exposed via WebMCP.
        Categorize them as "Ready" (if they likely exist as standard web interactions) or "Not Ready" (if they require custom declarative function wrapping).
        
        For "Not Ready" tools, provide a JSON-based declarative function definition that could be ingested into a database.
        
        Return the result as a JSON array of objects with:
        - name: string
        - description: string
        - isReady: boolean
        - reason: string (why it is or isn't ready)
        - declarativeCode: string (the JSON tool definition for "Not Ready" items, otherwise empty)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                isReady: { type: Type.BOOLEAN },
                reason: { type: Type.STRING },
                declarativeCode: { type: Type.STRING }
              },
              required: ["name", "description", "isReady", "reason", "declarativeCode"]
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
            <button
              onClick={analyzeUrl}
              disabled={isAnalyzing || !url}
              className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center">
          {error}
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center">
              <Sparkles className="mr-2 text-indigo-500" />
              Detected Actions
            </h3>
            {results.map((tool, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-2xl border transition-all hover:shadow-lg ${
                  tool.isReady 
                    ? 'bg-emerald-50/50 border-emerald-100' 
                    : 'bg-amber-50/50 border-amber-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-zinc-900">{tool.name}</h4>
                      {tool.isReady ? (
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} className="mr-1" /> Ready
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <XCircle size={10} className="mr-1" /> Not Ready
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 mt-1">{tool.description}</p>
                    <p className="text-xs text-zinc-500 mt-3 italic">
                      <span className="font-semibold not-italic">Status: </span>
                      {tool.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center">
              <Database className="mr-2 text-blue-500" />
              Ingestion Code (Declarative)
            </h3>
            <div className="space-y-4">
              {results.filter(t => !t.isReady).length > 0 ? (
                results.filter(t => !t.isReady).map((tool, idx) => (
                  <div key={idx} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                    <div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                      <span className="text-zinc-400 text-xs font-mono">{tool.name} Definition</span>
                      <Code size={14} className="text-zinc-500" />
                    </div>
                    <div className="p-4 text-sm font-mono text-zinc-300 overflow-x-auto">
                      <Markdown>{`\`\`\`json\n${tool.declarativeCode}\n\`\`\``}</Markdown>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center text-zinc-500">
                  All detected tools are already WebMCP ready.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
