import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyDonations,
  fetchAvailableDonations,
  createRequest,
  fetchDonationRequests,
  acceptRequest,
  rejectRequest,
  fetchMyRequests,
  schedulePickup,
  fetchMyPickups,
  fetchAvailableDeliveries,
  acceptDelivery,
  fetchMyDeliveries,
  updatePickupStatus,
  fetchAllUsers,
  fetchAllDonations
} from "../api/services";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ list1: [], list2: [], list3: [] });
  const [loading, setLoading] = useState(true);
  const [pickupForm, setPickupForm] = useState({});
  const [requestingDonationId, setRequestingDonationId] = useState("");
  const [ngoMessage, setNgoMessage] = useState({ type: "", text: "" });

  const loadRoleData = async () => {
    setLoading(true);
    try {
      if (user?.role === "DONOR") {
        const [donationsRes, requestsRes] = await Promise.allSettled([
          fetchMyDonations(),
          fetchDonationRequests()
        ]);
        setData({
          list1: donationsRes.status === "fulfilled" ? (donationsRes.value.data.donations || []) : [],
          list2: requestsRes.status === "fulfilled" ? (requestsRes.value.data.requests || []) : []
        });
      } else if (user?.role === "NGO") {
        const [requestsRes, pickupsRes, availableDonationsRes] = await Promise.allSettled([
          fetchMyRequests(),
          fetchMyPickups(),
          fetchAvailableDonations()
        ]);
        setData({
          list1: requestsRes.status === "fulfilled" ? (requestsRes.value.data.requests || []) : [],
          list2: pickupsRes.status === "fulfilled" ? (pickupsRes.value.data.pickups || []) : [],
          list3: availableDonationsRes.status === "fulfilled" ? (availableDonationsRes.value.data.donations || []) : []
        });
      } else if (user?.role === "DELIVERY") {
        const [availableRes, myJobsRes] = await Promise.allSettled([
          fetchAvailableDeliveries(),
          fetchMyDeliveries()
        ]);
        setData({
          list1: availableRes.status === "fulfilled" ? (availableRes.value.data.deliveries || []) : [],
          list2: myJobsRes.status === "fulfilled" ? (myJobsRes.value.data.deliveries || []) : []
        });
      } else if (user?.role === "ADMIN") {
        const [usersRes, allDonationsRes] = await Promise.allSettled([
          fetchAllUsers(),
          fetchAllDonations()
        ]);
        setData({
          list1: usersRes.status === "fulfilled" ? (usersRes.value.data.users || []) : [],
          list2: allDonationsRes.status === "fulfilled" ? (allDonationsRes.value.data.donations || []) : []
        });
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadRoleData();
  }, [user]);

  const handleDonationRequest = async (donationId) => {
    setRequestingDonationId(donationId);
    setNgoMessage({ type: "", text: "" });
    try {
      await createRequest({
        donationId,
        message: "Requesting this donation on behalf of our NGO."
      });
      setNgoMessage({ type: "success", text: "Request sent to the donor." });
      await loadRoleData();
    } catch (err) {
      setNgoMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to request donation."
      });
    } finally {
      setRequestingDonationId("");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}>Loading dashboard insights...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Manage operations for {user?.name}</p>
        </div>
        <span className="badge badge-role" style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}>
          {user?.role} Portal
        </span>
      </div>

      {/* DONOR DASHBOARD */}
      {user?.role === "DONOR" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>Incoming Requests ({data.list2.length})</h3>
            {data.list2.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No pending requests from NGOs.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {data.list2.map((req) => (
                  <div key={req._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <strong>{req.ngo?.name}</strong>
                      <span className={`badge ${req.status === "PENDING" ? "badge-requested" : "badge-available"}`}>{req.status}</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Item: <strong>{req.donation?.title}</strong>
                    </p>
                    <p style={{ fontSize: "0.85rem", background: "var(--background)", padding: "0.5rem", borderRadius: "4px" }}>
                      "{req.message || "No notes provided."}"
                    </p>
                    {req.status === "PENDING" && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                        <button onClick={async () => { await acceptRequest(req._id); loadRoleData(); }} className="btn btn-primary" style={{ padding: "0.4rem 0.8rem" }}>
                          Accept
                        </button>
                        <button onClick={async () => { await rejectRequest(req._id); loadRoleData(); }} className="btn btn-danger" style={{ padding: "0.4rem 0.8rem" }}>
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>My Listed Donations ({data.list1.length})</h3>
            {data.list1.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>You haven't listed any surplus items yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data.list1.map((d) => (
                  <div key={d._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: "600" }}>{d.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{d.quantity} • {d.pickupAddress}</div>
                    </div>
                    <span className="badge badge-available">{d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* NGO DASHBOARD */}
      {user?.role === "NGO" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>Available Donations ({data.list3.length})</h3>
            {ngoMessage.text && (
              <div style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "1rem",
                background: ngoMessage.type === "success" ? "#dcfce7" : "#fee2e2",
                color: ngoMessage.type === "success" ? "#15803d" : "#b91c1c",
                fontWeight: "600",
                fontSize: "0.9rem"
              }}>
                {ngoMessage.text}
              </div>
            )}
            {data.list3.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No available donations right now.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {data.list3.map((donation) => (
                  <div key={donation._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <strong>{donation.title}</strong>
                      <span className="badge badge-role">{donation.category}</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                      {donation.description}
                    </p>
                    <div style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                      <div><strong>Quantity:</strong> {donation.quantity}</div>
                      <div><strong>Pickup:</strong> {donation.pickupAddress}</div>
                      <div><strong>Donor:</strong> {donation.donor?.name || "Verified Member"}</div>
                      <div><strong>Available until:</strong> {new Date(donation.availableUntil).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => handleDonationRequest(donation._id)}
                      disabled={requestingDonationId === donation._id}
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                    >
                      {requestingDonationId === donation._id ? "Sending request..." : "Request Donation"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>My Requests ({data.list1.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.list1.map((req) => (
                <div key={req._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4>{req.donation?.title}</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Pickup from: {req.donation?.pickupAddress}</p>
                    </div>
                    <span className={`badge ${req.status === "ACCEPTED" ? "badge-available" : "badge-requested"}`}>{req.status}</span>
                  </div>

                  {req.status === "ACCEPTED" && (
                    <div style={{ background: "var(--background)", padding: "1rem", borderRadius: "var(--radius-sm)", marginTop: "1rem" }}>
                      <h5 style={{ marginBottom: "0.5rem" }}>Schedule Collection Details</h5>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
                        <div>
                          <label>Pickup Location</label>
                          <input
                            type="text"
                            placeholder="Address"
                            value={pickupForm[req._id]?.pickupAddress || req.donation?.pickupAddress || ""}
                            onChange={(e) => setPickupForm({ ...pickupForm, [req._id]: { ...pickupForm[req._id], pickupAddress: e.target.value } })}
                          />
                        </div>
                        <div>
                          <label>Date & Time</label>
                          <input
                            type="datetime-local"
                            value={pickupForm[req._id]?.scheduledDate || ""}
                            onChange={(e) => setPickupForm({ ...pickupForm, [req._id]: { ...pickupForm[req._id], scheduledDate: e.target.value } })}
                          />
                        </div>
                        <div>
                          <label>Method</label>
                          <select
                            value={pickupForm[req._id]?.pickupMethod || "SELF_PICKUP"}
                            onChange={(e) => setPickupForm({ ...pickupForm, [req._id]: { ...pickupForm[req._id], pickupMethod: e.target.value } })}
                          >
                            <option value="SELF_PICKUP">Self Pickup</option>
                            <option value="DELIVERY">Delivery Courier</option>
                          </select>
                        </div>
                        <button
                          onClick={async () => {
                            await schedulePickup({
                              requestId: req._id,
                              pickupMethod: pickupForm[req._id]?.pickupMethod || "SELF_PICKUP",
                              pickupAddress: pickupForm[req._id]?.pickupAddress || req.donation?.pickupAddress,
                              scheduledDate: pickupForm[req._id]?.scheduledDate
                            });
                            loadRoleData();
                          }}
                          className="btn btn-primary"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* DELIVERY DASHBOARD */}
      {user?.role === "DELIVERY" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>Open Courier Jobs ({data.list1.length})</h3>
            {data.list1.map((p) => (
              <div key={p._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem", marginBottom: "0.75rem" }}>
                <div><strong>Pickup:</strong> {p.pickupAddress}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>
                  Delivery Fee: <strong>${p.deliveryFee || 0}</strong>
                </div>
                <button onClick={async () => { await acceptDelivery(p._id); loadRoleData(); }} className="btn btn-primary" style={{ width: "100%" }}>
                  Claim Delivery Job
                </button>
              </div>
            ))}
          </section>

          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>My Assigned Jobs ({data.list2.length})</h3>
            {data.list2.map((p) => (
              <div key={p._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong>{p.pickupAddress}</strong>
                  <span className="badge badge-available">{p.deliveryStatus}</span>
                </div>
                {p.deliveryStatus === "SCHEDULED" && (
                  <button onClick={async () => { await updatePickupStatus(p._id, "PICKED_UP"); loadRoleData(); }} className="btn btn-primary" style={{ width: "100%" }}>
                    Mark Picked Up
                  </button>
                )}
                {p.deliveryStatus === "PICKED_UP" && (
                  <button onClick={async () => { await updatePickupStatus(p._id, "DELIVERED"); loadRoleData(); }} className="btn btn-secondary" style={{ width: "100%" }}>
                    Mark Delivered
                  </button>
                )}
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {user?.role === "ADMIN" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>Users Directory ({data.list1.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.list1.map((u) => (
                <div key={u._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{u.name} ({u.email})</span>
                  <span className="badge badge-role">{u.role}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3 style={{ marginBottom: "1rem" }}>All Platform Donations ({data.list2.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.list2.map((d) => (
                <div key={d._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{d.title}</span>
                  <span className="badge badge-available">{d.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}