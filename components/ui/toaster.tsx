"use client"

import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <div key={id} className={`pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all mb-2 ${variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>
            <div className="grid gap-1">
              {title && <div className="text-sm font-semibold">{title}</div>}
              {description && (
                <div className="text-sm opacity-90">{description}</div>
              )}
            </div>
            {action}
            <button onClick={() => dismiss(id)} className="absolute right-2 top-2 rounded-md p-1 opacity-50 hover:opacity-100">X</button>
          </div>
        )
      })}
    </div>
  )
}
