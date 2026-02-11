import { useEffect, useState } from "react";
import { fetchMenu, MenuItem } from "../../api/menu";
import "./admin.css";

export default function AdminMenuManagement() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<MenuItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    price: 0,
    description: "",
    category: "",
    available: true,
  });

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        const data = await fetchMenu();
        setMenu(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load menu");
        console.error("Menu loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async (id: number) => {
    try {
      // TODO: Call updateMenuItem from admin API
      console.log("Saving item:", id, editData);
      setMenu(menu.map((item) => (item.id === id ? { ...item, ...editData } : item)));
      setEditingId(null);
      alert("Menu item updated successfully!");
    } catch (err) {
      console.error("Failed to update menu item:", err);
      alert("Failed to update menu item");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        // TODO: Call deleteMenuItem from admin API
        console.log("Deleting item:", id);
        setMenu(menu.filter((item) => item.id !== id));
        alert("Menu item deleted successfully!");
      } catch (err) {
        console.error("Failed to delete menu item:", err);
        alert("Failed to delete menu item");
      }
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill in required fields (name, price)");
      return;
    }

    try {
      // TODO: Call createMenuItem from admin API
      console.log("Adding new item:", newItem);
      const itemWithId = { ...newItem, id: Math.max(...menu.map((i) => i.id), 0) + 1 };
      setMenu([...menu, itemWithId as MenuItem]);
      setNewItem({ name: "", price: 0, description: "", category: "", available: true });
      setShowAddForm(false);
      alert("Menu item created successfully!");
    } catch (err) {
      console.error("Failed to create menu item:", err);
      alert("Failed to create menu item");
    }
  };

  const handleToggleAvailability = (item: MenuItem) => {
    const updated = { ...item, available: !item.available };
    setMenu(menu.map((i) => (i.id === item.id ? updated : i)));
    // TODO: Call updateMenuItem API
    console.log("Toggling availability:", updated);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <h2>Menu Management</h2>
        <p>Loading menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <h2>Menu Management</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Menu Management</h1>
        <button className="add-button" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "+ Add New Item"}
        </button>
      </div>

      {showAddForm && (
        <div className="form-container">
          <h3>Add New Menu Item</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Item Name"
              value={newItem.name || ""}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              value={newItem.price || 0}
              onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
            />
            <input
              type="text"
              placeholder="Category"
              value={newItem.category || ""}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              value={newItem.description || ""}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={newItem.available || false}
                onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })}
              />
              Available
            </label>
          </div>
          <button className="save-button" onClick={handleAddItem}>
            Add Item
          </button>
        </div>
      )}

      <table className="menu-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {menu.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : (
                  item.name
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editData.category || ""}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  />
                ) : (
                  item.category || "-"
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="number"
                    value={editData.price || 0}
                    onChange={(e) =>
                      setEditData({ ...editData, price: parseFloat(e.target.value) })
                    }
                  />
                ) : (
                  `රු ${item.price}`
                )}
              </td>
              <td className="description-cell">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editData.description || ""}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                ) : (
                  item.description || "-"
                )}
              </td>
              <td>
                <button
                  className={`status-badge ${item.available ? "available" : "unavailable"}`}
                  onClick={() => handleToggleAvailability(item)}
                >
                  {item.available ? "✓ Available" : "✗ Unavailable"}
                </button>
              </td>
              <td className="actions-cell">
                {editingId === item.id ? (
                  <>
                    <button
                      className="save-btn"
                      onClick={() => handleSaveEdit(item.id)}
                    >
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-btn" onClick={() => handleEdit(item)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
