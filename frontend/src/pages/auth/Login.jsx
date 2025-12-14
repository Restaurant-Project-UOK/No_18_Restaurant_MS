import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../api/auth";
import { useTable } from "../../context/TableContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { tableId: contextTableId } = useTable();
  const [tableId, setTableId] = useState(contextTableId);

  // Get tableId from location state if coming from Register
  useEffect(() => {
    if (location.state?.tableId) setTableId(location.state.tableId);
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      if (res.accessToken && res.refreshToken) {
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);
        if (tableId) localStorage.setItem("tableId", tableId);

        navigate("/profile"); // go to profile
      } else {
        setError("Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <p>Current Table ID: {tableId}</p>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
