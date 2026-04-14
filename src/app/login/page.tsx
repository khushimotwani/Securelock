'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, LogIn, ShieldAlert, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('');
    setIsError(false);
    setIsSuccess(false);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        redirect: 'manual', // Don't auto-follow redirects — we handle rickroll ourselves
      });

      // Banned IP → rickroll redirect (302)
      if (res.type === 'opaqueredirect' || res.status === 0) {
        window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setStatus(data.message || 'Login successful');
        setTimeout(() => window.location.href = '/sentinel', 1000);
      } else {
        setIsError(true);
        setStatus(data.error || 'Authentication failed.');
      }
    } catch {
      setIsError(true);
      setStatus('Network error. Service may be unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-10 px-4">
      <Card className="w-full max-w-md border-gray-200 bg-white shadow-lg rounded-sm overflow-hidden">
        <CardHeader className="border-b border-gray-200 pb-5 pt-8 bg-[hsl(213,62%,22%)] text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded bg-white/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-white" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
            Administrator Sign In
          </CardTitle>
          <CardDescription className="text-blue-100/60 text-sm mt-1">
            Authorized personnel only. All attempts are logged.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white border-gray-300 text-gray-800 h-11 rounded-sm focus-visible:ring-blue-700 placeholder:text-gray-400"
                placeholder="admin"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-gray-300 text-gray-800 h-11 rounded-sm focus-visible:ring-blue-700 placeholder:text-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[hsl(213,62%,22%)] text-white hover:bg-[hsl(213,62%,28%)] transition-all font-semibold rounded-sm"
            >
              {isSubmitting ? 'Authenticating...' : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </span>
              )}
            </Button>
          </form>

          {status && (
            <div className="mt-6">
              {isSuccess ? (
                <Alert className="bg-emerald-50 border-emerald-300 text-emerald-800 rounded-sm">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold">Access Granted</AlertTitle>
                  <AlertDescription className="text-sm">Redirecting to Sentinel Core...</AlertDescription>
                </Alert>
              ) : isError ? (
                <Alert className="bg-red-50 border-red-300 text-red-800 rounded-sm">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold">Access Denied</AlertTitle>
                  <AlertDescription className="text-sm">{status}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-6">
            This portal is for blog administrators only. Unauthorized access attempts are monitored.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
