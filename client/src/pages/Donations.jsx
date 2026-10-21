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
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Send,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import Toast from "../components/Toast";
import StarRating from "../components/StarRating";

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
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

  const getUrgencyBadge = (availableUntil) => {
    if (!availableUntil) return null;
    const diffHours = (new Date(availableUntil).getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHours <= 0) {
      return <span className="urgency-critical"><Clock size={12} /> Expired</span>;
    }
    if (diffHours <= 24) {
      return <span className="urgency-critical"><Clock size={12} /> Urgent: &lt; {Math.round(diffHours)}h left</span>;
    }
    if (diffHours <= 72) {
      return <span className="urgency-expiring"><Clock size={12} /> Expiring in {Math.round(diffHours / 24)}d</span>;
    }
    return <span className="urgency-fresh"><CheckCircle2 size={12} /> Active Listing</span>;
  };

  const getConditionLabel = (condition) => {
    switch (condition) {
      case "NEW": return "✨ Brand New";
      case "USED": return "📦 Gently Used";
      default: return "👍 Good Condition";
    }
  };

  // Filter & Sort
  const filteredDonations = donations
    .filter((item) => {
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "EXPIRING") {
        return new Date(a.availableUntil) - new Date(b.availableUntil);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const getCategoryCount = (catKey) => {
    if (catKey === "ALL") return donations.length;
    return donations.filter((d) => d.category === catKey).length;
  };

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Modern Hero Section */}
      <section className="hero-banner">
        <div style={{ maxWidth: "780px", position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.55rem",
            background: "rgba(16, 185, 129, 0.18)",
            color: "#34d399",
            padding: "0.4rem 0.95rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: "700",
            marginBottom: "1.25rem",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)"
          }}>
            <Sparkles size={15} /> Verified Zero-Waste Network • Real-Time Aid Bridge
          </div>

          <h1 style={{
            fontSize: "clamp(2.1rem, 4.2vw, 3.1rem)",
            color: "white",
            marginBottom: "1rem",
            lineHeight: 1.15,
            letterSpacing: "-0.03em"
          }}>
            Bridge Surplus Resources with Communities in Need
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: "1.08rem", marginBottom: "2rem", lineHeight: 1.6, maxWidth: "660px" }}>
            Connecting donors, verified NGOs, and delivery partners in real time to rescue surplus and eliminate waste.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "2.5rem" }}>
            {user?.role === "DONOR" && (
              <Link to="/create-donation" className="btn btn-primary btn-lg" style={{ boxShadow: "0 4px 20px var(--primary-glow)" }}>
                <PlusCircle size={18} /> Donate Surplus
              </Link>
            )}
            {!user && (
              <>
                <Link to="/register" className="btn btn-primary btn-lg" style={{ boxShadow: "0 4px 20px var(--primary-glow)" }}>
                  Join the Mission <ArrowRight size={17} />
                </Link>
                <Link to="/login" className="btn btn-outline" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", borderColor: "rgba(255, 255, 255, 0.25)" }}>
                  Sign In
                </Link>
              </>
            )}
            {user && (
              <Link to="/dashboard" className="btn btn-outline" style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", borderColor: "rgba(255, 255, 255, 0.25)" }}>
                Go to My Dashboard
              </Link>
            )}
          </div>

          {/* Hero Live Stat Badges */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)"
          }}>
            <div className="hero-stat-badge">
              <span className="hero-stat-val">1,450+ kg</span>
              <span className="hero-stat-lbl">Surplus Rescued</span>
            </div>
            <div className="hero-stat-badge">
              <span className="hero-stat-val">48 Verified</span>
              <span className="hero-stat-lbl">NGO Pantries</span>
            </div>
            <div className="hero-stat-badge">
              <span className="hero-stat-val">&lt; 2 Hours</span>
              <span className="hero-stat-lbl">Avg Dispatch Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Search & Filter Controls */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search surplus items, goods, essentials or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Sort Controls & Count */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <SlidersHorizontal size={15} />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.85rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "white",
                  cursor: "pointer",
                  width: "auto"
                }}
              >
                <option value="NEWEST">Newest First</option>
                <option value="EXPIRING">Expiring Soonest</option>
              </select>
            </div>

            {(searchQuery || selectedCategory !== "ALL") && (
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}
                className="btn btn-outline btn-sm"
                style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}

            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", marginLeft: "0.25rem" }}>
              Showing <strong>{filteredDonations.length}</strong> items
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {categories.map((cat) => {
            const count = getCategoryCount(cat.key);
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  background: isSelected ? "var(--primary)" : "var(--canvas-subtle)",
                  color: isSelected ? "white" : "var(--text-main)",
                  border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                  padding: "0.45rem 0.9rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: isSelected ? "0 2px 8px var(--primary-glow)" : "none"
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{
                  background: isSelected ? "rgba(255, 255, 255, 0.25)" : "rgba(15, 23, 42, 0.08)",
                  color: isSelected ? "white" : "var(--text-muted)",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.72rem",
                  fontWeight: "700"
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton-line" style={{ width: "35%", height: "22px" }} />
                <div className="skeleton-line" style={{ width: "25%", height: "22px" }} />
              </div>
              <div className="skeleton-line" style={{ width: "75%", height: "24px" }} />
              <div className="skeleton-line" style={{ width: "100%", height: "40px" }} />
              <div className="skeleton-line" style={{ width: "100%", height: "80px" }} />
              <div className="skeleton-line" style={{ width: "100%", height: "36px" }} />
            </div>
          ))}
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-full)",
            background: "var(--canvas-subtle)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-light)",
            marginBottom: "1rem"
          }}>
            <Package size={32} />
          </div>
          <h3 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>No listings match your criteria</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem", fontSize: "0.92rem" }}>
            Try adjusting your search query, clear filters, or select a different category to discover available items.
          </p>
          {user?.role === "DONOR" ? (
            <Link to="/create-donation" className="btn btn-primary">
              <PlusCircle size={16} /> Be the first to donate
            </Link>
          ) : (
            <button onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }} className="btn btn-outline">
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {filteredDonations.map((item) => (
            <div
              key={item._id}
              className={`card-surplus cat-${item.category || "OTHER"}`}
              style={{ padding: "1.5rem" }}
            >
              <div>
                {/* Header Badge Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <span className="badge badge-role">
                    {item.category}
                  </span>
                  {getUrgencyBadge(item.availableUntil)}
                </div>

                {/* Title & Description */}
                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.45rem", color: "var(--secondary)" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.1rem", minHeight: "42px", lineHeight: 1.55 }}>
                  {item.description}
                </p>

                {/* Info Card */}
                <div style={{
                  background: "var(--canvas-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.85rem 1rem",
                  fontSize: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  border: "1px solid var(--border-light)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Package size={14} style={{ color: "var(--primary)" }} />
                      <span><strong>Quantity:</strong> {item.quantity}</span>
                    </div>
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: "white",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border)"
                    }}>
                      {getConditionLabel(item.condition)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <MapPin size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <strong>Pickup:</strong> {item.pickupAddress}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Calendar size={14} style={{ color: "var(--indigo)", flexShrink: 0 }} />
                    <span>
                      <strong>Available Until:</strong> {new Date(item.availableUntil).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                </div>

                {/* Donor Star Rating Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderTop: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    <ShieldCheck size={14} style={{ color: "var(--primary)" }} />
                    <span>Donor: <strong>{item.donor?.name || "Community Partner"}</strong></span>
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
                      placeholder="Add an optional message for the donor..."
                      value={requestMsg[item._id] || ""}
                      onChange={(e) => setRequestMsg({ ...requestMsg, [item._id]: e.target.value })}
                      style={{ marginBottom: "0.55rem", fontSize: "0.85rem" }}
                    />
                    <button
                      onClick={() => handleRequest(item._id)}
                      disabled={requestingId === item._id}
                      className="btn btn-primary"
                      style={{ width: "100%", gap: "0.45rem" }}
                    >
                      <Send size={15} />
                      {requestingId === item._id ? "Submitting Request..." : "Request Surplus Item"}
                    </button>
                  </div>
                ) : !user ? (
                  <Link to="/login" className="btn btn-outline" style={{ width: "100%", textAlign: "center" }}>
                    Sign in to Request
                  </Link>
                ) : user.role === "DONOR" ? (
                  <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", padding: "0.25rem 0" }}>
                    {item.donor?._id === user._id ? "✨ Your active listing" : "Available for NGO distribution"}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", padding: "0.25rem 0" }}>
                    🚚 Ready for courier run once NGO claims
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