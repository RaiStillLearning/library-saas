"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 md:p-24 min-h-[50vh] text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-rose-100/50 dark:border-rose-950/20 max-w-2xl mx-auto my-8">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-xs">
            <AlertTriangle className="h-10 w-10 shrink-0" />
          </div>
          
          <div className="space-y-2.5 max-w-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {this.state.error?.message || "An unexpected error occurred while loading this section."}
            </p>
          </div>

          <Button
            onClick={this.handleReset}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Page</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
