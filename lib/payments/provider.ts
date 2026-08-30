import { Order, PaymentMethod, PaymentStatus } from "@prisma/client";

export interface PaymentIntentResponse {
  success: boolean;
  providerTransactionId?: string;
  qrCodeUrl?: string;     // URL to image or UPI URI string
  qrCodeData?: string;    // Raw string for generating QR code on client
  error?: string;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  providerTransactionId?: string;
}

export interface PaymentProvider {
  /**
   * Initializes a payment intent with the provider.
   * Returns a QR code string or URL for the client to render.
   */
  createPaymentIntent(order: Order, amount: number): Promise<PaymentIntentResponse>;

  /**
   * Checks the status of a payment intent directly with the provider.
   */
  verifyPayment(providerTransactionId: string): Promise<PaymentStatusResponse>;

  /**
   * Optional: Handles refunds if the order is cancelled.
   */
  refundPayment?(providerTransactionId: string): Promise<boolean>;
}
