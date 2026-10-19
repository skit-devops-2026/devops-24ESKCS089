import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(formData);
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials or network issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "440px", margin: "3.5rem auto", paddingBottom: "3rem" }}>
      <div className="card" style={{ padding: "2.5rem 2rem", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
        
        {/* Brand Icon Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--primary) 0%, #047857 100%)",
            color: "white",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px var(--primary-glow)",
            marginBottom: "1rem"
          }}>
            <HeartHandshake size={28} />
          </div>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>Welcome Back</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sign in to access your donations, requests & pickups
          </p>
        </div>

        {error && (
          <div style={{
            padding: "0.85rem 1rem",
            background: "var(--danger-subtle)",
            color: "var(--danger)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
            border: "1px solid var(--danger-border)",
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label>Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                required
                placeholder="you@organization.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password</label>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            {loading ? "Signing in..." : "Log In to Account"}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-light)", paddingTop: "1.25rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: "700", textDecoration: "none" }}>
            Create one free <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}