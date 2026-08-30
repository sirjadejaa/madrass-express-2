export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  // Dark/High-contrast UI for operational environment
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-primary selection:text-primary-foreground">
      {children}
    </div>
  );
}
