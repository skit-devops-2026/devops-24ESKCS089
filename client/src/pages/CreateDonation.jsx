import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createDonation } from "../api/services";
import {
  Package,
  Calendar,
  MapPin,
  FileText,
  Tag,
  CheckCircle2,
  ArrowLeft,
  Sparkles
} from "lucide-react";

export default function CreateDonation() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "FOOD",
    quantity: "",
    condition: "GOOD",
    pickupAddress: "",
    availableUntil: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { key: "FOOD", label: "Fresh Food & Meals", icon: "🍲" },
    { key: "CLOTHES", label: "Clothes & Apparel", icon: "👕" },
    { key: "FURNITURE", label: "Furniture", icon: "🪑" },
    { key: "BOOKS", label: "Educational Books", icon: "📚" },
    { key: "ELECTRONICS", label: "Electronics", icon: "💻" },
    { key: "OTHER", label: "Other Essentials", icon: "📦" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createDonation(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish donation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "2rem auto", paddingBottom: "3rem" }}>
      <Link
        to="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "var(--text-muted)",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "0.88rem",
          marginBottom: "1rem"
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="card" style={{ padding: "2.25rem", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{
            background: "var(--primary-subtle)",
            color: "var(--primary)",
            width: "42px",
            height: "42px",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Package size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.6rem", margin: 0 }}>List Surplus Item</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Publish verified resources for community NGOs and courier partners
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "0.85rem 1rem",
            background: "var(--danger-subtle)",
            color: "var(--danger)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.88rem",
            margin: "1.25rem 0",
            border: "1px solid var(--danger-border)"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1.5rem" }}>
          
          {/* Category Picker */}
          <div>
            <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>Item Category</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.65rem" }}>
              {categories.map((cat) => {
                const isSelected = formData.category === cat.key;
                return (
                  <div
                    key={cat.key}
                    onClick={() => setFormData({ ...formData, category: cat.key })}
                    style={{
                      border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                      background: isSelected ? "var(--primary-subtle)" : "white",
                      padding: "0.75rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: isSelected ? "0 2px 8px var(--primary-glow)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{cat.icon}</span>
                    <span style={{ color: isSelected ? "var(--primary)" : "var(--text-main)", flex: 1 }}>
                      {cat.label.split(" ")[0]}
                    </span>
                    {isSelected && <CheckCircle2 size={15} style={{ color: "var(--primary)" }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label>Title / Item Summary</label>
            <input
              type="text"
              required
              placeholder="e.g. 50 Packaged Meals, Winter Clothes, Study Tables, Laptops"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label>Description & Item Details</label>
            <textarea
              required
              rows={3}
              placeholder="Provide details about condition, specifications, expiry (if applicable), or handling tips..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Quantity & Condition */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label>Quantity / Pack Size</label>
              <input
                type="text"
                required
                placeholder="e.g. 25 kg / 50 boxes / 10 units"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <label>Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                <option value="GOOD">Good Condition / Reusable</option>
                <option value="NEW">Brand New / Sealed</option>
                <option value="USED">Gently Used</option>
              </select>
            </div>
          </div>

          {/* Location & Expiry */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label>Available Until (Date & Time)</label>
              <input
                type="datetime-local"
                required
                value={formData.availableUntil}
                onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
              />
            </div>
            <div>
              <label>Pickup Location / Address</label>
              <input
                type="text"
                required
                placeholder="e.g. 15 Community Way, Building A"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ marginTop: "0.5rem", width: "100%", gap: "0.5rem", boxShadow: "0 4px 14px var(--primary-glow)" }}
          >
            <Sparkles size={18} />
            {loading ? "Publishing to Network..." : "Publish Surplus Donation"}
          </button>
        </form>
      </div>
    </div>
  );
}