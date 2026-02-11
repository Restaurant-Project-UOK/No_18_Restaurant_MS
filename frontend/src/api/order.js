export async function placeOrder(order) {
  console.log("Order placed:", order);
  return { success: true, orderId: Math.floor(Math.random() * 10000) };
}
