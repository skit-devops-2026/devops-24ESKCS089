import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Crosshair,
  Loader2,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building,
  Navigation
} from "lucide-react";
import {
  searchAddressSuggestions,
  getCurrentUserLocationAddress,
  getMapNavigationUrl
} from "../services/locationService";

/**
 * LocationAutocomplete Component
 * Provides real-time free address suggestions powered by OpenStreetMap / Photon API.
 * Automatically extracts and fills Address Line, City, State, Pincode, and Coordinates.
 *
 * Props:
 *  - value: { pickupAddress, city, state, pincode, coordinates }
 *  - onChange: ({ pickupAddress, city, state, pincode, coordinates }) => void
 *  - label: string (default: "Pickup Location / Address")
 *  - required: boolean (default: true)
 *  - compact: boolean (default: false)
 *  - helperText: string
 */
export default function LocationAutocomplete({
  value = {},
  onChange,
  label = "Pickup Location / Address",
  required = true,
  compact = false,
  helperText
}) {
  const [query, setQuery] = useState(value.pickupAddress || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [errorNotice, setErrorNotice] = useState("");
  const [showManualFields, setShowManualFields] = useState(Boolean(value.city || value.state || value.pincode));

  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal search query if external pickupAddress changes (e.g. initial edit/populate)
  useEffect(() => {
    if (value.pickupAddress !== undefined && value.pickupAddress !== query) {
      setQuery(value.pickupAddress || "");
    }
  }, [value.pickupAddress]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced search when query changes
  const handleQueryChange = (text) => {
    setQuery(text);
    setErrorNotice("");

    // Notify parent immediately of address text change
    if (onChange) {
      onChange({
        pickupAddress: text,
        city: value.city || "",
        state: value.state || "",
        pincode: value.pincode || "",
        coordinates: value.coordinates || null
      });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(text, 6);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 320);
  };

  // Select a suggestion from the dropdown
  const handleSelectSuggestion = (item) => {
    setQuery(item.fullAddress || item.addressLine);
    setIsOpen(false);
    setSuggestions([]);
    setShowManualFields(true);

    if (onChange) {
      onChange({
        pickupAddress: item.fullAddress || item.addressLine,
        city: item.city || "",
        state: item.state || "",
        pincode: item.pincode || "",
        coordinates: item.lat && item.lng ? { lat: item.lat, lng: item.lng } : null
      });
    }
  };

  // Use Browser Geolocation (GPS) to get current location & address
  const handleDetectLocation = async () => {
    setDetectingGps(true);
    setErrorNotice("");
    try {
      const loc = await getCurrentUserLocationAddress();
      if (loc) {
        setQuery(loc.fullAddress || loc.addressLine);
        setIsOpen(false);
        setShowManualFields(true);
        if (onChange) {
          onChange({
            pickupAddress: loc.fullAddress || loc.addressLine,
            city: loc.city || "",
            state: loc.state || "",
            pincode: loc.pincode || "",
            coordinates: loc.lat && loc.lng ? { lat: loc.lat, lng: loc.lng } : null
          });
        }
      }
    } catch (err) {
      setErrorNotice(err.message || "Failed to detect location.");
    } finally {
      setDetectingGps(false);
    }
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSubFieldChange = (field, val) => {
    if (onChange) {
      onChange({
        pickupAddress: value.pickupAddress || query,
        city: field === "city" ? val : value.city || "",
        state: field === "state" ? val : value.state || "",
        pincode: field === "pincode" ? val : value.pincode || "",
        coordinates: value.coordinates || null
      });
    }
  };

  const hasCoords = value.coordinates && value.coordinates.lat && value.coordinates.lng;

  return (
    <div ref={wrapperRef} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* Label and GPS Detection Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ margin: 0, fontWeight: "600", fontSize: "0.88rem", color: "var(--text-main)" }}>
          {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detectingGps}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--primary)",
            fontSize: "0.8rem",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.2rem 0.4rem",
            borderRadius: "var(--radius-xs)",
            transition: "all 0.15s ease"
          }}
          title="Detect my current location via GPS"
        >
          {detectingGps ? (
            <Loader2 size={13} className="spin-animation" style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Crosshair size={13} />
          )}
          <span>{detectingGps ? "Detecting..." : "Detect My Location"}</span>
        </button>
      </div>

      {/* Main Search Input with Icon & Badges */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute",
          left: "0.85rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center"
        }}>
          {loading ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
          ) : (
            <MapPin size={16} style={{ color: "var(--primary)" }} />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          required={required}
          placeholder="Start typing street address, area, landmark, or city..."
          style={{
            paddingLeft: "2.4rem",
            paddingRight: query ? "4.5rem" : "2rem",
            width: "100%",
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--border)",
            transition: "border-color 0.2s, box-shadow 0.2s"
          }}
        />

        {/* Clear Button & Live API Badge */}
        <div style={{
          position: "absolute",
          right: "0.6rem",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem"
        }}>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
                if (onChange) {
                  onChange({
                    pickupAddress: "",
                    city: "",
                    state: "",
                    pincode: "",
                    coordinates: null
                  });
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                padding: "2px"
              }}
              title="Clear address"
            >
              <X size={15} />
            </button>
          )}
          <span
            style={{
              fontSize: "0.68rem",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              padding: "2px 6px",
              borderRadius: "var(--radius-xs)",
              fontWeight: "700",
              letterSpacing: "0.2px"
            }}
            title="Free OpenStreetMap real-time geocoding"
          >
            FREE API
          </span>
        </div>

        {/* Autocomplete Dropdown List */}
        {isOpen && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "white",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)",
              zIndex: 9999,
              maxHeight: "260px",
              overflowY: "auto"
            }}
          >
            <div style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.72rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-muted)",
              background: "var(--canvas-subtle)",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>Address Suggestions</span>
              <span style={{ fontSize: "0.68rem", fontWeight: "600" }}>OpenStreetMap</span>
            </div>

            {suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: "0.65rem 0.85rem",
                    cursor: "pointer",
                    background: isSelected ? "var(--primary-subtle)" : "white",
                    borderBottom: index < suggestions.length - 1 ? "1px solid var(--border-light)" : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    transition: "background 0.15s ease"
                  }}
                >
                  <MapPin
                    size={16}
                    style={{
                      color: isSelected ? "var(--primary)" : "var(--text-muted)",
                      flexShrink: 0,
                      marginTop: "2px"
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: "700",
                      fontSize: "0.86rem",
                      color: isSelected ? "var(--primary)" : "var(--text-main)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: "1px"
                    }}>
                      {[item.city, item.state, item.pincode, item.country].filter(Boolean).join(", ")}
                    </div>

                    {/* Chips for state & pincode */}
                    {(item.state || item.pincode) && (
                      <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.3rem" }}>
                        {item.state && (
                          <span style={{
                            fontSize: "0.68rem",
                            background: "var(--canvas-subtle)",
                            color: "var(--text-body)",
                            padding: "1px 6px",
                            borderRadius: "var(--radius-xs)",
                            fontWeight: "600"
                          }}>
                            {item.state}
                          </span>
                        )}
                        {item.pincode && (
                          <span style={{
                            fontSize: "0.68rem",
                            background: "var(--indigo-subtle)",
                            color: "var(--indigo)",
                            padding: "1px 6px",
                            borderRadius: "var(--radius-xs)",
                            fontWeight: "700"
                          }}>
                            PIN: {item.pincode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Geolocation / Network Error alert */}
      {errorNotice && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.78rem",
          color: "var(--danger)",
          background: "var(--danger-subtle)",
          padding: "0.4rem 0.65rem",
          borderRadius: "var(--radius-xs)",
          border: "1px solid var(--danger-border)"
        }}>
          <AlertCircle size={14} />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Structured Location Elements: City, State, Pincode Breakdown */}
      <div style={{
        marginTop: "0.25rem",
        background: "var(--canvas-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: compact ? "0.65rem 0.75rem" : "0.85rem 1rem",
        border: "1px solid var(--border-light)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: showManualFields ? "0.65rem" : 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: "700", color: "var(--text-muted)" }}>
            <Building size={13} style={{ color: "var(--primary)" }} />
            <span>ACCURATE LOCATION DETAILS</span>
            {hasCoords && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                background: "var(--success-subtle)",
                color: "var(--primary)",
                padding: "1px 6px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.68rem"
              }}>
                <CheckCircle2 size={10} /> GPS Pinned
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {hasCoords && (
              <a
                href={getMapNavigationUrl(value.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.74rem",
                  color: "var(--primary)",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem"
                }}
              >
                <span>View on Map</span>
                <ExternalLink size={11} />
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowManualFields(!showManualFields)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.74rem",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {showManualFields ? "Hide Breakdown" : "Edit / View Breakdown"}
            </button>
          </div>
        </div>

        {showManualFields && (
          <div style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr 1fr" : "1.2fr 1fr 1fr",
            gap: "0.65rem",
            marginTop: "0.4rem"
          }}>
            {/* City */}
            <div>
              <label style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "2px", display: "block" }}>
                City / Town
              </label>
              <input
                type="text"
                value={value.city || ""}
                onChange={(e) => handleSubFieldChange("city", e.target.value)}
                placeholder="e.g. New Delhi"
                style={{
                  fontSize: "0.82rem",
                  padding: "0.45rem 0.65rem",
                  background: "white",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border)",
                  width: "100%"
                }}
              />
            </div>

            {/* State */}
            <div>
              <label style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "2px", display: "block" }}>
                State / Province
              </label>
              <input
                type="text"
                value={value.state || ""}
                onChange={(e) => handleSubFieldChange("state", e.target.value)}
                placeholder="e.g. Delhi / California"
                style={{
                  fontSize: "0.82rem",
                  padding: "0.45rem 0.65rem",
                  background: "white",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border)",
                  width: "100%"
                }}
              />
            </div>

            {/* Pincode */}
            <div style={{ gridColumn: compact ? "span 2" : "auto" }}>
              <label style={{ fontSize: "0.74rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "2px", display: "block" }}>
                Pincode / Postal Code
              </label>
              <input
                type="text"
                value={value.pincode || ""}
                onChange={(e) => handleSubFieldChange("pincode", e.target.value)}
                placeholder="e.g. 110001"
                style={{
                  fontSize: "0.82rem",
                  padding: "0.45rem 0.65rem",
                  background: "white",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border)",
                  width: "100%"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {helperText && (
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {helperText}
        </span>
      )}
    </div>
  );
}
