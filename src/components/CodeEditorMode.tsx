import React, { useState } from 'react';
import { X, Code2, Copy, Check, Download, Play } from 'lucide-react';

interface CodeEditorModeProps {
  onClose: () => void;
  isDark: boolean;
}

export const CodeEditorMode: React.FC<CodeEditorModeProps> = ({ onClose, isDark }) => {
  const [code, setCode] = useState('// Ketik kode Anda di sini...\n\nfunction helloWorld() {\n  console.log("Hello, ExeAi!");\n}\n\nhelloWorld();');
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'script.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = () => {
    try {
      // Basic sandboxed execution for demonstration
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };
      
      // eslint-disable-next-line no-new-func
      const func = new Function(code);
      func();
      
      console.log = originalConsoleLog;
      setOutput(logs.join('\\n') || 'Script dijalankan tanpa output.');
    } catch (err: any) {
      setOutput('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold tracking-wide">ExeCode Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRun} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-sm font-semibold transition-colors">
            <Play className="w-4 h-4" /> Run
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" /> Save
          </button>
          <button onClick={onClose} className="p-2 ml-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 p-4 bg-zinc-950 text-zinc-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-0"
          spellCheck="false"
        />
        
        {output !== null && (
          <div className="h-1/3 lg:h-full lg:w-1/3 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900 flex flex-col">
            <div className="px-4 py-2 border-b border-zinc-800 text-xs font-bold tracking-wider text-zinc-500 uppercase flex justify-between items-center">
              Output Console
              <button onClick={() => setOutput(null)} className="hover:text-zinc-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-zinc-300 whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
