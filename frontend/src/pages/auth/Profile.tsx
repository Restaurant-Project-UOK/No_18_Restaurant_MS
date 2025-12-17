import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../../api/auth";
import "./Auth.css";

interface User {
  fullName?: string;
  email?: string;
  role?: number;
  phone?: string;
  address?: string;
}

export default function Profile() {
  const [user, setUser] = useState<User>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<User>({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setUser(data);
        setEditData(data);
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    }

    loadProfile();
  }, [navigate]);

  const handleEdit = () => {
    setIsEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(user);
    setMessage("");
  };

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setUser(editData);
      setIsEditing(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile");
    }
  };

  const handleChange = (field: keyof User, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {message && <p className={message.includes("successfully") ? "success-message" : "error-message"}>{message}</p>}
      
      {!isEditing ? (
        <>
          <p><strong>Name:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Address:</strong> {user.address}</p>
          <button onClick={handleEdit} className="edit-button">Edit Profile</button>
        </>
      ) : (
        <form>
          <input
            type="text"
            placeholder="Full Name"
            value={editData.fullName || ""}
            onChange={(e) => handleChange("fullName", e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={editData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          <input
            type="text"
            placeholder="Phone"
            value={editData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
          <input
            type="text"
            placeholder="Address"
            value={editData.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
          />
          <div className="button-group">
            <button type="button" onClick={handleSave} className="save-button">Save</button>
            <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
