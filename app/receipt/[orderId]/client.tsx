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
    <div className={`mx-auto w-full ${widthClass} text-black font-mono text-xs p-4 print:p-0`}>
      
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold uppercase">{order.restaurant.name}</h1>
        {order.restaurant.settings?.currency === "INR" && (
          <div className="text-[10px] mt-1">GST INCLUDED WHERE APPLICABLE</div>
        )}
        <div className="text-[10px] mt-1">{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}</div>
      </div>

      <div className="border-t border-b border-black border-dashed py-2 mb-4 text-center">
        <div className="text-sm font-bold uppercase">{order.type.replace('_', ' ')}</div>
        {order.tableId && <div className="text-sm font-bold">TABLE {order.table.number}</div>}
        <div className="text-3xl font-black mt-1">#{order.token.tokenNumber}</div>
        <div className="text-[9px] text-gray-600 mt-1">ORD: {order.id.split('-').pop()}</div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-2">
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
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <span className="font-bold">{item.quantity}x</span> {item.product.name}
                </div>
                <div>{itemTotal.toFixed(2)}</div>
              </div>
              
              {/* Customizations */}
              {item.options.length > 0 && (
                <div className="text-[10px] pl-4 text-gray-700">
                  {item.options.map((opt: any) => (
                    <div key={opt.id} className="flex justify-between">
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
      <div className="border-t border-black pt-2 mb-4">
        <div className="flex justify-between mb-1">
          <span>Subtotal</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-1 text-[10px]">
          <span>Tax ({taxPercent}%)</span>
          <span>{taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-black pt-1 mt-1">
          <span>TOTAL</span>
          <span>{Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Status */}
      <div className="border-t border-b border-black border-dashed py-3 mb-4 text-center">
        {order.payment?.status === "PAY_AT_COUNTER" ? (
          <div>
            <div className="font-bold text-lg">PAYMENT DUE</div>
            <div className="text-sm">PAY AT COUNTER</div>
          </div>
        ) : order.payment?.status === "PAID" ? (
          <div>
            <div className="font-bold text-lg">PAID</div>
            <div className="text-sm">VIA {order.payment?.method}</div>
          </div>
        ) : (
          <div>
            <div className="font-bold text-lg">{order.payment?.status}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px]">
        {footer ? (
          <div className="whitespace-pre-wrap">{footer}</div>
        ) : (
          <div>Thank you for dining with us!<br/>Have a great day!</div>
        )}
      </div>

    </div>
  );
}
