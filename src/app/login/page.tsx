'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldAlert, KeyRound, User, Lock, Activity } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md relative group">
        
        {/* Decorative corner accents */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>

        <Card className="glass-panel overflow-hidden relative w-full border-primary/40 pt-2">
          
          {/* Animated top stripe */}
          <div className="absolute top-0 left-0 h-1 w-full bg-primary/20">
             <div className="h-full bg-primary w-1/3 animate-pulse shadow-[0_0_10px_#00ff00]"></div>
          </div>

          <CardHeader className="border-b border-primary/20 pb-6 pt-8">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl font-bold text-primary neon-text uppercase tracking-widest flex items-center gap-3">
                <Terminal className="h-6 w-6" /> ROOT_LOGIN
              </CardTitle>
              <div className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-[10px] uppercase tracking-widest animate-pulse flex items-center gap-2">
                <Activity className="w-3 h-3" /> Node Active
              </div>
            </div>
            <CardDescription className="text-primary/60 font-mono uppercase text-xs tracking-wider">
              Authenticate via SecureLockTS Sentinel Protocol
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold font-mono text-primary/80 uppercase flex items-center gap-2 tracking-widest">
                  <User className="h-4 w-4" /> Identification
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-primary/50 text-sm">{'>'}</span>
                  <Input
                    type="text"
                    className="bg-black/80 border-primary/40 text-primary h-12 pl-8 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary font-mono placeholder:text-primary/20 transition-all shadow-[inset_0_0_10px_rgba(0,255,0,0.05)]"
                    placeholder="ENTER_USERNAME"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold font-mono text-primary/80 uppercase flex items-center gap-2 tracking-widest">
                  <KeyRound className="h-4 w-4" /> Passcode
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-primary/50 text-sm">***</span>
                  <Input
                    type="password"
                    className="bg-black/80 border-primary/40 text-primary h-12 pl-10 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary font-mono placeholder:text-primary/20 transition-all shadow-[inset_0_0_10px_rgba(0,255,0,0.05)]"
                    placeholder="ENTER_PASSCODE"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-2 h-12 font-mono font-bold uppercase tracking-[0.2em] bg-primary/10 text-primary hover:bg-primary/30 border border-primary/60 transition-all group-hover:neon-border flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isAuthenticating ? (
                  <>
                    <Lock className="h-4 w-4 animate-spin opacity-50" /> Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Initialize Access
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]"></div>
              </Button>
            </form>

            {message && (
              <div className="mt-6">
                <Alert className={`border ${message.includes('Invalid') || message.includes('locked') || message.includes('error') ? 'bg-destructive/10 border-destructive/50 text-destructive shadow-[0_0_15px_rgba(255,0,0,0.2)]' : 'bg-primary/10 border-primary/50 text-primary neon-border flex items-start'}`}>
                  <ShieldAlert className={`h-5 w-5 mt-0.5 ${message.includes('Invalid') || message.includes('locked') || message.includes('error') ? 'stroke-destructive' : 'stroke-primary'}`} />
                  <div className="pl-2">
                    <AlertTitle className="font-mono uppercase tracking-widest font-bold text-xs mb-1">Authorization Event</AlertTitle>
                    <AlertDescription className="font-mono text-xs leading-relaxed">
                      {message}
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col items-start border-t border-primary/20 pt-5 pb-6 bg-black/40 mt-2">
            <p className="font-bold mb-3 text-primary uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Threat Vectors Detected:
            </p>
            <ul className="space-y-3 w-full">
              <li className="bg-primary/5 border border-primary/20 p-2 rounded text-xs text-primary/70 font-mono">
                <span className="text-primary font-bold uppercase">Brute-Force</span>
                <p className="mt-1 opacity-80">Repeatedly login with invalid passwords to trigger lockdown.</p>
              </li>
              <li className="bg-primary/5 border border-primary/20 p-2 rounded text-xs text-primary/70 font-mono">
                <span className="text-primary font-bold uppercase">SQLi Bypass</span>
                <p className="mt-1 opacity-80">Try <code className="bg-black text-primary px-1.5 py-0.5 rounded border border-primary/30 mx-1">admin'--</code> or <code className="bg-black text-primary px-1.5 py-0.5 rounded border border-primary/30 mx-1">' OR 1=1;</code></p>
              </li>
            </ul>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
