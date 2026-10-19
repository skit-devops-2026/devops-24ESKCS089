import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast || !toast.text) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div className="toast-container">
      <div className={`toast ${isSuccess ? "toast-success" : isError ? "toast-error" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {isSuccess ? <CheckCircle2 size={18} /> : isError ? <AlertTriangle size={18} /> : <Info size={18} />}
          <span>{toast.text}</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", display: "flex" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
