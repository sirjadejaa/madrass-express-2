"use client";

import { useEffect } from "react";
import { format } from "date-fns";

export function ReceiptClient({ order, subtotal, taxAmount, taxPercent, paperWidth, footer }: any) {
  
  // Trigger print automatically on mount since this route is only used for printing
  useEffect(() => {
    // A small timeout to ensure fonts/layout render
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const widthClass = paperWidth === 58 ? "max-w-[58mm]" : "max-w-[80mm]";

  return (
    <div className={`mx-auto w-full ${widthClass} text-black font-mono text-[11px] p-4 print:p-0 leading-tight`}>
      
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="text-2xl font-black uppercase mb-1 tracking-wider">{order.restaurant.name}</h1>
        {order.restaurant.settings?.currency === "INR" && (
          <div className="text-[10px] font-medium tracking-wide">GST INCLUDED WHERE APPLICABLE</div>
        )}
        <div className="text-[10px] mt-1 text-gray-800">{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}</div>
      </div>

      <div className="border-y-2 border-black border-dashed py-3 mb-5 text-center">
        <div className="text-sm font-bold uppercase tracking-widest">{order.type.replace('_', ' ')}</div>
        {order.tableId && <div className="text-sm font-bold tracking-widest">TABLE {order.table.number}</div>}
        <div className="text-4xl font-black mt-2 mb-1 tracking-tighter">#{order.token.tokenNumber}</div>
        <div className="text-[10px] text-gray-700 tracking-wider">ORD: {order.id.split('-').pop()}</div>
      </div>

      {/* Items */}
      <div className="mb-5">
        <div className="flex justify-between font-bold border-b-2 border-black pb-1.5 mb-2.5 text-xs">
          <span>ITEM</span>
          <span>AMT</span>
        </div>
        
        {order.items.map((item: any) => {
          const itemBasePrice = Number(item.price);
          let optionsTotal = 0;
          item.options.forEach((opt: any) => {
            optionsTotal += Number(opt.price) * opt.quantity;
          });
          const itemTotal = (itemBasePrice + optionsTotal) * item.quantity;

          return (
            <div key={item.id} className="mb-3">
              <div className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-2 leading-tight">
                  <span className="font-bold mr-1">{item.quantity}x</span> 
                  <span className="font-semibold">{item.product.name}</span>
                </div>
                <div className="font-semibold">{itemTotal.toFixed(2)}</div>
              </div>
              
              {/* Customizations */}
              {item.options.length > 0 && (
                <div className="text-[11px] pl-5 mt-0.5 text-gray-800">
                  {item.options.map((opt: any) => (
                    <div key={opt.id} className="flex justify-between leading-tight">
                      <span>+ {opt.option.name} {opt.quantity > 1 ? `(x${opt.quantity})` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t-2 border-black pt-2.5 mb-5">
        <div className="flex justify-between mb-1.5 text-xs">
          <span>Subtotal</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-1.5 text-xs">
          <span>Tax ({taxPercent}%)</span>
          <span>{taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-xl border-t-2 border-black pt-2 mt-2">
          <span>TOTAL</span>
          <span>{Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Status */}
      <div className="border-y-2 border-black border-dashed py-3.5 mb-5 text-center">
        {order.payment?.status === "PAY_AT_COUNTER" ? (
          <div>
            <div className="font-black text-xl tracking-widest uppercase">PAYMENT DUE</div>
            <div className="text-xs font-bold tracking-widest mt-1">PAY AT COUNTER</div>
          </div>
        ) : order.payment?.status === "PAID" ? (
          <div>
            <div className="font-black text-xl tracking-widest uppercase">PAID</div>
            <div className="text-xs font-bold tracking-widest mt-1 uppercase">VIA {order.payment?.method}</div>
          </div>
        ) : (
          <div>
            <div className="font-black text-xl tracking-widest uppercase">{order.payment?.status}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-medium tracking-wide">
        {footer ? (
          <div className="whitespace-pre-wrap leading-tight">{footer}</div>
        ) : (
          <div className="leading-tight">Thank you for dining with us!<br/>Have a great day!</div>
        )}
      </div>

    </div>
  );
}
