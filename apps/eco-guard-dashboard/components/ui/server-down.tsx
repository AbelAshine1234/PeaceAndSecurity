"use client";

import { AlertCircle, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "./button";

export function ServerDown() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl">
      <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-destructive/10 rounded-full group">
          <WifiOff className="h-12 w-12 text-destructive transition-transform group-hover:scale-110 duration-300" />
          <div className="absolute top-0 right-0 h-8 w-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-50 dark:border-slate-950">
            <AlertCircle className="h-4 w-4 text-destructive fill-destructive/20" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Connection Lost
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            We're unable to connect to the backend server. The system is
            temporarily unavailable for security reasons.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-400 dark:text-slate-500 text-left">
          <p>ERROR: BACKEND_CONNECTION_FAILED</p>
          <p>STATUS: UNREACHABLE</p>
          <p>SECURITY: FORCED_BLOCK_ACTIVE</p>
        </div>

        <Button
          onClick={handleReload}
          className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
        >
          <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
          Retry Connection
        </Button>

        <p className="text-[10px] uppercase tracking-widest font-black text-slate-300 dark:text-slate-600">
          EcoGuard Security Protocol v1.0
        </p>
      </div>
    </div>
  );
}
