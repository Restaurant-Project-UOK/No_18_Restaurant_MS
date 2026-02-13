import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import OrderTicket from "./OrderTicket";
import "./kitchen.css";

export interface KitchenOrder {
  id: number;
  orderId: string;
  tableId?: number;
  items: Array<{
    menuItemId: number;
    name: string;
    quantity: number;
    notes?: string;
  }>;
  status: "pending" | "preparing" | "ready" | "delivered";
  specialRequests?: string;
  createdAt: Date;
  timeElapsed?: number; // seconds
}

type OrderStatus = "all" | "pending" | "preparing";

export default function KitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus>("pending");
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to getKitchenOrders()
        // Mock data for demonstration
        const mockOrders: KitchenOrder[] = [
          {
            id: 1,
            orderId: "ORD-001",
            tableId: 5,
            status: "pending",
            items: [
              { menuItemId: 1, name: "Margherita Pizza", quantity: 2, notes: "Extra cheese" },
              { menuItemId: 3, name: "Caesar Salad", quantity: 1 },
            ],
            specialRequests: "No onions",
            createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
          },
          {
            id: 2,
            orderId: "ORD-002",
            tableId: 8,
            status: "pending",
            items: [{ menuItemId: 2, name: "Burger", quantity: 3, notes: "Well done" }],
            createdAt: new Date(Date.now() - 3 * 60000), // 3 minutes ago
          },
          {
            id: 3,
            orderId: "ORD-003",
            tableId: 12,
            status: "preparing",
            items: [
              { menuItemId: 4, name: "Pasta Carbonara", quantity: 1 },
              { menuItemId: 5, name: "Garlic Bread", quantity: 2 },
            ],
            createdAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
          },
        ];

        // Calculate time elapsed
        const ordersWithTime = mockOrders.map((order) => ({
          ...order,
          timeElapsed: Math.floor(
            (new Date().getTime() - new Date(order.createdAt).getTime()) / 1000
          ),
        }));

        setOrders(ordersWithTime);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load kitchen orders");
        console.error("Kitchen orders loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    // Refresh orders every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId: number, newStatus: "preparing" | "ready") => {
    try {
      // TODO: Call updateOrderStatus from kitchen API
      console.log("Updating order status:", orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      alert(`Order marked as ${newStatus}!`);
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    return order.status === filterStatus;
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "preparing":
        return "status-preparing";
      case "ready":
        return "status-ready";
      case "delivered":
        return "status-delivered";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="kitchen-container">
        <h2>Kitchen Order Queue</h2>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="kitchen-container">
      <div className="kitchen-header">
        <h1>🍳 Kitchen Order Queue</h1>
        <p>Welcome, {user?.fullName || "Kitchen Staff"}!</p>
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
          onClick={() => setFilterStatus("all")}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
          onClick={() => setFilterStatus("pending")}
        >
          📌 Pending ({orders.filter((o) => o.status === "pending").length})
        </button>
        <button
          className={`filter-btn ${filterStatus === "preparing" ? "active" : ""}`}
          onClick={() => setFilterStatus("preparing")}
        >
          🔥 Preparing ({orders.filter((o) => o.status === "preparing").length})
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <p>No {filterStatus} orders at the moment.</p>
          <p style={{ fontSize: "3rem" }}>😎</p>
        </div>
      ) : selectedOrder ? (
        <OrderTicket
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`order-card ${getStatusColor(order.status)}`}>
              <div className="order-header">
                <span className="order-id">{order.orderId}</span>
                <span className={`status-badge ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="order-time">
                ⏱️ {formatTime(order.timeElapsed || 0)}
              </div>

              {order.tableId && <div className="table-info">Table #{order.tableId}</div>}

              <div className="order-items">
                <h4>Items:</h4>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}x {item.name}
                      {item.notes && <span className="item-notes"> ({item.notes})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {order.specialRequests && (
                <div className="special-requests">
                  <strong>Special Requests:</strong> {order.specialRequests}
                </div>
              )}

              <div className="order-actions">
                {order.status === "pending" && (
                  <button
                    className="btn-action btn-start"
                    onClick={() => handleStatusUpdate(order.id, "preparing")}
                  >
                    🔥 Start Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    className="btn-action btn-ready"
                    onClick={() => handleStatusUpdate(order.id, "ready")}
                  >
                    ✓ Mark as Ready
                  </button>
                )}
                <button
                  className="btn-action btn-view"
                  onClick={() => setSelectedOrder(order)}
                >
                  👀 View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
