import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { HeartHandshake, User, Mail, Phone, Lock, ArrowRight, Heart, Users, Truck } from "lucide-react";
import LocationAutocomplete from "../components/LocationAutocomplete";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "DONOR",
    address: "",
    city: "",
    state: "",
    pincode: "",
    coordinates: null
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleOptions = [
    { key: "DONOR", title: "Donor", desc: "Restaurants, stores, individuals with surplus", icon: Heart },
    { key: "NGO", title: "NGO / Charity", desc: "Shelters, food banks, community pantries", icon: Users },
    { key: "DELIVERY", title: "Delivery Partner", desc: "Couriers, drivers, volunteer transporters", icon: Truck }
  ];

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
    <div style={{ maxWidth: "560px", margin: "2.5rem auto", paddingBottom: "3rem" }}>
      <div className="card" style={{ padding: "2.5rem 2rem", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
        
        {/* Header */}
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
          <h2 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>Join the Rescue Network</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Select your role to connect and eliminate surplus waste
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
            border: "1px solid var(--danger-border)"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          
          {/* Role Picker Tiles */}
          <div>
            <label>Select Your Platform Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = formData.role === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => setFormData({ ...formData, role: opt.key })}
                    style={{
                      border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                      background: isSelected ? "var(--primary-subtle)" : "white",
                      padding: "0.75rem 0.5rem",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s"
                    }}
                  >
                    <Icon size={20} style={{ color: isSelected ? "var(--primary)" : "var(--text-muted)", margin: "0 auto 0.35rem" }} />
                    <div style={{ fontWeight: "700", fontSize: "0.82rem", color: isSelected ? "var(--primary)" : "var(--text-main)" }}>
                      {opt.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label>Full Name or Entity Name</label>
            <input
              type="text"
              required
              placeholder="e.g. City Harvest Pantry / John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="name@organization.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label>Phone Number</label>
            <input
              type="tel"
              required
              placeholder="+1 (555) 234-5678"
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

          {/* Base Location & Service Area */}
          <LocationAutocomplete
            label="Base Location & Address"
            required={false}
            value={{
              pickupAddress: formData.address,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              coordinates: formData.coordinates
            }}
            onChange={(loc) => {
              setFormData({
                ...formData,
                address: loc.pickupAddress,
                city: loc.city,
                state: loc.state,
                pincode: loc.pincode,
                coordinates: loc.coordinates
              });
            }}
            helperText="Provides location context to connect you with nearby surplus items and delivery routes."
          />

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            {loading ? "Creating Account..." : "Join & Get Started"}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-light)", paddingTop: "1.25rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "700", textDecoration: "none" }}>
            Log in <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}