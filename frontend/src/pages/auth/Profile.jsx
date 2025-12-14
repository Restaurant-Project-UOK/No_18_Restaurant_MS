import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../api/auth";

export default function Profile() {
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile(); // automatically handles refresh
        setUser(data);
      } catch (err) {
        console.error(err);
        navigate("/login"); // redirect if refresh fails
      }
    }

    loadProfile();
  }, [navigate]);

  return (
    <div>
      <h2>User Profile</h2>
      <p><strong>Name:</strong> {user.fullName}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Phone:</strong> {user.phone}</p>
      <p><strong>Address:</strong> {user.address}</p>
    </div>
  );
}
