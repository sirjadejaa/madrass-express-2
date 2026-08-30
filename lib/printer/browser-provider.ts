"use client";

import { PrinterConfig, PrintReceiptPayload, PrinterProvider } from "./provider";

export class BrowserPrinterProvider implements PrinterProvider {
  async printReceipt(payload: PrintReceiptPayload, config: PrinterConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // In a browser environment, we open the receipt in a hidden iframe or new window 
      // and call window.print().
      // For simplicity in modern React, we can open a popup specifically formatted for the printer width,
      // and trigger print there.
      
      const width = config.paperWidth === 58 ? 300 : 400; // rough px translation for popups
      const printWindow = window.open(
        `/receipt/${payload.orderId}`,
        "PrintReceipt",
        `width=${width},height=600,toolbar=no,scrollbars=no,resizable=no`
      );

      if (!printWindow) {
        return { success: false, error: "Popup blocked. Could not open print window." };
      }

      // The new window will run window.print() automatically via its own client script.
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export const browserPrinter = new BrowserPrinterProvider();
