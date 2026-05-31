import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 md:p-20 text-center border border-dashed border-slate-100 rounded-3xl dark:border-slate-800 space-y-5 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xs transition-colors duration-300">
      <div className="p-4.5 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100/30 dark:border-blue-900/20 shadow-xs animate-bounce-subtle">
        <Icon className="h-8 w-8 shrink-0" />
      </div>
      
      <div className="max-w-md space-y-1.5">
        <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base md:text-lg">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <Button
          onClick={onAction}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
