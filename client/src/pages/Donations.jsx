import React, { useEffect, useState } from "react";
import { fetchAvailableDonations, createRequest } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Heart,
  PlusCircle,
  Package,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Toast from "../components/Toast";
import StarRating from "../components/StarRating";

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [requestMsg, setRequestMsg] = useState({});
  const [requestingId, setRequestingId] = useState("");
  const [toast, setToast] = useState(null);
  const { user } = useAuth();

  const categories = [
    { key: "ALL", label: "All Items", icon: "🌱" },
    { key: "FOOD", label: "Fresh Food & Meals", icon: "🍲" },
    { key: "CLOTHES", label: "Apparel & Clothes", icon: "👕" },
    { key: "FURNITURE", label: "Furniture", icon: "🪑" },
    { key: "BOOKS", label: "Educational & Books", icon: "📚" },
    { key: "ELECTRONICS", label: "Electronics", icon: "💻" },
    { key: "OTHER", label: "Other Essentials", icon: "📦" }
  ];

  const loadDonations = async () => {
    try {
      const res = await fetchAvailableDonations();
      setDonations(res.data.donations || []);
    } catch (err) {
      console.error("Failed to load donations:", err);
      setToast({ text: "Failed to load surplus listings.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleRequest = async (donationId) => {
    setRequestingId(donationId);
    try {
      await createRequest({
        donationId,
        message: requestMsg[donationId] || "Requesting this surplus item on behalf of our verified community charity."
      });
      setToast({ text: "Request sent to donor! Check your Dashboard for updates.", type: "success" });
      loadDonations();
    } catch (err) {
      setToast({ text: err.response?.data?.message || "Failed to submit request.", type: "error" });
    } finally {
      setRequestingId("");
    }
  };

  const filteredDonations = donations.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Modern Hero Section */}
      <section className="hero-banner">
        <div style={{ maxWidth: "760px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "0.35rem 0.85rem", borderRadius: "var(--radius-full)", fontSize: "0.82rem", fontWeight: "700", marginBottom: "1.25rem", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <Sparkles size={14} /> Zero Waste • Verified Aid Network
          </div>

          <h1 style={{ fontSize: "2.8rem", color: "white", marginBottom: "1rem", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
            Bridge Surplus Resources with Communities in Need
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: "1.1rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
            Connecting donors, verified NGOs, and delivery partners in real time to rescue food and eliminate waste.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            {user?.role === "DONOR" && (
              <Link to="/create-donation" className="btn btn-primary btn-lg">
                <PlusCircle size={18} /> Post Surplus Food
              </Link>
            )}
            {!user && (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Join the Mission <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="btn btn-outline" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", borderColor: "rgba(255, 255, 255, 0.3)" }}>
                  Sign In
                </Link>
              </>
            )}
            {user && (
              <Link to="/dashboard" className="btn btn-outline" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", borderColor: "rgba(255, 255, 255, 0.3)" }}>
                Go to My Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Search & Filter Controls */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search food, groceries, items or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>
              Showing <strong>{filteredDonations.length}</strong> available items
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                background: selectedCategory === cat.key ? "var(--primary)" : "var(--canvas-subtle)",
                color: selectedCategory === cat.key ? "white" : "var(--text-main)",
                border: selectedCategory === cat.key ? "1px solid var(--primary)" : "1px solid var(--border)",
                padding: "0.45rem 0.9rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <Package size={44} style={{ margin: "0 auto 1rem", opacity: 0.5 }} className="spin" />
          <p style={{ fontSize: "1.05rem" }}>Loading active surplus listings...</p>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
          <Package size={48} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
          <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>No listings match your criteria</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem" }}>
            Try adjusting your search query or category filters to find available donations.
          </p>
          {user?.role === "DONOR" && (
            <Link to="/create-donation" className="btn btn-primary">
              <PlusCircle size={16} /> Be the first to donate
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {filteredDonations.map((item) => (
            <div
              key={item._id}
              className="card card-interactive"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1px solid var(--border)"
              }}
            >
              <div>
                {/* Header Badge Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span className="badge badge-role">
                    {item.category}
                  </span>
                  <span className="badge badge-available">
                    {item.status}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "var(--secondary)" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1rem", minHeight: "42px", lineHeight: 1.5 }}>
                  {item.description}
                </p>

                {/* Info Card */}
                <div style={{
                  background: "var(--canvas-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.85rem",
                  fontSize: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                  marginBottom: "1rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Package size={14} style={{ color: "var(--primary)" }} />
                    <span><strong>Quantity:</strong> {item.quantity} ({item.condition || "GOOD"})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <MapPin size={14} style={{ color: "var(--primary)" }} />
                    <span><strong>Location:</strong> {item.pickupAddress}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Calendar size={14} style={{ color: "var(--indigo)" }} />
                    <span><strong>Expires:</strong> {new Date(item.availableUntil).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Donor Star Rating Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderTop: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Donor: <strong>{item.donor?.name || "Verified Member"}</strong>
                  </div>
                  <StarRating role="DONOR" count={3} compact={true} />
                </div>
              </div>

              {/* Action Buttons based on User Role */}
              <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border)" }}>
                {user?.role === "NGO" ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Add an optional note for the donor..."
                      value={requestMsg[item._id] || ""}
                      onChange={(e) => setRequestMsg({ ...requestMsg, [item._id]: e.target.value })}
                      style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}
                    />
                    <button
                      onClick={() => handleRequest(item._id)}
                      disabled={requestingId === item._id}
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                    >
                      {requestingId === item._id ? "Submitting..." : "Request Donation"}
                    </button>
                  </div>
                ) : !user ? (
                  <Link to="/login" className="btn btn-outline" style={{ width: "100%", textAlign: "center" }}>
                    Sign in to Request
                  </Link>
                ) : user.role === "DONOR" ? (
                  <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {item.donor?._id === user._id ? "This is your listing" : "Available for NGO distribution"}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Ready for courier assignment once claimed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}