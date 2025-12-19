import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "mentor") {
        await api.post("/auth/register-mentor", { name, email, password });
      } else {
        await api.post("/auth/register", { name, email, password });
      }
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card-panel">
        <h2>Create an account</h2>
        <p className="small">Register as a student or mentor</p>

        <form onSubmit={handleSubmit} className="form-row" style={{marginTop:16}}>
          <label className="small">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Your full name" />

          <label className="small">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@company.com" />

          <label className="small">Password</label>
          <input
            type="password"
            value={password}
            className="input"
            placeholder="Choose a password"
            onChange={e => setPassword(e.target.value)}
          />

          <label className="small">Register as</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="input">
            <option value="student">Student</option>
            <option value="mentor">Mentor</option>
          </select>

          {error && <div style={{color:'#b91c1c'}}>{error}</div>}

          <div className="actions">
            <button className="btn" disabled={loading}>{loading ? 'Registering...' : 'Create account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
