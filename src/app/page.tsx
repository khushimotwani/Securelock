'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, Shield, Cpu, Activity, Server, AlertTriangle, ShieldAlert } from "lucide-react";

type LogEntry = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  ip: string;
};

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isSentinelActive, setIsSentinelActive] = useState(true);
  const [failCount, setFailCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memUsage, setMemUsage] = useState(34);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setIsLocked(data.isLockedDown);
        setFailCount(data.failCount);
        setIsSentinelActive(data.isSentinelActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      // Simulate resource jitter
      setCpuUsage(Math.floor(Math.random() * 15) + (isLocked ? 40 : 10));
      setMemUsage(Math.floor(Math.random() * 5) + (isLocked ? 60 : 30));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLocked]);

  const handleReset = async () => {
    await fetch('/api/status', { method: 'POST' });
    fetchStatus();
  };

  return (
    <div className="space-y-8 relative z-10 w-full max-w-6xl mx-auto">
      <div className="scanline"></div>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-primary/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary neon-text uppercase flex items-center gap-3">
            <Terminal className="h-8 w-8" /> System_Monitoring_
          </h1>
          <p className="text-primary/50 font-mono text-sm mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" /> Network Operations Center
          </p>
        </div>
        <Button
          onClick={handleReset}
          className="font-mono bg-primary/10 text-primary hover:bg-primary/20 border border-primary/50 transition-all uppercase tracking-widest text-xs h-10 px-6 neon-border"
        >
          Reset Environment
        </Button>
      </div>

      {/* Top Grid - Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Status Panel */}
        <Card className={`glass-panel overflow-hidden transition-all duration-500 border-l-4 ${isLocked ? 'border-destructive bg-destructive/5 lockdown-flash border-l-destructive' : 'border-primary/40 border-l-primary shadow-[0_0_30px_rgba(0,255,0,0.05)]'}`}>
          <CardContent className="p-8 h-full flex flex-col justify-center items-center relative">
            <div className="absolute top-4 right-4">
              {isLocked ? <ShieldAlert className="w-6 h-6 text-destructive animate-pulse" /> : <Shield className="w-6 h-6 text-primary/50" />}
            </div>
            <h2 className="text-xs font-bold font-mono tracking-[0.3em] text-primary/60 uppercase mb-4">Core Integrity</h2>
            
            {isLocked ? (
              <div className="flex flex-col items-center mt-2">
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4 neon-border !shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                  <span className="text-4xl">☠️</span>
                </div>
                <div className="text-destructive font-black text-3xl uppercase tracking-widest text-shadow-[0_0_10px_red]">
                  LOCKED
                </div>
                <p className="text-[10px] text-destructive/80 mt-3 font-mono uppercase tracking-widest bg-destructive/10 px-3 py-1 rounded border border-destructive/30 text-center">
                  Critical Threshold Breached<br/>All traffic blocked
                </p>
              </div>
            ) : !isSentinelActive ? (
               <div className="flex flex-col items-center mt-2">
                 <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,0,0.2)]">
                   <AlertTriangle className="w-10 h-10 text-yellow-500 animate-pulse" />
                 </div>
                 <div className="text-yellow-500 font-black text-2xl uppercase tracking-widest text-shadow-[0_0_10px_yellow]">
                   VULNERABLE
                 </div>
                 <p className="text-[10px] text-yellow-500/80 mt-3 font-mono uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded border border-yellow-500/30 text-center">
                   Sentinel Engine Offline<br/>Raw Endpoints Exposed
                 </p>
               </div>
            ) : (
               <div className="flex flex-col items-center mt-2">
                 <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 transition-all duration-1000">
                   <Shield className="w-10 h-10 text-primary neon-text" />
                 </div>
                 <div className="text-primary font-black text-3xl uppercase tracking-widest neon-text">
                   SECURE
                 </div>
                 <p className="text-[10px] text-primary/80 mt-3 font-mono uppercase tracking-widest bg-primary/5 px-3 py-1 rounded border border-primary/20 text-center">
                   Sentinel Engine Online<br/>Traffic Monitored
                 </p>
               </div>
            )}
          </CardContent>
        </Card>

        {/* Threat Intel Panel */}
        <Card className="glass-panel lg:col-span-2 relative overflow-hidden border-primary/40">
          <div className="absolute opacity-5 top-[-10%] right-[-5%] w-64 h-64 font-mono text-primary select-none pointer-events-none">
            <Server className="w-full h-full" />
          </div>
          
          <CardHeader className="border-b border-primary/10 pb-4">
            <CardTitle className="text-sm font-bold font-mono text-primary/80 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="w-4 h-4" /> Threat Intel Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col p-4 bg-black/40 rounded border border-primary/10 relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 h-1 bg-primary/50 transition-all duration-500`} style={{width: `${(failCount/3)*100}%`}}></div>
                <span className="text-[10px] text-primary/50 font-mono uppercase tracking-widest mb-1">Anomalies</span>
                <div className="text-4xl font-bold text-primary neon-text flex items-baseline gap-1">
                  {failCount} <span className="text-sm text-primary/40">/ 3</span>
                </div>
              </div>
              
              <div className="flex flex-col p-4 bg-black/40 rounded border border-primary/10">
                <span className="text-[10px] text-primary/50 font-mono uppercase tracking-widest mb-1">Defensive Posture</span>
                <div className="mt-1 flex items-center h-full">
                  <Badge className={`bg-black border transition-all duration-300 font-mono text-[10px] tracking-wider py-1 ${isLocked ? 'border-destructive text-destructive shadow-[0_0_10px_red]' : 'border-primary text-primary'}`}>
                    {isLocked ? 'ISOLATION ACTIVE' : 'MONITORING'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-black/40 rounded border border-primary/10">
                <span className="text-[10px] text-primary/50 font-mono uppercase tracking-widest mb-1 flex items-center gap-1"><Cpu className="w-3 h-3"/> CPU Load</span>
                <div className="text-2xl font-bold text-primary/80 font-mono mt-1">{cpuUsage}%</div>
                <div className="w-full bg-black/80 h-1 mt-2 rounded overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-500" style={{width: `${cpuUsage}%`}}></div>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-black/40 rounded border border-primary/10">
                <span className="text-[10px] text-primary/50 font-mono uppercase tracking-widest mb-1">MEM Load</span>
                <div className="text-2xl font-bold text-primary/80 font-mono mt-1">{memUsage}%</div>
                <div className="w-full bg-black/80 h-1 mt-2 rounded overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-500" style={{width: `${memUsage}%`}}></div>
                </div>
              </div>
            </div>

            {isLocked && (
               <div className="mt-6 p-4 bg-destructive/10 text-destructive border border-destructive/50 text-xs font-mono uppercase tracking-widest flex items-start gap-3 rounded shadow-[inset_0_0_20px_rgba(255,0,0,0.1)]">
                 <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                 <p className="leading-relaxed">Critical threshold exceeded. Attack signatures matched. All application endpoints are locked. Incoming traffic blackholed.</p>
               </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Terminal Event Log */}
      <Card className="glass-panel overflow-hidden mt-8 border-primary/40">
        <div className="p-4 border-b border-primary/20 bg-primary/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#00ff00]"></span>
            <h2 className="text-sm font-bold font-mono tracking-[0.2em] text-primary uppercase">Syslog_Live_Feed</h2>
          </div>
          <span className="text-[10px] font-mono text-primary/40 uppercase">Filtering: Critical & Security</span>
        </div>
        
        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
          <div className="divide-y divide-primary/10">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-primary/30 font-mono text-sm uppercase tracking-widest">
                <Activity className="w-8 h-8 mx-auto mb-4 opacity-20" />
                Listening for incoming telemetry...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-primary/5 transition-colors border-l-2 border-transparent hover:border-primary group">
                  <div className="flex-shrink-0 mt-1 w-8 flex justify-center text-lg">
                    {log.type === 'SYSTEM_LOCKDOWN' && <span className="drop-shadow-[0_0_8px_red]">🚨</span>}
                    {log.type === 'NORMAL' && <span>✅</span>}
                    {(log.type === 'SQL_INJECTION' || log.type === 'COMMAND_INJECTION' || log.type === 'LOGIN_ATTEMPT') && <span className="drop-shadow-[0_0_8px_yellow]">⚠️</span>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded ${log.type === 'SYSTEM_LOCKDOWN' ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {log.type.replace('_', ' ')}
                      </p>
                      <span className="text-[10px] text-primary/40 font-mono">{log.id}</span>
                    </div>
                    <p className="text-sm text-primary/80 break-all font-mono mt-1 group-hover:text-primary transition-colors">
                      {log.message}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 text-right space-y-2">
                    <p className="text-[10px] text-primary/50 font-mono tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p className="bg-black border border-primary/20 px-2 py-1 rounded text-[10px] text-primary/70 font-mono">{log.ip}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
