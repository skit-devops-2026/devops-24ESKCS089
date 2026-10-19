import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import StarRating from "../components/StarRating";
import PickupTracker from "../components/PickupTracker";
import SchedulePickupModal from "../components/SchedulePickupModal";
import Toast from "../components/Toast";
import {
  LayoutDashboard,
  Package,
  Inbox,
  Truck,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Heart,
  RefreshCw,
  Award,
  Calendar,
  MapPin,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    donations: [],
    requests: [],
    pickups: [],
    availableDonations: [],
    availableDeliveries: [],
    myDeliveries: [],
    users: []
  });

  // UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState(null);
  const [schedulingRequest, setSchedulingRequest] = useState(null);
  const [requestingDonationId, setRequestingDonationId] = useState("");

  const showToast = (text, type = "success") => {
    setToast({ text, type });
  };

  const loadRoleData = async () => {
    setLoading(true);
    try {
      if (user?.role === "DONOR") {
        const [donationsRes, requestsRes] = await Promise.allSettled([
          fetchMyDonations(),
          fetchDonationRequests()
        ]);
        setData((prev) => ({
          ...prev,
          donations: donationsRes.status === "fulfilled" ? (donationsRes.value.data.donations || []) : [],
          requests: requestsRes.status === "fulfilled" ? (requestsRes.value.data.requests || []) : []
        }));
      } else if (user?.role === "NGO") {
        const [requestsRes, pickupsRes, availableDonationsRes] = await Promise.allSettled([
          fetchMyRequests(),
          fetchMyPickups(),
          fetchAvailableDonations()
        ]);
        setData((prev) => ({
          ...prev,
          requests: requestsRes.status === "fulfilled" ? (requestsRes.value.data.requests || []) : [],
          pickups: pickupsRes.status === "fulfilled" ? (pickupsRes.value.data.pickups || []) : [],
          availableDonations: availableDonationsRes.status === "fulfilled" ? (availableDonationsRes.value.data.donations || []) : []
        }));
      } else if (user?.role === "DELIVERY") {
        const [availableRes, myJobsRes] = await Promise.allSettled([
          fetchAvailableDeliveries(),
          fetchMyDeliveries()
        ]);
        setData((prev) => ({
          ...prev,
          availableDeliveries: availableRes.status === "fulfilled" ? (availableRes.value.data.deliveries || []) : [],
          myDeliveries: myJobsRes.status === "fulfilled" ? (myJobsRes.value.data.deliveries || []) : []
        }));
      } else if (user?.role === "ADMIN") {
        const [usersRes, allDonationsRes] = await Promise.allSettled([
          fetchAllUsers(),
          fetchAllDonations()
        ]);
        setData((prev) => ({
          ...prev,
          users: usersRes.status === "fulfilled" ? (usersRes.value.data.users || []) : [],
          donations: allDonationsRes.status === "fulfilled" ? (allDonationsRes.value.data.donations || []) : []
        }));
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      showToast("Failed to refresh some data. Please retry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRoleData();
    }
  }, [user]);

  // Handler: Request a donation on behalf of NGO
  const handleRequestDonation = async (donationId) => {
    setRequestingDonationId(donationId);
    try {
      await createRequest({
        donationId,
        message: "Requesting this surplus item on behalf of our community pantry / NGO."
      });
      showToast("Donation request submitted to the donor successfully!");
      await loadRoleData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit request.", "error");
    } finally {
      setRequestingDonationId("");
    }
  };

  // Handler: Donor Accept Request
  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptRequest(requestId);
      showToast("Request accepted! The NGO has been notified to schedule pickup.");
      await loadRoleData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to accept request.", "error");
    }
  };

  // Handler: Donor Decline Request
  const handleRejectRequest = async (requestId) => {
    try {
      await rejectRequest(requestId);
      showToast("Request declined.", "info");
      await loadRoleData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to decline request.", "error");
    }
  };

  // Handler: Schedule Pickup Confirmation
  const handleConfirmSchedulePickup = async (pickupPayload) => {
    try {
      await schedulePickup(pickupPayload);
      showToast("Pickup scheduled successfully! Check Pickups tab.");
      await loadRoleData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to schedule pickup.", "error");
    }
  };

  // Handler: Courier Claim Delivery
  const handleClaimDelivery = async (pickupId) => {
    try {
      await acceptDelivery(pickupId);
      showToast("Delivery claimed! Added to your active jobs.");
      await loadRoleData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to claim delivery job.", "error");
    }
  };

  // Handler: Courier Update Status
  const handleUpdateDeliveryStatus = async (pickupId, status) => {
    try {
      await updatePickupStatus(pickupId, status);
      showToast(status === "DELIVERED" ? "🎉 Delivery completed! Great work." : "Status updated to In Transit.");
      await loadRoleData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status.", "error");
    }
  };

  // Calculate stats & counts
  const donorCompletedCount = data.donations.filter((d) => d.status === "COMPLETED").length;
  const donorTotalCount = data.donations.length;
  const donorPendingRequests = data.requests.filter((r) => r.status === "PENDING").length;

  const ngoCompletedRequests = data.requests.filter((r) => r.status === "COMPLETED" || r.status === "ACCEPTED").length;
  const ngoActivePickups = data.pickups.filter((p) => p.deliveryStatus !== "DELIVERED" && p.deliveryStatus !== "CANCELLED").length;

  const courierCompletedCount = data.myDeliveries.filter((d) => d.deliveryStatus === "DELIVERED").length;
  const courierActiveCount = data.myDeliveries.filter((d) => d.deliveryStatus === "SCHEDULED" || d.deliveryStatus === "PICKED_UP").length;
  const courierTotalEarnings = data.myDeliveries
    .filter((d) => d.deliveryStatus === "DELIVERED")
    .reduce((acc, curr) => acc + (Number(curr.deliveryFee) || 0), 0);

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Profile & Reputation Header Banner */}
      <section style={{
        background: "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)",
        borderRadius: "var(--radius)",
        padding: "2rem",
        color: "white",
        marginBottom: "2rem",
        boxShadow: "var(--shadow-lg)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: "800",
              color: "white",
              boxShadow: "0 4px 14px var(--primary-glow)"
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
                <h1 style={{ fontSize: "1.8rem", color: "white", margin: 0 }}>
                  Welcome, {user?.name}
                </h1>
                <span className="badge" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                  {user?.role} Portal
                </span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                {user?.email} • Verified Member
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              onClick={loadRoleData}
              disabled={loading}
              className="btn btn-outline"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "white"
              }}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
              {loading ? "Syncing..." : "Sync Data"}
            </button>

            {user?.role === "DONOR" && (
              <Link to="/create-donation" className="btn btn-primary">
                <PlusCircle size={16} /> Post Surplus Donation
              </Link>
            )}
          </div>
        </div>

        {/* Reputation Star Card Inside Header */}
        <div style={{ marginTop: "1.5rem" }}>
          <StarRating
            role={user?.role}
            count={user?.role === "DONOR" ? donorTotalCount : user?.role === "DELIVERY" ? courierCompletedCount : ngoCompletedRequests}
            showProgress={true}
          />
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab("overview")}
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
        >
          <LayoutDashboard size={16} /> Overview & Analytics
        </button>

        {user?.role === "DONOR" && (
          <>
            <button
              onClick={() => setActiveTab("requests")}
              className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
            >
              <Inbox size={16} /> Incoming Requests
              {donorPendingRequests > 0 && <span className="tab-badge" style={{ background: "var(--gold-subtle)", color: "#b45309" }}>{donorPendingRequests} New</span>}
            </button>
            <button
              onClick={() => setActiveTab("donations")}
              className={`tab-btn ${activeTab === "donations" ? "active" : ""}`}
            >
              <Package size={16} /> My Listed Donations
              <span className="tab-badge">{data.donations.length}</span>
            </button>
          </>
        )}

        {user?.role === "NGO" && (
          <>
            <button
              onClick={() => setActiveTab("available")}
              className={`tab-btn ${activeTab === "available" ? "active" : ""}`}
            >
              <Package size={16} /> Available Surplus Items
              <span className="tab-badge">{data.availableDonations.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
            >
              <Inbox size={16} /> My Aid Requests
              <span className="tab-badge">{data.requests.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("pickups")}
              className={`tab-btn ${activeTab === "pickups" ? "active" : ""}`}
            >
              <Truck size={16} /> Pickups & Deliveries
              <span className="tab-badge">{data.pickups.length}</span>
            </button>
          </>
        )}

        {user?.role === "DELIVERY" && (
          <>
            <button
              onClick={() => setActiveTab("available-jobs")}
              className={`tab-btn ${activeTab === "available-jobs" ? "active" : ""}`}
            >
              <Inbox size={16} /> Open Courier Runs
              <span className="tab-badge" style={{ background: "var(--primary-subtle)", color: "var(--primary)" }}>{data.availableDeliveries.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("active-jobs")}
              className={`tab-btn ${activeTab === "active-jobs" ? "active" : ""}`}
            >
              <Truck size={16} /> Active Deliveries
              <span className="tab-badge">{courierActiveCount}</span>
            </button>
            <button
              onClick={() => setActiveTab("job-history")}
              className={`tab-btn ${activeTab === "job-history" ? "active" : ""}`}
            >
              <CheckCircle2 size={16} /> Completed Deliveries
              <span className="tab-badge">{courierCompletedCount}</span>
            </button>
          </>
        )}

        {user?.role === "ADMIN" && (
          <>
            <button
              onClick={() => setActiveTab("users")}
              className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            >
              <Users size={16} /> Users Directory
              <span className="tab-badge">{data.users.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("all-donations")}
              className={`tab-btn ${activeTab === "all-donations" ? "active" : ""}`}
            >
              <Package size={16} /> All Platform Donations
              <span className="tab-badge">{data.donations.length}</span>
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DONOR DASHBOARD VIEWS */}
      {/* ========================================================================= */}
      {user?.role === "DONOR" && (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <div className="grid-4" style={{ marginBottom: "2rem" }}>
                <div className="metric-card">
                  <div className="metric-icon-wrap emerald"><Package size={22} /></div>
                  <div className="metric-value">{donorTotalCount}</div>
                  <div className="metric-label">Total Donations Listed</div>
                  <div className="metric-subtext">All-time contributions</div>
                </div>

                <div className="metric-card gold">
                  <div className="metric-icon-wrap gold"><Inbox size={22} /></div>
                  <div className="metric-value">{donorPendingRequests}</div>
                  <div className="metric-label">Pending Requests</div>
                  <div className="metric-subtext">Awaiting your approval</div>
                </div>

                <div className="metric-card blue">
                  <div className="metric-icon-wrap blue"><CheckCircle2 size={22} /></div>
                  <div className="metric-value">{donorCompletedCount}</div>
                  <div className="metric-label">Handed Over / Delivered</div>
                  <div className="metric-subtext">Completed rescues</div>
                </div>

                <div className="metric-card indigo">
                  <div className="metric-icon-wrap indigo"><Heart size={22} /></div>
                  <div className="metric-value">{donorTotalCount * 12}</div>
                  <div className="metric-label">Estimated Meals Saved</div>
                  <div className="metric-subtext">Direct community impact</div>
                </div>
              </div>

              {/* Quick Actions & Recent Incoming Requests */}
              <div className="grid-2">
                <section className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Recent Incoming Requests</h3>
                    <button onClick={() => setActiveTab("requests")} className="btn btn-outline btn-sm">
                      View All ({data.requests.length})
                    </button>
                  </div>

                  {data.requests.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      <Inbox size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                      <p>No requests received yet. When NGOs request your surplus, they will show up here.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {data.requests.slice(0, 3).map((req) => (
                        <div key={req._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                            <div>
                              <strong>{req.ngo?.name || "Verified NGO"}</strong>
                              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                Requested: <strong>{req.donation?.title}</strong>
                              </div>
                            </div>
                            <span className={`badge ${req.status === "PENDING" ? "badge-requested" : "badge-available"}`}>{req.status}</span>
                          </div>
                          {req.status === "PENDING" && (
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                              <button onClick={() => handleAcceptRequest(req._id)} className="btn btn-primary btn-sm">
                                <CheckCircle2 size={14} /> Accept Request
                              </button>
                              <button onClick={() => handleRejectRequest(req._id)} className="btn btn-danger btn-sm">
                                <XCircle size={14} /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Your Surplus Items</h3>
                    <Link to="/create-donation" className="btn btn-primary btn-sm">
                      + Add New
                    </Link>
                  </div>

                  {data.donations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      <Package size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                      <p>You haven't posted any donations yet.</p>
                      <Link to="/create-donation" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                        Create First Listing
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {data.donations.slice(0, 4).map((d) => (
                        <div key={d._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{d.title}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {d.quantity} • {d.pickupAddress}
                            </div>
                          </div>
                          <span className={`badge ${d.status === "AVAILABLE" ? "badge-available" : d.status === "COMPLETED" ? "badge-completed" : "badge-requested"}`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem" }}>Incoming Requests from NGOs ({data.requests.length})</h3>
              {data.requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <Inbox size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>No pending or past requests.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {data.requests.map((req) => (
                    <div key={req._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <h4 style={{ fontSize: "1.1rem" }}>{req.ngo?.name || "Community Partner NGO"}</h4>
                            <span className="badge badge-role">NGO</span>
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Contact: {req.ngo?.email} {req.ngo?.phone ? `• ${req.ngo.phone}` : ""}
                          </p>
                        </div>
                        <span className={`badge ${req.status === "ACCEPTED" ? "badge-available" : req.status === "REJECTED" ? "badge-cancelled" : "badge-requested"}`}>
                          {req.status}
                        </span>
                      </div>

                      <div style={{ background: "var(--canvas-subtle)", padding: "0.85rem", borderRadius: "var(--radius-sm)", margin: "0.85rem 0", fontSize: "0.9rem" }}>
                        <div><strong>Item Requested:</strong> {req.donation?.title} ({req.donation?.quantity})</div>
                        <div style={{ marginTop: "0.3rem", fontStyle: "italic", color: "var(--text-muted)" }}>
                          "{req.message || "Requesting donation collection on behalf of verified NGO."}"
                        </div>
                      </div>

                      {req.status === "PENDING" && (
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <button onClick={() => handleAcceptRequest(req._id)} className="btn btn-primary btn-sm">
                            <CheckCircle2 size={16} /> Accept Request
                          </button>
                          <button onClick={() => handleRejectRequest(req._id)} className="btn btn-danger btn-sm">
                            <XCircle size={16} /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DONATIONS LIST TAB */}
          {activeTab === "donations" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <h3>My Listed Surplus Items ({data.donations.length})</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Track and manage all your posted donations</p>
                </div>
                <Link to="/create-donation" className="btn btn-primary">
                  <PlusCircle size={16} /> Create Listing
                </Link>
              </div>

              {data.donations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <Package size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>You haven't posted any surplus items yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                  {data.donations.map((d) => (
                    <div key={d._id} className="card" style={{ padding: "1.25rem", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span className="badge badge-role">{d.category}</span>
                        <span className={`badge ${d.status === "AVAILABLE" ? "badge-available" : d.status === "COMPLETED" ? "badge-completed" : "badge-requested"}`}>
                          {d.status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>{d.title}</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                        {d.description}
                      </p>
                      <div style={{ background: "var(--canvas-subtle)", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.82rem" }}>
                        <div><strong>Quantity:</strong> {d.quantity}</div>
                        <div><strong>Pickup:</strong> {d.pickupAddress}</div>
                        <div><strong>Expires:</strong> {new Date(d.availableUntil).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* NGO DASHBOARD VIEWS */}
      {/* ========================================================================= */}
      {user?.role === "NGO" && (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <div className="grid-4" style={{ marginBottom: "2rem" }}>
                <div className="metric-card">
                  <div className="metric-icon-wrap emerald"><Package size={22} /></div>
                  <div className="metric-value">{data.availableDonations.length}</div>
                  <div className="metric-label">Surplus Available Near You</div>
                  <div className="metric-subtext">Ready for immediate request</div>
                </div>

                <div className="metric-card gold">
                  <div className="metric-icon-wrap gold"><Inbox size={22} /></div>
                  <div className="metric-value">{data.requests.length}</div>
                  <div className="metric-label">Total Requests Placed</div>
                  <div className="metric-subtext">{ngoCompletedRequests} approved / completed</div>
                </div>

                <div className="metric-card indigo">
                  <div className="metric-icon-wrap indigo"><Truck size={22} /></div>
                  <div className="metric-value">{ngoActivePickups}</div>
                  <div className="metric-label">Active Collections / Pickups</div>
                  <div className="metric-subtext">In logistics pipeline</div>
                </div>

                <div className="metric-card blue">
                  <div className="metric-icon-wrap blue"><Heart size={22} /></div>
                  <div className="metric-value">{ngoCompletedRequests * 15}</div>
                  <div className="metric-label">Families Supported</div>
                  <div className="metric-subtext">Verified community meals</div>
                </div>
              </div>

              {/* Quick Sections: Available Surplus & Active Pickups */}
              <div className="grid-2">
                <section className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Available Surplus Items</h3>
                    <button onClick={() => setActiveTab("available")} className="btn btn-outline btn-sm">
                      Browse All ({data.availableDonations.length})
                    </button>
                  </div>

                  {data.availableDonations.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No active donations available at the moment.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {data.availableDonations.slice(0, 3).map((item) => (
                        <div key={item._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                            <strong>{item.title}</strong>
                            <span className="badge badge-role">{item.category}</span>
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                            Quantity: {item.quantity} • Pickup: {item.pickupAddress}
                          </p>
                          <button
                            onClick={() => handleRequestDonation(item._id)}
                            disabled={requestingDonationId === item._id}
                            className="btn btn-primary btn-sm"
                            style={{ width: "100%" }}
                          >
                            {requestingDonationId === item._id ? "Requesting..." : "Request Item"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Active Pickups & Couriers</h3>
                    <button onClick={() => setActiveTab("pickups")} className="btn btn-outline btn-sm">
                      View Logistics ({data.pickups.length})
                    </button>
                  </div>

                  {data.pickups.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      <Truck size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                      <p>No collections scheduled yet. Once a donor accepts your request, schedule collection here.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {data.pickups.slice(0, 2).map((p) => (
                        <PickupTracker key={p._id} pickup={p} isCourier={false} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* AVAILABLE DONATIONS TAB */}
          {activeTab === "available" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3>Surplus Resource Catalog ({data.availableDonations.length})</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Select items to request for your beneficiaries</p>
                </div>
                <div style={{ maxWidth: "320px", width: "100%" }}>
                  <div className="search-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search items, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {data.availableDonations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <Package size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>No donations are currently available. Check back soon!</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                  {data.availableDonations
                    .filter((d) => !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
                      <div key={item._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid var(--border)" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span className="badge badge-role">{item.category}</span>
                            <span className="badge badge-available">Ready to Request</span>
                          </div>
                          <h4 style={{ fontSize: "1.15rem", marginBottom: "0.35rem" }}>{item.title}</h4>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.85rem" }}>
                            {item.description}
                          </p>
                          <div style={{ background: "var(--canvas-subtle)", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            <div><strong>Quantity:</strong> {item.quantity} ({item.condition || "GOOD"})</div>
                            <div><strong>Pickup Address:</strong> {item.pickupAddress}</div>
                            <div><strong>Expires:</strong> {new Date(item.availableUntil).toLocaleDateString()}</div>
                            <div><strong>Donor:</strong> {item.donor?.name || "Verified Member"}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRequestDonation(item._id)}
                          disabled={requestingDonationId === item._id}
                          className="btn btn-primary"
                          style={{ marginTop: "1rem", width: "100%" }}
                        >
                          {requestingDonationId === item._id ? "Sending request..." : "Request This Item"}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* MY REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem" }}>My Requests History ({data.requests.length})</h3>
              {data.requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <Inbox size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>You haven't requested any donations yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {data.requests.map((req) => (
                    <div key={req._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <h4 style={{ fontSize: "1.1rem" }}>{req.donation?.title}</h4>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            Pickup Address: {req.donation?.pickupAddress}
                          </p>
                        </div>
                        <span className={`badge ${req.status === "ACCEPTED" ? "badge-available" : req.status === "REJECTED" ? "badge-cancelled" : "badge-requested"}`}>
                          {req.status}
                        </span>
                      </div>

                      {/* If Accepted, show schedule collection button */}
                      {req.status === "ACCEPTED" && (
                        <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.85rem", color: "#047857", fontWeight: "600" }}>
                            ✅ Approved by donor! Ready for collection scheduling.
                          </span>
                          <button
                            onClick={() => setSchedulingRequest(req)}
                            className="btn btn-primary btn-sm"
                          >
                            <Calendar size={15} /> Schedule Pickup
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PICKUPS & LOGISTICS TAB */}
          {activeTab === "pickups" && (
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem" }}>Pickups & Logistics Pipeline ({data.pickups.length})</h3>
              {data.pickups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <Truck size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>No active pickups scheduled. Accept requests to schedule collections.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {data.pickups.map((p) => (
                    <PickupTracker key={p._id} pickup={p} isCourier={false} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* DELIVERY PARTNER DASHBOARD VIEWS */}
      {/* ========================================================================= */}
      {user?.role === "DELIVERY" && (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <div className="grid-4" style={{ marginBottom: "2rem" }}>
                <div className="metric-card gold">
                  <div className="metric-icon-wrap gold"><Award size={22} /></div>
                  <div className="metric-value">{courierCompletedCount}</div>
                  <div className="metric-label">Completed Deliveries</div>
                  <div className="metric-subtext">Verified successful handovers</div>
                </div>

                <div className="metric-card indigo">
                  <div className="metric-icon-wrap indigo"><Truck size={22} /></div>
                  <div className="metric-value">{courierActiveCount}</div>
                  <div className="metric-label">Active Courier Runs</div>
                  <div className="metric-subtext">In-progress deliveries</div>
                </div>

                <div className="metric-card emerald">
                  <div className="metric-icon-wrap emerald"><DollarSign size={22} /></div>
                  <div className="metric-value">${courierTotalEarnings}</div>
                  <div className="metric-label">Total Delivery Earnings</div>
                  <div className="metric-subtext">Earned from delivery bounties</div>
                </div>

                <div className="metric-card blue">
                  <div className="metric-icon-wrap blue"><Inbox size={22} /></div>
                  <div className="metric-value">{data.availableDeliveries.length}</div>
                  <div className="metric-label">Available Open Jobs</div>
                  <div className="metric-subtext">Ready for claiming</div>
                </div>
              </div>

              {/* Quick Split: Active Jobs & Open Bounties */}
              <div className="grid-2">
                <section className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Active Assigned Deliveries ({courierActiveCount})</h3>
                    <button onClick={() => setActiveTab("active-jobs")} className="btn btn-outline btn-sm">
                      Full Tracker
                    </button>
                  </div>

                  {courierActiveCount === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      <Truck size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                      <p>You have no active runs right now. Claim an open job to start earning!</p>
                      <button onClick={() => setActiveTab("available-jobs")} className="btn btn-primary btn-sm" style={{ marginTop: "0.75rem" }}>
                        Browse Open Jobs
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {data.myDeliveries
                        .filter((d) => d.deliveryStatus !== "DELIVERED" && d.deliveryStatus !== "CANCELLED")
                        .map((p) => (
                          <PickupTracker
                            key={p._id}
                            pickup={p}
                            isCourier={true}
                            onStatusUpdate={handleUpdateDeliveryStatus}
                          />
                        ))}
                    </div>
                  )}
                </section>

                <section className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Open Courier Runs</h3>
                    <button onClick={() => setActiveTab("available-jobs")} className="btn btn-outline btn-sm">
                      View All ({data.availableDeliveries.length})
                    </button>
                  </div>

                  {data.availableDeliveries.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No open delivery runs available right now.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {data.availableDeliveries.slice(0, 3).map((job) => (
                        <div key={job._id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <div>
                              <strong>{job.request?.donation?.title || "Food Package"}</strong>
                              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                Pickup: {job.pickupAddress}
                              </div>
                            </div>
                            <span style={{ background: "var(--gold-subtle)", color: "#b45309", padding: "3px 8px", borderRadius: "var(--radius-sm)", fontWeight: "700", fontSize: "0.85rem" }}>
                              ${job.deliveryFee || 0}
                            </span>
                          </div>
                          <button
                            onClick={() => handleClaimDelivery(job._id)}
                            className="btn btn-primary btn-sm"
                            style={{ width: "100%" }}
                          >
                            Claim Job
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* AVAILABLE JOBS TAB */}
          {activeTab === "available-jobs" && (
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem" }}>Available Delivery Jobs ({data.availableDeliveries.length})</h3>
              {data.availableDeliveries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <Inbox size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>All current delivery jobs have been claimed! Please check back shortly.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                  {data.availableDeliveries.map((job) => (
                    <div key={job._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                          <span className="badge badge-role">{job.request?.donation?.category || "SURPLUS"}</span>
                          <span style={{ background: "var(--gold-subtle)", color: "#b45309", padding: "4px 10px", borderRadius: "var(--radius-sm)", fontWeight: "800", fontSize: "0.95rem" }}>
                            ${job.deliveryFee || 0}
                          </span>
                        </div>
                        <h4 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>
                          {job.request?.donation?.title || "Food Package Rescue"}
                        </h4>
                        <div style={{ background: "var(--canvas-subtle)", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          <div><strong>Pickup Location:</strong> {job.pickupAddress}</div>
                          <div><strong>Scheduled Date:</strong> {new Date(job.scheduledDate).toLocaleString()}</div>
                          <div><strong>Destination NGO:</strong> {job.request?.ngo?.name}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaimDelivery(job._id)}
                        className="btn btn-primary"
                        style={{ marginTop: "1rem", width: "100%" }}
                      >
                        Claim Delivery Run (${job.deliveryFee || 0})
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE JOBS TAB */}
          {activeTab === "active-jobs" && (
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem" }}>My Active Deliveries ({courierActiveCount})</h3>
              {courierActiveCount === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <Truck size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>You have no pending deliveries assigned.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {data.myDeliveries
                    .filter((d) => d.deliveryStatus !== "DELIVERED" && d.deliveryStatus !== "CANCELLED")
                    .map((p) => (
                      <PickupTracker
                        key={p._id}
                        pickup={p}
                        isCourier={true}
                        onStatusUpdate={handleUpdateDeliveryStatus}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* COMPLETED HISTORY TAB */}
          {activeTab === "job-history" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3>Delivered Jobs History ({courierCompletedCount})</h3>
                <span style={{ fontWeight: "700", color: "#047857" }}>
                  Total Earnings: ${courierTotalEarnings}
                </span>
              </div>
              {courierCompletedCount === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <CheckCircle2 size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                  <p>No completed deliveries yet. Complete runs to increase your Star Rating!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {data.myDeliveries
                    .filter((d) => d.deliveryStatus === "DELIVERED")
                    .map((p) => (
                      <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                        <div>
                          <div style={{ fontWeight: "700" }}>{p.request?.donation?.title || "Food Delivery"}</div>
                          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                            Delivered to: {p.request?.ngo?.name} • Pickup: {p.pickupAddress}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className="badge badge-completed" style={{ marginBottom: "0.25rem" }}>DELIVERED</span>
                          <div style={{ fontWeight: "800", color: "#b45309", fontSize: "0.95rem" }}>+${p.deliveryFee || 0}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* ADMIN DASHBOARD VIEWS */}
      {/* ========================================================================= */}
      {user?.role === "ADMIN" && (
        <>
          {activeTab === "overview" && (
            <div>
              <div className="grid-4" style={{ marginBottom: "2rem" }}>
                <div className="metric-card">
                  <div className="metric-icon-wrap emerald"><Users size={22} /></div>
                  <div className="metric-value">{data.users.length}</div>
                  <div className="metric-label">Total Platform Users</div>
                  <div className="metric-subtext">Registered members</div>
                </div>

                <div className="metric-card gold">
                  <div className="metric-icon-wrap gold"><Package size={22} /></div>
                  <div className="metric-value">{data.donations.length}</div>
                  <div className="metric-label">Platform Donations</div>
                  <div className="metric-subtext">Total surplus listed</div>
                </div>

                <div className="metric-card indigo">
                  <div className="metric-icon-wrap indigo"><Award size={22} /></div>
                  <div className="metric-value">
                    {data.users.filter((u) => u.role === "DONOR").length}
                  </div>
                  <div className="metric-label">Active Donors</div>
                  <div className="metric-subtext">Verified contributors</div>
                </div>

                <div className="metric-card blue">
                  <div className="metric-icon-wrap blue"><Truck size={22} /></div>
                  <div className="metric-value">
                    {data.users.filter((u) => u.role === "DELIVERY").length}
                  </div>
                  <div className="metric-label">Delivery Couriers</div>
                  <div className="metric-subtext">Logistics partners</div>
                </div>
              </div>

              <div className="grid-2">
                <section className="card">
                  <h3>Recent Users</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                    {data.users.slice(0, 5).map((u) => (
                      <div key={u._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                        <div>
                          <strong>{u.name}</strong>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                        <span className="badge badge-role">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card">
                  <h3>Recent Platform Donations</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                    {data.donations.slice(0, 5).map((d) => (
                      <div key={d._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                        <div>
                          <strong>{d.title}</strong>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{d.category} • {d.quantity}</div>
                        </div>
                        <span className="badge badge-available">{d.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem" }}>Users Directory ({data.users.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data.users.map((u) => (
                  <div key={u._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem", background: "var(--canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <div>
                      <div style={{ fontWeight: "700" }}>{u.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email} • {u.phone || "No phone"}</div>
                    </div>
                    <span className="badge badge-role">{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "all-donations" && (
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem" }}>All Platform Donations ({data.donations.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data.donations.map((d) => (
                  <div key={d._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem", background: "var(--canvas-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <div>
                      <div style={{ fontWeight: "700" }}>{d.title}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {d.category} • {d.quantity} • Location: {d.pickupAddress}
                      </div>
                    </div>
                    <span className={`badge ${d.status === "AVAILABLE" ? "badge-available" : "badge-requested"}`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Schedule Pickup Modal */}
      {schedulingRequest && (
        <SchedulePickupModal
          request={schedulingRequest}
          onClose={() => setSchedulingRequest(null)}
          onSubmit={handleConfirmSchedulePickup}
        />
      )}
    </div>
  );
}