import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/services";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "DONOR"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await registerUser(formData);
      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "460px", margin: "2rem auto" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Join Rescue Network</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Choose your role and help redistribute surplus resources.
        </p>

        {error && (
          <div style={{ padding: "0.6rem 0.8rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label>Select Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="DONOR">Donor (Restaurant / Store / Individual)</option>
              <option value="NGO">NGO (Shelter / Food Bank)</option>
              <option value="DELIVERY">Delivery Partner (Courier / Volunteer)</option>
            </select>
          </div>

          <div>
            <label>Name or Organization</label>
            <input
              type="text"
              required
              placeholder="e.g. Green Bakery / Jane Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="contact@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label>Phone Number</label>
            <input
              type="tel"
              required
              placeholder="+1 555 000 0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
            {loading ? "Creating account..." : "Complete Registration"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}