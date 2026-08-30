export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  // Minimal, fullscreen, high-contrast layout
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-primary-foreground overflow-hidden">
      {children}
    </div>
  );
}
