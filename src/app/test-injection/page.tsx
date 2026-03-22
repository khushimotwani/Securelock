'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TerminalSquare, BugPlay, Code, FileTerminal, ArrowRight } from "lucide-react";

export default function InjectionTestPage() {
  const [cmd, setCmd] = useState('');
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    setResult('');
    setErrorMsg('');
    
    setTimeout(async () => {
      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cmd }),
        });
        
        const data = await res.json();
        if (res.ok) {
          setResult(data.output || 'Command executed empty result.');
        } else {
          setErrorMsg(data.error);
        }
      } catch (e) {
        setErrorMsg('Network anomaly detected. System locked or unreachable.');
      } finally {
        setIsExecuting(false);
      }
    }, 500);
  };

  const handleQuickInject = (exploit: string) => {
    setCmd(exploit);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 font-sans">
      <Card className="glass-panel w-full max-w-3xl border-slate-700/50 relative overflow-hidden group bg-slate-900/60 shadow-2xl">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -z-10 group-hover:bg-indigo-500/10 transition-colors duration-1000"></div>

        <CardHeader className="border-b border-slate-800 pb-5 pt-8 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-3">
              <TerminalSquare className="h-6 w-6 text-indigo-400" /> Enterprise Diagnostics
            </CardTitle>
            <div className="flex gap-2 opacity-60">
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
            </div>
          </div>
          <CardDescription className="text-slate-400 text-sm mt-3">
            Secure SSH Tunnel configured for root diagnostic tracing. Authorized users only.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 px-8">
          <form onSubmit={handleExecute} className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" /> System Command Query
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group/input">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800/80 border-r border-slate-700 flex items-center justify-center text-slate-400 z-10 rounded-l-md font-mono">
                    <FileTerminal className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    className="bg-slate-950/50 border-slate-700 text-slate-200 h-12 pl-16 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 font-mono placeholder:text-slate-600 transition-all text-sm rounded-md shadow-inner"
                    placeholder="E.g. ping 10.0.0.1 -c 4"
                    value={cmd}
                    onChange={(e) => setCmd(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isExecuting}
                  className="h-12 px-6 font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all sm:w-auto w-full group/btn shadow-lg"
                >
                  {isExecuting ? 'Tracing...' : (
                    <span className="flex items-center gap-2">
                      Run Trace <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {(result || errorMsg) && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Alert className={`border relative overflow-hidden flex items-start gap-4 ${errorMsg ? 'bg-red-950/30 border-red-500/30 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>
                
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${errorMsg ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                
                <div className={`p-2 rounded bg-black/40 border ${errorMsg ? 'border-red-500/20' : 'border-slate-700'}`}>
                   <BugPlay className={`h-5 w-5 ${errorMsg ? 'stroke-red-400' : 'stroke-slate-400'}`} />
                </div>
                
                <div className="flex-1">
                  <AlertTitle className="text-xs font-semibold mb-2 opacity-70">
                    {errorMsg ? 'System Exception' : 'Trace Output'}
                  </AlertTitle>
                  <AlertDescription className="font-mono whitespace-pre-wrap mt-1 overflow-x-auto text-[13px] leading-relaxed min-h-[60px] max-h-64 overflow-y-auto">
                    {errorMsg || result}
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start border-t border-slate-800 pt-6 mt-4 bg-slate-950/40">
          <p className="font-medium mb-4 text-slate-400 text-xs flex items-center gap-2">
             Recent Commands List
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-xs font-mono text-slate-400">
            <button type="button" onClick={() => handleQuickInject('ping 127.0.0.1')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>ping localhost</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-indigo-400" />
            </button>
            <button type="button" onClick={() => handleQuickInject('whoami')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>whoami (check auth)</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-indigo-400" />
            </button>
            <button type="button" onClick={() => handleQuickInject('ls -la')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>ls -la (directory)</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-indigo-400" />
            </button>
            <button type="button" onClick={() => handleQuickInject('cat /etc/os-release')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>cat system-info.txt</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-indigo-400" />
            </button>
          </div>
          <p className="mt-5 text-[11px] text-slate-500 font-sans text-center w-full">
            All administrative traces are continuously logged by the Enterprise Sentinel.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
