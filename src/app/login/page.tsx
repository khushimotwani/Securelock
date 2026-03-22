'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldAlert, KeyRound, User, Lock, Activity, Cloud } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setMessage('');
    
    // Fake typing/processing delay for awesome hacky feel
    setTimeout(async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await res.json();
        if (res.ok) {
          setMessage(data.message);
        } else {
          setMessage(data.error);
        }
      } catch (e) {
        setMessage('Network error or system locked.');
      } finally {
        setIsAuthenticating(false);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 font-sans">
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-[420px]">
        
        <Card className="glass-panel overflow-hidden relative w-full border-slate-700/50 bg-slate-900/60 shadow-2xl shadow-indigo-500/10">
          
          <CardHeader className="border-b border-slate-800 pb-8 pt-10 text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold text-white tracking-tight">
              Sign in to The Securelock
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm mt-2">
              Welcome back. Enter your credentials to access the enterprise gateway.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 px-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  Corporate ID
                </label>
                <Input
                  type="text"
                  className="bg-slate-950/50 border-slate-700 text-white h-11 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 placeholder:text-slate-600 transition-all text-sm"
                  placeholder="name@company.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">Forgot password?</span>
                </div>
                <Input
                  type="password"
                  className="bg-slate-950/50 border-slate-700 text-white h-11 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 placeholder:text-slate-600 transition-all text-sm tracking-widest"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-4 h-11 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <Lock className="h-4 w-4 animate-spin opacity-70" /> Verifying...
                  </>
                ) : (
                  'Continue securely'
                )}
              </Button>
              
              <div className="relative flex items-center justify-center py-4">
                 <div className="absolute border-t border-slate-800 w-full"></div>
                 <span className="bg-slate-900 px-3 text-xs text-slate-500 relative z-10">Or continue with</span>
              </div>
              
              <Button type="button" variant="outline" className="w-full h-11 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Single Sign-On (SAML)
              </Button>
            </form>

            {message && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Alert className={`border ${message.includes('Invalid') || message.includes('locked') || message.includes('error') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  <ShieldAlert className={`h-4 w-4 mt-0.5 ${message.includes('Invalid') || message.includes('locked') || message.includes('error') ? 'stroke-red-400' : 'stroke-emerald-400'}`} />
                  <div className="pl-2">
                    <AlertTitle className="font-semibold text-sm mb-1">Status</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed opacity-90">
                      {message}
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-slate-800 py-6 bg-slate-950/30">
             <p className="text-xs text-slate-500 text-center">
               Protected by The Securelock Advanced Threat Analytics<br/>
               <span className="opacity-50">IP Logged for Corporate Compliance</span>
             </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
