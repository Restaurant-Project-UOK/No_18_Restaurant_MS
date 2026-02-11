import { useCart } from "../context/CartContext";
import "./Cart.css";

interface CartProps {
  onCheckout?: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <h3>Shopping Cart</h3>
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h3>Shopping Cart ({totalItems} items)</h3>
      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <h4>{item.name}</h4>
              <p className="price">රු {item.price}</p>
              {item.notes && <p className="notes">Notes: {item.notes}</p>}
            </div>
            <div className="cart-item-controls">
              <label>
                Qty:
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                />
              </label>
              <p className="subtotal">රු {item.price * item.quantity}</p>
              <button
                className="remove-btn"
                onClick={() => removeFromCart(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h4>Total: රු {totalPrice}</h4>
        <button className="checkout-btn" onClick={onCheckout}>
          Proceed to Checkout
        </button>
        <button className="clear-btn" onClick={clearCart}>
          Clear Cart
        </button>
      </div>
    </div>
  );
}
