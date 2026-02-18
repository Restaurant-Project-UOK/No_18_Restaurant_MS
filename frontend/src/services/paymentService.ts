import { apiRequest } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Request body for POST /payments/create
 * Backend PaymentRequest DTO: { orderId: Long, amount: Double }
 */
export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
}

/**
 * Response from POST /payments/create
 * Backend returns a plain string: the PayPal sandbox approval URL
 * e.g. "https://www.sandbox.paypal.com/checkoutnow?token=XXXX"
 */
export interface CreatePaymentResponse {
  approvalUrl: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface PaymentDetails {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  approvalLink: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================
// PAYMENT API ENDPOINTS
// ============================================

/**
 * POST /payments/create
 * Creates a new PayPal payment order.
 * NOTE: No /api prefix — payment service is mapped at /payments.
 *
 * @param paymentData - { orderId, amount }
 * @returns Object containing the PayPal approval URL
 */
export const createPayment = async (
  paymentData: CreatePaymentRequest
): Promise<CreatePaymentResponse> => {
  try {
    // Backend returns a plain string (PayPal URL), not JSON
    const approvalUrl = await apiRequest<string>(
      '/payments/create',
      {
        method: 'POST',
        body: JSON.stringify({
          orderId: paymentData.orderId,
          amount: paymentData.amount,
        }),
      }
    );

    console.log('[paymentService] Payment session created, approval URL received');
    return { approvalUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create payment';
    console.error('[paymentService] Failed to create payment:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/payments/:id
 * Gets payment details (endpoint not yet confirmed in backend docs — kept for future use)
 *
 * @param paymentId - Payment ID
 * @param accessToken - JWT access token
 * @returns Payment details
 */
const getPaymentDetails = async (
  paymentId: string,
  accessToken?: string
): Promise<PaymentDetails> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<PaymentDetails>(
      `/api/payments/${paymentId}`,
      {
        jwt: token,
      }
    );

    console.log('[paymentService] Retrieved payment details:', paymentId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payment details';
    console.error('[paymentService] Failed to fetch payment details:', message);
    throw new Error(message);
  }
};

/**
 * PATCH /api/payments/:id
 * Updates payment status (endpoint not yet confirmed in backend docs — kept for future use)
 *
 * @param paymentId - Payment ID
 * @param status - New payment status
 * @param accessToken - JWT access token
 * @returns Updated payment details
 */
const updatePaymentStatus = async (
  paymentId: string,
  status: PaymentStatus,
  accessToken?: string
): Promise<PaymentDetails> => {
  try {
    const token = accessToken || localStorage.getItem('auth_access_token');
    if (!token) {
      throw new Error('Unauthorized: No access token');
    }

    const response = await apiRequest<PaymentDetails>(
      `/api/payments/${paymentId}`,
      {
        method: 'PATCH',
        jwt: token,
        body: JSON.stringify({ status }),
      }
    );

    console.log('[paymentService] Payment status updated:', paymentId, '→', status);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update payment status';
    console.error('[paymentService] Failed to update payment status:', message);
    throw new Error(message);
  }
};

/**
 * Approves a payment (shortcut method)
 */
const approvePayment = async (
  paymentId: string,
  accessToken?: string
): Promise<PaymentDetails> => {
  return updatePaymentStatus(paymentId, PaymentStatus.APPROVED, accessToken);
};

/**
 * Cancels a payment (shortcut method)
 */
const cancelPayment = async (
  paymentId: string,
  accessToken?: string
): Promise<PaymentDetails> => {
  return updatePaymentStatus(paymentId, PaymentStatus.CANCELLED, accessToken);
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const paymentService = {
  // API endpoints
  createPayment,
  getPaymentDetails,
  updatePaymentStatus,

  // Shortcut methods
  approvePayment,
  cancelPayment,
};
