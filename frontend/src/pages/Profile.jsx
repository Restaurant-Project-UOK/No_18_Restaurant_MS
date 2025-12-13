import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api/profile";

export default function Profile() {
  const token = localStorage.getItem("accessToken"); // JWT stored after login
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    additionalInfo: "",
  });

  // Fetch profile on mount
  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const data = await getProfile(token);
        setProfile(data);
        setForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
          address: data.address || "",
          additionalInfo: data.additionalInfo || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile(token, form);
      setProfile(updated);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div style={{ maxWidth: "500px", margin: "auto" }}>
      <h2>My Profile</h2>

      {editing ? (
        <form onSubmit={handleSubmit}>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Full Name"
          /><br />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
          /><br />
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          /><br />
          <textarea
            name="additionalInfo"
            value={form.additionalInfo}
            onChange={handleChange}
            placeholder="Additional Info"
            rows={3}
          /><br />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          <p><strong>Full Name:</strong> {profile.fullName || "-"}</p>
          <p><strong>Phone:</strong> {profile.phone || "-"}</p>
          <p><strong>Address:</strong> {profile.address || "-"}</p>
          <p><strong>Additional Info:</strong> {profile.additionalInfo || "-"}</p>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
}
