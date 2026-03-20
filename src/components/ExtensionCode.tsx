import React from 'react';
import { Copy, Check, FileCode, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ExtensionCode: React.FC = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const files = [
    {
      name: 'manifest.json',
      language: 'json',
      content: `{
  "manifest_version": 3,
  "name": "WebMCP Detection Tool",
  "version": "1.1",
  "description": "Detects WebMCP tools and identifies leaked UI actions",
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}`
    },
    {
      name: 'content.js',
      language: 'javascript',
      content: `// Feature Detection
if (!navigator.modelContextTesting) {
  console.warn('WebMCP Detection: navigator.modelContextTesting not found. Enable "WebMCP for testing" flag.');
}

async function analyzePageActions() {
  // 1. Get the registered AI Tools
  const aiTools = navigator.modelContextTesting ? navigator.modelContextTesting.listTools() : [];
  const aiToolNames = aiTools.map(t => t.name.toLowerCase());

  // 2. Scan the DOM for UI Actions (Non-Tools)
  const domElements = document.querySelectorAll('button, a, [role="button"]');
  const uiActions = Array.from(domElements)
    .map(el => (el.innerText || el.getAttribute('aria-label') || '').trim().toLowerCase())
    .filter(text => text.length > 0);

  // 3. Categorize them
  const nonTools = [];
  const leakedTools = [];

  // Keywords that should strictly be UI (Non-Tools)
  const uiKeywords = ['theme', 'dark mode', 'sort', 'filter', 'next page', 'favorite', 'login', 'logout', 'menu'];

  uiActions.forEach(action => {
    // If a UI element is NOT in the AI tools, it's a properly isolated Non-Tool
    if (!aiToolNames.includes(action)) {
      nonTools.push(action);
    }
  });

  aiToolNames.forEach(toolName => {
    // If an AI tool contains a UI keyword, it's a LEAK (Bad practice)
    if (uiKeywords.some(keyword => toolName.includes(keyword))) {
      leakedTools.push(toolName);
    }
  });

  return {
    validAiTools: aiTools,
    isolatedNonTools: [...new Set(nonTools)], // e.g., "Toggle Theme", "Sort by Price"
    leakedUiTools: leakedTools // e.g., "setDarkMode" found in WebMCP
  };
}

async function runAnalysis() {
  const analysis = await analyzePageActions();
  chrome.runtime.sendMessage({ type: 'WEBMCP_ANALYSIS_COMPLETE', analysis, url: location.href });
}

// Listening for Dynamic Tool Changes
if (navigator.modelContextTesting) {
  if ('ontoolchange' in navigator.modelContextTesting.__proto__) {
    navigator.modelContextTesting.addEventListener('toolchange', runAnalysis);
  } else if (navigator.modelContextTesting.registerToolsChangedCallback) {
    navigator.modelContextTesting.registerToolsChangedCallback(runAnalysis);
  }
  
  // Initial scan
  runAnalysis();
}

// Monitoring Execution Lifecycle
window.addEventListener('toolactivated', ({ toolName }) => {
  chrome.runtime.sendMessage({ type: 'TOOL_ACTIVATED', toolName });
});

window.addEventListener('toolcancel', ({ toolName }) => {
  chrome.runtime.sendMessage({ type: 'TOOL_CANCELLED', toolName });
});`
    },
    {
      name: 'popup.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 350px; font-family: system-ui, sans-serif; padding: 12px; margin: 0; background: #fafafa; }
    h3 { margin-top: 0; font-size: 16px; color: #111; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .section { margin-bottom: 16px; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #eee; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; color: #555; }
    .item { font-size: 13px; padding: 4px 0; border-bottom: 1px solid #f5f5f5; color: #333; }
    .item:last-child { border-bottom: none; }
    .badge-success { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
    .badge-warning { background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
    .badge-danger { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
    .empty { font-size: 12px; color: #888; font-style: italic; }
  </style>
</head>
<body>
  <h3>WebMCP Inspector</h3>
  <div id="content">Scanning page...</div>
  <script src="popup.js"></script>
</body>
</html>`
    },
    {
      name: 'popup.js',
      language: 'javascript',
      content: `chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'WEBMCP_ANALYSIS_COMPLETE') {
    const content = document.getElementById('content');
    const { validAiTools, isolatedNonTools, leakedUiTools } = message.analysis;
    
    let html = '';
    
    // 1. Valid AI Tools
    html += '<div class="section"><div class="section-title">🤖 Registered AI Tools</div>';
    if (validAiTools.length === 0) {
      html += '<div class="empty">No tools detected.</div>';
    } else {
      validAiTools.forEach(tool => {
        const isLeaked = leakedUiTools.includes(tool.name.toLowerCase());
        if (!isLeaked) {
          html += \`<div class="item"><strong>\${tool.name}</strong> <span class="badge-success">Valid</span></div>\`;
        }
      });
    }
    html += '</div>';

    // 2. Leaked UI Tools (Warnings)
    if (leakedUiTools.length > 0) {
      html += '<div class="section" style="border-color: #fca5a5;"><div class="section-title" style="color: #dc2626;">⚠️ Leaked UI Tools (Bad Practice)</div>';
      leakedUiTools.forEach(toolName => {
        html += \`<div class="item"><strong>\${toolName}</strong> <span class="badge-danger">Exposed UI</span></div>\`;
      });
      html += '</div>';
    }

    // 3. Isolated Non-Tools (Good Practice)
    html += '<div class="section"><div class="section-title">🖱️ Isolated UI Actions (Non-Tools)</div>';
    if (isolatedNonTools.length === 0) {
      html += '<div class="empty">No UI actions found.</div>';
    } else {
      // Show up to 10 to avoid clutter
      isolatedNonTools.slice(0, 10).forEach(action => {
        html += \`<div class="item">\${action} <span class="badge-warning">UI Only</span></div>\`;
      });
      if (isolatedNonTools.length > 10) {
        html += \`<div class="item empty">...and \${isolatedNonTools.length - 10} more</div>\`;
      }
    }
    html += '</div>';

    content.innerHTML = html;
  }
});`
    }
  ];

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-center">
          <ShieldCheck className="text-blue-500 mr-3" />
          <h3 className="text-blue-800 font-bold">Chrome Extension Recreation (Upgraded)</h3>
        </div>
        <p className="text-blue-700 mt-2 text-sm">
          This upgraded extension not only detects WebMCP tools but also scans the DOM to differentiate between <strong>AI Tools</strong> and <strong>UI-Only Actions (Non-Tools)</strong>. It will warn you if UI actions (like "Dark Mode") are accidentally leaked to the AI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {files.map((file) => (
          <div key={file.name} className="bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
              <div className="flex items-center space-x-2">
                <FileCode size={16} className="text-zinc-400" />
                <span className="text-zinc-200 font-mono text-sm">{file.name}</span>
              </div>
              <button
                onClick={() => copyToClipboard(file.content, file.name)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                {copied === file.name ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-zinc-300 font-mono text-sm">{file.content}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
