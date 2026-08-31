"use client"

import { useToast } from "./use-toast"
import { X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

function ToastItem({ 
  toast, 
  dismiss 
}: { 
  toast: any, 
  dismiss: (id: string) => void 
}) {
  const { id, title, description, action, variant, open, ...props } = toast;
  const isDestructive = variant === 'destructive' || (props as any).type === 'error';

  useEffect(() => {
    if (!open) return;
    
    let duration = 3000;
    if (isDestructive) duration = 4000;
    if ((props as any).type === 'warning') duration = 3000;
    if (action) duration = Infinity; // Don't auto-dismiss if there's an action

    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, isDestructive, action, (props as any).type, id, dismiss]);

  return (
    <div 
      className={`pointer-events-auto flex w-full items-start justify-between space-x-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all duration-300 ease-out ${
        open ? 'animate-in fade-in slide-in-from-top-4 md:slide-in-from-bottom-4 sm:slide-in-from-right-8' : 'animate-out fade-out slide-out-to-right-8 opacity-0'
      } ${
        isDestructive 
          ? 'bg-red-600 text-white border-red-700' 
          : 'bg-white text-zinc-950 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-50'
      }`}
    >
      <div className="grid gap-1 flex-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      <button 
        onClick={() => dismiss(id)} 
        className={`shrink-0 rounded-md p-1 transition-opacity opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 ${
          isDestructive ? 'hover:bg-red-700' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const pathname = usePathname()

  // Clear all notifications on route change
  useEffect(() => {
    dismiss()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <div className="fixed z-[100] flex flex-col gap-2 p-4 w-full md:max-w-[400px] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 top-16 md:top-auto md:bottom-4 max-h-screen overflow-hidden pointer-events-none" style={{ width: "calc(100% - 32px)" }}>
      {toasts.map(function (toast) {
        return <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
      })}
    </div>
  )
}
