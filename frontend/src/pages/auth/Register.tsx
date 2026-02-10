import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/auth";
import { useTable } from "../../context/TableContext";
import "./Auth.css";

export default function Register() {
  // State aligned with RegisterRequestDto
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role] = useState(1); // Default to CUSTOMER (1)
  const [provider] = useState(1); // Default to LOCAL (1)
  
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { tableId } = useTable();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      // Constructing payload exactly as RegisterRequestDto expects
      const payload = { 
        fullName, 
        email, 
        password, 
        role, 
        phone,
        provider // Default to LOCAL as per DTO comments
      };

      const res = await register(payload);
      
      // If the request is successful, the backend returns the ProfileDto
      if (res) {
        navigate("/", { state: { tableId } });
      }
    } catch (err: any) {
      // fetchWithAuth throws an Error if res.ok is false
      setError(err.message || "Registration failed");
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
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          placeholder="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        
        <p className="table-id">Current Table ID: {tableId}</p>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}