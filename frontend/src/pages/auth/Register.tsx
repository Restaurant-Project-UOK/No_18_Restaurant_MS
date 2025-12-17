import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/auth";
import { useTable } from "../../context/TableContext";
import "./Auth.css";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { tableId } = useTable();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await register({ fullName, email, password, role: 1 });
    if (res) {
      // Registration success → go to login
      navigate("/login", { state: { tableId } }); // pass tableId via state
    } else {
      setError(res.status || "Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="table-id">Current Table ID: {tableId}</p>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
