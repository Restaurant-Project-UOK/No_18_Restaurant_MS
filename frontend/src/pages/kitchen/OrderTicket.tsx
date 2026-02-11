import { KitchenOrder } from "./KitchenOrders";
import "./kitchen.css";

interface OrderTicketProps {
  order: KitchenOrder;
  onBack: () => void;
  onStatusUpdate: (orderId: number, newStatus: "preparing" | "ready") => void;
}

export default function OrderTicket({ order, onBack, onStatusUpdate }: OrderTicketProps) {
  const handlePrint = () => {
    window.print();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="order-ticket-container">
      <div className="ticket-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Queue
        </button>
        <h2>Order Details</h2>
        <button className="btn-print" onClick={handlePrint}>
          🖨️ Print
        </button>
      </div>

      <div className="ticket-content print-area">
        <div className="ticket-main">
          <h1>{order.orderId}</h1>

          <div className="ticket-section">
            <div className="ticket-line">
              <span className="label">Status:</span>
              <span className={`status-badge ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="ticket-line">
              <span className="label">Time:</span>
              <span className="value">{formatTime(order.timeElapsed || 0)}</span>
            </div>
            {order.tableId && (
              <div className="ticket-line">
                <span className="label">Table:</span>
                <span className="value">#{order.tableId}</span>
              </div>
            )}
          </div>

          <div className="ticket-section items-section">
            <h3>📋 Items</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Qty</th>
                  <th>Item</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="qty">{item.quantity}</td>
                    <td className="item-name">{item.name}</td>
                    <td className="notes">{item.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.specialRequests && (
            <div className="ticket-section special-section">
              <h3>⚠️ Special Requests</h3>
              <p className="special-text">{order.specialRequests}</p>
            </div>
          )}

          <div className="ticket-section notes-section">
            <h3>📝 Additional Info</h3>
            <p>Order placed at: {new Date(order.createdAt).toLocaleTimeString()}</p>
            <p>Time in queue: {formatTime(order.timeElapsed || 0)}</p>
          </div>
        </div>

        {/* Print-specific footer */}
        <div className="print-footer">
          <p>Kitchen Order Ticket</p>
          <p>{new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="ticket-actions">
        {order.status === "pending" && (
          <button
            className="action-btn btn-start-large"
            onClick={() => onStatusUpdate(order.id, "preparing")}
          >
            🔥 Start Preparing
          </button>
        )}
        {order.status === "preparing" && (
          <button
            className="action-btn btn-ready-large"
            onClick={() => onStatusUpdate(order.id, "ready")}
          >
            ✓ Mark as Ready
          </button>
        )}
        <button className="action-btn btn-back-large" onClick={onBack}>
          ← Back to Queue
        </button>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
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
}
