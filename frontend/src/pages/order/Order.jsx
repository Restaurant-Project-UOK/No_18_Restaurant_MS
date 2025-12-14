import { placeOrder } from "../../api/order";

export default function Order() {
  const handlePlaceOrder = () => {
    placeOrder({ items: ["Pizza", "Burger"], tableId: 1 }).then(res => {
      alert("Order placed! ID: " + res.orderId);
    });
  };

  return (
    <div>
      <h2>Order Page (Dummy)</h2>
      <button onClick={handlePlaceOrder}>Place Dummy Order</button>
    </div>
  );
}
