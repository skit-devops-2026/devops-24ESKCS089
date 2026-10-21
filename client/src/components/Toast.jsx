import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    setProgress(100);
    const interval = setInterval(() => {
      setProgress((prev) => Math.max(prev - 2.5, 0));
    }, 100);

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [toast, onClose]);

  if (!toast || !toast.text) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div className="toast-container">
      <div
        className={`toast ${isSuccess ? "toast-success" : isError ? "toast-error" : ""}`}
        style={{ position: "relative", overflow: "hidden", paddingBottom: "1.1rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          {isSuccess ? (
            <CheckCircle2 size={19} style={{ color: "#34d399", flexShrink: 0 }} />
          ) : isError ? (
            <AlertTriangle size={19} style={{ color: "#f87171", flexShrink: 0 }} />
          ) : (
            <Info size={19} style={{ color: "#38bdf8", flexShrink: 0 }} />
          )}
          <span>{toast.text}</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", display: "flex", opacity: 0.8 }}
          title="Dismiss"
        >
          <X size={16} />
        </button>

        {/* Animated Countdown Progress Bar */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          width: `${progress}%`,
          background: isSuccess ? "#34d399" : isError ? "#f87171" : "#38bdf8",
          transition: "width 0.1s linear"
        }} />
      </div>
    </div>
  );
}
