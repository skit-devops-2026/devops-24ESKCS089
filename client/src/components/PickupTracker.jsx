import React from "react";
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, MapPin, Calendar, DollarSign } from "lucide-react";

export default function PickupTracker({ pickup, onStatusUpdate, isCourier = false }) {
  if (!pickup) return null;

  const currentStatus = pickup.deliveryStatus || "PENDING";

  // Stages definition
  const stages = [
    { key: "PENDING", label: "Requested", icon: Clock },
    { key: "SCHEDULED", label: "Scheduled", icon: Calendar },
    { key: "PICKED_UP", label: "In Transit", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: PackageCheck }
  ];

  const getStatusIndex = (status) => {
    switch (status) {
      case "PENDING": return 0;
      case "SCHEDULED": return 1;
      case "PICKED_UP": return 2;
      case "DELIVERED": return 3;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === "CANCELLED";

  return (
    <div className="card" style={{ marginBottom: "1rem", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontWeight: "700", fontSize: "1.05rem", color: "var(--secondary)" }}>
              {pickup.request?.donation?.title || "Food Rescue Package"}
            </span>
            <span className={`badge ${currentStatus === "DELIVERED" ? "badge-completed" : currentStatus === "PICKED_UP" ? "badge-in-transit" : "badge-requested"}`}>
              {currentStatus}
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Method: <strong>{pickup.pickupMethod === "SELF_PICKUP" ? "🚶 Self Pickup" : "🚚 Courier Delivery"}</strong>
          </p>
        </div>

        {pickup.deliveryFee > 0 && (
          <div style={{
            background: "var(--gold-subtle)",
            color: "#b45309",
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            fontWeight: "700",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}>
            <DollarSign size={14} /> Fee: ${pickup.deliveryFee}
          </div>
        )}
      </div>

      {/* Stepper Pipeline */}
      {!isCancelled ? (
        <div className="pipeline-stepper">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = idx < currentIndex;
            const isActive = idx === currentIndex;

            return (
              <div
                key={stage.key}
                className={`pipeline-step ${isDone ? "completed" : isActive ? "active" : ""}`}
              >
                <div className="pipeline-circle">
                  {isDone ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                </div>
                <span className="pipeline-title">{stage.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          padding: "0.75rem",
          background: "var(--danger-subtle)",
          color: "var(--danger)",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.85rem",
          margin: "1rem 0"
        }}>
          <AlertCircle size={16} /> This pickup schedule was cancelled.
        </div>
      )}

      {/* Details Box */}
      <div style={{
        background: "var(--canvas-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: "0.85rem",
        fontSize: "0.85rem",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.6rem",
        marginTop: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <MapPin size={15} style={{ color: "var(--primary)" }} />
          <span><strong>Pickup:</strong> {pickup.pickupAddress}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Calendar size={15} style={{ color: "var(--indigo)" }} />
          <span><strong>Date:</strong> {pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleString() : "TBD"}</span>
        </div>
        {pickup.request?.ngo?.name && (
          <div style={{ gridColumn: "span 2", color: "var(--text-muted)" }}>
            Recipient NGO: <strong>{pickup.request.ngo.name}</strong> ({pickup.request.ngo.phone || "No phone"})
          </div>
        )}
        {pickup.notes && (
          <div style={{ gridColumn: "span 2", fontStyle: "italic", color: "var(--text-muted)" }}>
            Note: "{pickup.notes}"
          </div>
        )}
      </div>

      {/* Courier Interactive Action Buttons */}
      {isCourier && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          {currentStatus === "SCHEDULED" && (
            <button
              onClick={() => onStatusUpdate(pickup._id, "PICKED_UP")}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              <Truck size={16} /> Mark as Picked Up (In Transit)
            </button>
          )}
          {currentStatus === "PICKED_UP" && (
            <button
              onClick={() => onStatusUpdate(pickup._id, "DELIVERED")}
              className="btn btn-gold"
              style={{ width: "100%" }}
            >
              <PackageCheck size={16} /> Confirm Handover & Delivered!
            </button>
          )}
        </div>
      )}
    </div>
  );
}
