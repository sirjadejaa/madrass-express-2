import { Order, PaymentStatus } from "@prisma/client";
import { PaymentProvider, PaymentIntentResponse, PaymentStatusResponse } from "./provider";

export class MockPaymentProvider implements PaymentProvider {
  async createPaymentIntent(order: Order, amount: number): Promise<PaymentIntentResponse> {
    // Generate a mock UPI URI
    // Format: upi://pay?pa=merchant@upi&pn=RestaurantName&tr=ORDERID&am=100.00&cu=INR
    const mockTransactionId = `MOCK_TXN_${order.id}_${Date.now()}`;
    const upiUri = `upi://pay?pa=mock@upi&pn=MadrassExpress&tr=${mockTransactionId}&am=${amount.toFixed(2)}&cu=INR`;

    return {
      success: true,
      providerTransactionId: mockTransactionId,
      qrCodeData: upiUri
    };
  }

  async verifyPayment(providerTransactionId: string): Promise<PaymentStatusResponse> {
    // In a real provider, this would call out to PhonePe/Razorpay API to check status.
    // Since this is a mock, we only rely on the webhook simulating the success.
    // So by default, if checked manually, we just say PENDING. 
    // The webhook will update the database directly.
    return {
      status: PaymentStatus.PENDING,
      providerTransactionId
    };
  }
}

// Export a singleton instance based on environment
export const paymentProvider: PaymentProvider = new MockPaymentProvider();
