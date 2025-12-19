import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.token;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      login(token);

      // Send users directly to their home area after login.
      if (payload.role === "student") navigate("/student");
      else if (payload.role === "mentor") navigate("/mentor");
      else if (payload.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card-panel">
        <h2>Welcome back</h2>
        <p className="small">Sign in to continue to your LMS dashboard</p>

        <form onSubmit={handleSubmit} className="form-row" style={{marginTop:16}}>
          <label className="small">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@company.com" />

          <label className="small">Password</label>
          <input
            type="password"
            value={password}
            className="input"
            placeholder="Enter your password"
            onChange={e => setPassword(e.target.value)}
          />

          {error && <div style={{color:'#b91c1c'}}>{error}</div>}

          <div className="actions">
            <button className="btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
          </div>
          <div style={{marginTop:12}}>
            <p className="small">Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
