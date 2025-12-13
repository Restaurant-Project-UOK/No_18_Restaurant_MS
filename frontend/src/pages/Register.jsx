import { useState } from "react";
import { useNavigate } from "react-router-dom"; // add this
import { register } from "../api/auth";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(1);
  const navigate = useNavigate(); // hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({ fullName, email, password, role }); // ignore response
      navigate("/login"); // redirect to login after registration
    } catch (error) {
      alert(error?.message || "Failed to register");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        /><br/>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br/>
        <select value={role} onChange={(e) => setRole(Number(e.target.value))}>
          <option value={1}>Customer</option>
          <option value={2}>Admin</option>
          <option value={3}>Staff</option>
        </select><br/>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
