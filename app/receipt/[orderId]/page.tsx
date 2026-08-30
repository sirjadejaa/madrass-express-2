import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReceiptClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: {
      token: true,
      table: true,
      restaurant: {
        include: {
          settings: true,
          printers: {
            where: { type: "RECEIPT" }
          }
        }
      },
      payment: true,
      items: {
        include: {
          product: true,
          options: {
            include: {
              option: true
            }
          }
        }
      }
    }
  });

  if (!order || !order.token) {
    return notFound();
  }

  const printer = order.restaurant.printers[0];
  const paperWidth = printer?.paperWidth || 80;
  
  // Calculate subtotal and tax based on settings
  const taxPercent = order.restaurant.settings?.taxPercent || 0;
  // Let's assume order.totalAmount has tax included or tax is calculated from it.
  // Wait, in previous step we computed subtotal and tax. Let's recalculate for display.
  let subtotal = 0;
  order.items.forEach(item => {
    let itemPrice = Number(item.price);
    item.options.forEach(opt => {
      itemPrice += Number(opt.price) * opt.quantity;
    });
    subtotal += itemPrice * item.quantity;
  });
  
  const taxAmount = (subtotal * taxPercent) / 100;

  return (
    <ReceiptClient 
      order={order as any} // Cast safely since we include what we need
      subtotal={subtotal}
      taxAmount={taxAmount}
      taxPercent={taxPercent}
      paperWidth={paperWidth}
      footer={printer?.receiptFooter}
    />
  );
}
