'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowUpRight, Cloud, CreditCard, ShieldCheck, Users, Zap } from "lucide-react";

export default function CorporateDashboard() {
  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-slate-200 mt-4">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3 font-sans">
            <Cloud className="w-8 h-8 text-primary" /> The Securelock Console
          </h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" /> All systems operational. Connected to US-East (Virginia).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert('Feature access restricted in Demo Environment.')} className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors px-4 py-2 rounded-md text-sm font-medium">
            Deploy New Cluster
          </button>
          <button onClick={() => alert('Billing portal currently offline for maintenance.')} className="bg-primary text-white hover:bg-primary/90 transition-colors px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/25">
            <Zap className="w-4 h-4 fill-white" /> Upgrade Plan
          </button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Revenue" value="$482,901.55" trend="+14.2%" icon={CreditCard} />
        <MetricCard title="Active Users" value="24,931" trend="+5.4%" icon={Users} />
        <MetricCard title="Cloud Compute" value="84% Load" trend="-2.1%" icon={Zap} />
        <MetricCard title="Security Status" value="Secure" trend="Protected" icon={ShieldCheck} isSecure />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fake Transaction Chart */}
        <Card className="glass-panel lg:col-span-2 border-slate-800/60 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-100 font-sans">Transaction Volume (30 Days)</CardTitle>
            <CardDescription className="text-slate-400">Real-time processing metrics for Q3.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-end gap-2 pb-4 pt-8">
            {/* Fake responsive bar chart using css heights */}
            {[40, 60, 45, 80, 50, 90, 65, 85, 100, 75, 55, 60, 45, 85].map((height, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors relative group" style={{ height: `${height}%` }}>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">
                    ${(height * 1.4).toFixed(1)}k
                 </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="glass-panel border-slate-800/60 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-100 font-sans">Recent Transfers</CardTitle>
            <CardDescription className="text-slate-400">Last 24 hours of activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ActivityRow name="Stripe Payout" amount="+$12,450.00" date="2 mins ago" />
              <ActivityRow name="AWS Invoice" amount="-$3,200.50" date="1 hr ago" isExpense />
              <ActivityRow name="Wire Transfer (UK)" amount="+$8,900.00" date="4 hrs ago" />
              <ActivityRow name="Payroll Processing" amount="-$45,000.00" date="5 hrs ago" isExpense />
              <ActivityRow name="Enterprise Subscription" amount="+$9,999.00" date="12 hrs ago" />
            </div>
            <button onClick={() => alert('End of query list reached.')} className="w-full mt-6 py-2 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 border border-primary/20 rounded hover:bg-primary/5">
              View All Transactions <ArrowUpRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, isExpense = false, isSecure = false }: any) {
  return (
    <Card className="glass-panel border-slate-800/60 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg ${isSecure ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className={`${isExpense ? 'text-red-400' : isSecure ? 'text-emerald-400' : 'text-emerald-400'} font-medium`}>{trend}</span>
          <span className="text-slate-500 ml-2">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ name, amount, date, isExpense = false }: any) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-200">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{date}</p>
      </div>
      <div className={`text-sm font-medium ${isExpense ? 'text-slate-300' : 'text-emerald-400'}`}>
        {amount}
      </div>
    </div>
  );
}
