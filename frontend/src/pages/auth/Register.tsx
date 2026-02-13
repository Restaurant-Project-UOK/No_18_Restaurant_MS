import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/auth";
import { useTable } from "../../context/TableContext";


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
        navigate(`/?tableId=${tableId}`);
      }
    } catch (err: any) {
      // fetchWithAuth throws an Error if res.ok is false
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <div className="flex flex-col justify-center space-y-4 px-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-600 dark:text-gray-300">Register to place orders and manage your profile.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Register</h2>
          {error && <p className="text-red-500 mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Full name</label>
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-transparent text-gray-900 dark:text-gray-100" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-transparent text-gray-900 dark:text-gray-100" placeholder="you@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password</label>
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-transparent text-gray-900 dark:text-gray-100" placeholder="Choose a password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Phone (optional)</label>
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-transparent text-gray-900 dark:text-gray-100" placeholder="+94xxxxxxxxx" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <p className="text-sm text-gray-500">Table ID: <strong className="text-gray-700 dark:text-gray-200">{tableId || "—"}</strong></p>

            <div>
              <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-md font-medium" type="submit">Create account</button>
            </div>
          </form>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Already have an account?{' '}<button type="button" onClick={() => navigate(`/?tableId=${tableId}`)} className="text-indigo-600 hover:underline">Sign in</button></div>
        </div>
      </div>
    </div>
  );
}