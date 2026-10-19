import React, { useState } from "react";
import { X, Calendar, MapPin, Truck, DollarSign, FileText } from "lucide-react";

export default function SchedulePickupModal({ request, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    pickupMethod: "SELF_PICKUP",
    pickupAddress: request?.donation?.pickupAddress || "",
    scheduledDate: "",
    deliveryFee: 15,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduledDate) {
      alert("Please select a scheduled date and time.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        requestId: request._id,
        pickupMethod: formData.pickupMethod,
        pickupAddress: formData.pickupAddress,
        scheduledDate: formData.scheduledDate,
        deliveryFee: formData.pickupMethod === "DELIVERY" ? Number(formData.deliveryFee) || 0 : 0,
        notes: formData.notes
      });
      onClose();
    } catch (err) {
      console.error("Schedule error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "1.75rem" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem" }}>Schedule Pickup / Delivery</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Item: <strong>{request.donation?.title}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Pickup Method */}
          <div>
            <label>Collection Method</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div
                onClick={() => setFormData({ ...formData, pickupMethod: "SELF_PICKUP" })}
                style={{
                  border: `2px solid ${formData.pickupMethod === "SELF_PICKUP" ? "var(--primary)" : "var(--border)"}`,
                  background: formData.pickupMethod === "SELF_PICKUP" ? "var(--primary-subtle)" : "white",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>🚶</div>
                <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>Self Pickup</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Our NGO will pick it up</div>
              </div>

              <div
                onClick={() => setFormData({ ...formData, pickupMethod: "DELIVERY" })}
                style={{
                  border: `2px solid ${formData.pickupMethod === "DELIVERY" ? "var(--primary)" : "var(--border)"}`,
                  background: formData.pickupMethod === "DELIVERY" ? "var(--primary-subtle)" : "white",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>🚚</div>
                <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>Courier Partner</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Post job for delivery drivers</div>
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <label>Pickup Location / Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                required
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                placeholder="e.g. 124 Main Street, Warehouse B"
              />
            </div>
          </div>

          {/* Scheduled Date */}
          <div>
            <label>Scheduled Date & Time</label>
            <input
              type="datetime-local"
              required
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            />
          </div>

          {/* Delivery Fee if courier */}
          {formData.pickupMethod === "DELIVERY" && (
            <div>
              <label>Delivery Fee Compensation ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                placeholder="e.g. 15"
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Incentive offered to courier partner upon successful delivery.
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label>Special Instructions / Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Call upon arrival, bring insulated containers..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
              {submitting ? "Confirming..." : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
