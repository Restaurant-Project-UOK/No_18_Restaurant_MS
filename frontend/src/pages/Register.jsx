import { useState } from "react";
import { register } from "../api/auth";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(1);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await register({ fullName, email, password, role });
      setResult(res);
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

      {result && (
        <div>
          <h3>Registration Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
