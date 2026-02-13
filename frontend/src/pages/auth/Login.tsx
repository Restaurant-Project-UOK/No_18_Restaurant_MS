import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import { useTable } from "../../context/TableContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  //const { tableId: contextTableId } = useTable();
  const { tableId } = useTable();

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
            const payload = { 
        email, 
        password,
        tableId // Pass tableId to backend for session association
      };

      const res = await login(payload);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <div className="flex flex-col justify-center space-y-4 px-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to continue to the restaurant dashboard and ordering.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sign in</h2>
          {error && <p className="text-red-500 mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input
                className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-transparent text-gray-900 dark:text-gray-100"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password</label>
              <input
                className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-transparent text-gray-900 dark:text-gray-100"
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <p className="text-sm text-gray-500">Table ID: <strong className="text-gray-700 dark:text-gray-200">{tableId || "—"}</strong></p>

            <div>
              <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-md font-medium" type="submit">Sign in</button>
            </div>
          </form>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            New here?{' '}
            <button type="button" onClick={() => navigate(`/register?tableId=${tableId}`)} className="text-indigo-600 hover:underline">Create an account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
