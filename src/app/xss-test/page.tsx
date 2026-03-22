'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code2, Bug, Globe, ArrowRight, ShieldAlert } from "lucide-react";

export default function XSSTestPage() {
  const [html, setHtml] = useState('');
  const [rendered, setRendered] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRendered('');
    setErrorMsg('');

    setTimeout(async () => {
      try {
        const res = await fetch('/api/xss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html }),
        });

        const data = await res.json();
        if (res.ok) {
          setRendered(data.rendered || '');
        } else {
          setErrorMsg(data.error);
        }
      } catch (e) {
        setErrorMsg('Network anomaly detected. System locked or unreachable.');
      } finally {
        setIsSubmitting(false);
      }
    }, 500);
  };

  const handleQuickInject = (payload: string) => {
    setHtml(payload);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 font-sans">
      <Card className="glass-panel w-full max-w-3xl border-slate-700/50 relative overflow-hidden group bg-slate-900/60 shadow-2xl">

        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] -z-10 group-hover:bg-rose-500/10 transition-colors duration-1000"></div>

        <CardHeader className="border-b border-slate-800 pb-5 pt-8 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-3">
              <Code2 className="h-6 w-6 text-rose-400" /> XSS Vulnerability Lab
            </CardTitle>
            <div className="flex gap-2 opacity-60">
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
            </div>
          </div>
          <CardDescription className="text-slate-400 text-sm mt-3">
            Cross-Site Scripting (CWE-79) test environment. Submit HTML payloads to observe reflected rendering behavior.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-400" /> HTML Payload
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group/input">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800/80 border-r border-slate-700 flex items-center justify-center text-slate-400 z-10 rounded-l-md font-mono">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    className="bg-slate-950/50 border-slate-700 text-slate-200 h-12 pl-16 focus-visible:ring-rose-500 focus-visible:ring-offset-0 font-mono placeholder:text-slate-600 transition-all text-sm rounded-md shadow-inner"
                    placeholder='E.g. <b>Hello World</b>'
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-6 font-medium bg-rose-600 text-white hover:bg-rose-500 transition-all sm:w-auto w-full group/btn shadow-lg"
                >
                  {isSubmitting ? 'Rendering...' : (
                    <span className="flex items-center gap-2">
                      Render <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Rendered Output Panel */}
          {(rendered || errorMsg) && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {errorMsg ? (
                <Alert className="border relative overflow-hidden flex items-start gap-4 bg-red-950/30 border-red-500/30 text-red-400">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="p-2 rounded bg-black/40 border border-red-500/20">
                    <ShieldAlert className="h-5 w-5 stroke-red-400" />
                  </div>
                  <div className="flex-1">
                    <AlertTitle className="text-xs font-semibold mb-2 opacity-70">Sentinel Intercept</AlertTitle>
                    <AlertDescription className="font-mono whitespace-pre-wrap mt-1 overflow-x-auto text-[13px] leading-relaxed">
                      {errorMsg}
                    </AlertDescription>
                  </div>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {/* Raw Source View */}
                  <div className="bg-slate-950/80 border border-slate-700 rounded-md p-4">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Raw HTML Source</p>
                    <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap break-all">{rendered}</pre>
                  </div>

                  {/* Rendered View — THIS IS THE VULNERABLE PART */}
                  <div className="bg-slate-950/80 border border-amber-500/30 rounded-md p-4 relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Bug className="w-3.5 h-3.5 text-amber-400" />
                      <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">Live DOM Render (Vulnerable)</p>
                    </div>
                    <div
                      className="font-mono text-sm text-white"
                      dangerouslySetInnerHTML={{ __html: rendered }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start border-t border-slate-800 pt-6 mt-4 bg-slate-950/40">
          <p className="font-medium mb-4 text-slate-400 text-xs flex items-center gap-2">
            Common XSS Payloads
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-xs font-mono text-slate-400">
            <button type="button" onClick={() => handleQuickInject('<script>alert("XSS")</script>')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>&lt;script&gt;alert&lt;/script&gt;</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-rose-400" />
            </button>
            <button type="button" onClick={() => handleQuickInject('<img src=x onerror=alert("XSS")>')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>&lt;img onerror=alert()&gt;</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-rose-400" />
            </button>
            <button type="button" onClick={() => handleQuickInject('<svg onload=alert("XSS")>')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>&lt;svg onload=alert()&gt;</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-rose-400" />
            </button>
            <button type="button" onClick={() => handleQuickInject('<b>Safe Bold Text</b>')} className="text-left bg-slate-900 border border-slate-800 px-3 py-2 rounded hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-colors flex items-center justify-between group/cmd">
              <span><code>&lt;b&gt;Safe Bold Text&lt;/b&gt;</code></span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover/cmd:opacity-100 transition-opacity text-rose-400" />
            </button>
          </div>
          <p className="mt-5 text-[11px] text-slate-500 font-sans text-center w-full">
            All payloads are logged and analyzed by the Sentinel AI engine when active.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
