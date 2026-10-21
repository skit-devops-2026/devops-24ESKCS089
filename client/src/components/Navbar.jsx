import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartHandshake, LayoutDashboard, PlusCircle, LogOut, LogIn, UserPlus } from "lucide-react";
import StarRating from "./StarRating";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="glass-panel" style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      borderTop: "none",
      borderLeft: "none",
      borderRight: "none",
      borderRadius: 0,
      background: "rgba(255, 255, 255, 0.92)",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)"
    }}>
      <div className="container" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.85rem 1.5rem"
      }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--primary) 0%, #047857 100%)",
            color: "white",
            width: "38px",
            height: "38px",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px var(--primary-glow)"
          }}>
            <HeartHandshake size={22} />
          </div>
          <div>
            <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--secondary)", letterSpacing: "-0.03em" }}>
              Rescue<span style={{ color: "var(--primary)" }}>Network</span>
            </span>
            <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Surplus & Aid Bridge
            </div>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Link
            to="/donations"
            className="btn btn-outline"
            style={{
              borderColor: isActive("/donations") || isActive("/") ? "var(--primary)" : "transparent",
              background: isActive("/donations") || isActive("/") ? "var(--primary-subtle)" : "transparent",
              color: isActive("/donations") || isActive("/") ? "var(--primary)" : "var(--text-main)",
              fontWeight: "600"
            }}
          >
            Explore Surplus
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className="btn btn-outline"
              style={{
                borderColor: isActive("/dashboard") ? "var(--primary)" : "transparent",
                background: isActive("/dashboard") ? "var(--primary-subtle)" : "transparent",
                color: isActive("/dashboard") ? "var(--primary)" : "var(--text-main)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}

          {user?.role === "DONOR" && (
            <Link to="/create-donation" className="btn btn-primary">
              <PlusCircle size={16} /> Donate Surplus
            </Link>
          )}
        </nav>

        {/* User / Authentication Area */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          {!user ? (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link to="/login" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <LogIn size={15} /> Log In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <UserPlus size={15} /> Join Network
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              {/* User Identity & Star Rating Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--secondary)" }}>
                    {user.name}
                  </div>
                  <span className="badge badge-role" style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem" }}>
                    {user.role}
                  </span>
                </div>

                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-full)",
                  background: "linear-gradient(135deg, #059669 0%, #0f172a 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "0.95rem"
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}
                title="Logout from system"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}