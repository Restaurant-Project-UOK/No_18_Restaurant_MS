export interface Order {
  id: number;
  orderId: string;
  items: { name: string; quantity: number; menuItemId?: number }[];
  tableId?: number | string;
  status?: string;
  createdAt?: string | Date;
}

interface OrderPayload {
  items: string[];
  tableId: number;
}

interface OrderResponse {
  success: boolean;
  orderId: number;
}

export async function placeOrder(order: OrderPayload): Promise<OrderResponse> {
  console.log("Order placed:", order);
  return { success: true, orderId: Math.floor(Math.random() * 10000) };
}
