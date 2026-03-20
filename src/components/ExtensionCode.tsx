import React from 'react';
import { Copy, Check, FileCode, ShieldCheck, AlertCircle } from 'lucide-react';

export const ExtensionCode: React.FC = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const files = [
    {
      name: 'manifest.json',
      language: 'json',
      content: `{
  "manifest_version": 3,
  "name": "WebMCP Detection Tool",
  "version": "1.0",
  "description": "Detects WebMCP tools using navigator.modelContextTesting",
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

function listTools() {
  if (navigator.modelContextTesting) {
    const tools = navigator.modelContextTesting.listTools();
    chrome.runtime.sendMessage({ type: 'WEBMCP_TOOLS_FOUND', tools, url: location.href });
  }
}

// Listening for Dynamic Tool Changes
if (navigator.modelContextTesting) {
  if ('ontoolchange' in navigator.modelContextTesting.__proto__) {
    navigator.modelContextTesting.addEventListener('toolchange', listTools);
  } else if (navigator.modelContextTesting.registerToolsChangedCallback) {
    navigator.modelContextTesting.registerToolsChangedCallback(listTools);
  }
  
  // Initial scan
  listTools();
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
    body { width: 300px; font-family: sans-serif; padding: 10px; }
    .tool-item { border-bottom: 1px solid #eee; padding: 8px 0; }
    .status { font-size: 12px; color: #666; }
    .ready { color: green; font-weight: bold; }
  </style>
</head>
<body>
  <h3>WebMCP Tools</h3>
  <div id="tools-list">Scanning...</div>
  <script src="popup.js"></script>
</body>
</html>`
    },
    {
      name: 'popup.js',
      language: 'javascript',
      content: `chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'WEBMCP_TOOLS_FOUND') {
    const list = document.getElementById('tools-list');
    list.innerHTML = '';
    if (message.tools.length === 0) {
      list.innerHTML = 'No tools detected.';
      return;
    }
    message.tools.forEach(tool => {
      const div = document.createElement('div');
      div.className = 'tool-item';
      div.innerHTML = \`
        <strong>\${tool.name}</strong><br/>
        <span class="status ready">Ready</span>
      \`;
      list.appendChild(div);
    });
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
          <h3 className="text-blue-800 font-bold">Chrome Extension Recreation</h3>
        </div>
        <p className="text-blue-700 mt-2 text-sm">
          This extension acts as a client wrapper for the experimental <code>navigator.modelContextTesting</code> API.
          To use it, load these files as an "Unpacked Extension" in Chrome with the WebMCP flag enabled.
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
