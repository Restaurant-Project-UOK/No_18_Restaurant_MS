import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../api/auth";
import { useTable } from "../../context/TableContext";
import "./Auth.css";

interface LocationState {
  tableId?: string;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { tableId: contextTableId } = useTable();
  const [tableId] = useState(contextTableId);

  // Get tableId from location state, URL params, or localStorage
  // useEffect(() => {
  //   // 1. Check location.state (coming from Register)
  //   const state = location.state as LocationState;
  //   if (state?.tableId) {
  //     setTableId(state.tableId);
  //     localStorage.setItem("tableId", state.tableId);
  //     return;
  //   }

  //   // 2. Check URL search params
  //   const searchParams = new URLSearchParams(location.search);
  //   const tableFromUrl = searchParams.get("tableId");
  //   if (tableFromUrl) {
  //     setTableId(tableFromUrl);
  //     localStorage.setItem("tableId", tableFromUrl);
  //     return;
  //   }

  //   // 3. Fall back to localStorage
  //   const saved = localStorage.getItem("tableId");
  //   if (saved) setTableId(saved);
  // }, [location.state, location.search]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
    <div className="auth-container">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
      <div className="register-link">
        <p>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register", { state: { tableId } })}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
