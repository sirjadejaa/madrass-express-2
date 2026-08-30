export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-black min-h-screen print:bg-white print:m-0 print:p-0">
      {/* We inject some global print styles directly for this route */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { 
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            margin: 0;
          }
        }
      `}} />
      {children}
    </div>
  );
}
