export interface PrinterConfig {
  name: string;
  type: string;
  paperWidth: number; // e.g. 80 or 58
  ipAddress?: string | null;
  autoPrint: boolean;
  receiptFooter?: string | null;
}

export interface PrintReceiptPayload {
  orderId: string;
}

export interface PrinterProvider {
  /**
   * Attempts to print the given order ID using the specified configuration.
   * If the provider relies on a client-side execution (like opening the browser print dialog),
   * this might just format the payload and trigger the client flow.
   */
  printReceipt(payload: PrintReceiptPayload, config: PrinterConfig): Promise<{ success: boolean; error?: string }>;
}
