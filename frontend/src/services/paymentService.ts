import { apiRequest } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreatePaymentRequest {
  total: number;
  currency: string;
  method: string;
  intent: string;
  description: string;
}

export interface CreatePaymentResponse {
  orderId: string;
  approvalLink: string;
  paymentId?: string;
  expiresAt?: string;
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
 * Creates a new payment session (Public)
 * 
 * @param paymentData - Payment creation data
 * @returns Redirect Link or Payment ID
 */
export const createPayment = async (
  paymentData: CreatePaymentRequest
): Promise<CreatePaymentResponse> => {
  try {
    // Note: Endpoint specified as /payments/create without /api prefix
    const response = await apiRequest<CreatePaymentResponse>(
      '/payments/create',
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    );

    console.log('[paymentService] Payment session created:', response.paymentId);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create payment';
    console.error('[paymentService] Failed to create payment:', message);
    throw new Error(message);
  }
};

/**
 * GET /api/payments/:id
 * Gets payment details
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
 * Updates payment status (approve/cancel/complete)
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
 * 
 * @param paymentId - Payment ID
 * @param accessToken - JWT access token
 * @returns Updated payment details
 */
const approvePayment = async (
  paymentId: string,
  accessToken?: string
): Promise<PaymentDetails> => {
  return updatePaymentStatus(paymentId, PaymentStatus.APPROVED, accessToken);
};

/**
 * Cancels a payment (shortcut method)
 * 
 * @param paymentId - Payment ID
 * @param accessToken - JWT access token
 * @returns Updated payment details
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
