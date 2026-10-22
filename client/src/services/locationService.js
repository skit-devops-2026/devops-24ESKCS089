/**
 * Free Location API Service
 * Powered by OpenStreetMap / Photon API with Nominatim fallback.
 * 100% Free, no API keys required, CORS enabled.
 */

// Format normalized address object from Photon API result
const normalizePhotonFeature = (feature) => {
  const p = feature.properties || {};
  const coords = feature.geometry?.coordinates || []; // [lon, lat]

  const name = p.name || "";
  const street = p.street || "";
  const housenumber = p.housenumber || "";
  const suburb = p.district || p.suburb || p.locality || "";
  const city = p.city || p.town || p.village || p.county || "";
  const state = p.state || "";
  const pincode = p.postcode || "";
  const country = p.country || "";

  // Build clean street/address line
  const streetParts = [];
  if (housenumber && street) {
    streetParts.push(`${housenumber} ${street}`);
  } else if (street) {
    streetParts.push(street);
  }
  if (name && name !== street && name !== city) {
    streetParts.unshift(name);
  }
  if (suburb && !streetParts.includes(suburb)) {
    streetParts.push(suburb);
  }
  const addressLine = streetParts.join(", ") || name || street || city;

  // Build readable full address
  const fullParts = [];
  if (addressLine) fullParts.push(addressLine);
  if (city && !addressLine.includes(city)) fullParts.push(city);
  if (state && !addressLine.includes(state)) fullParts.push(state);
  if (pincode) fullParts.push(pincode);
  if (country && !addressLine.includes(country)) fullParts.push(country);

  return {
    id: `osm-${p.osm_type || "N"}-${p.osm_id || Math.random()}`,
    label: name || addressLine || city,
    addressLine: addressLine || name || "Location",
    city: city || "",
    state: state || "",
    pincode: pincode || "",
    country: country || "",
    fullAddress: fullParts.join(", ") || name,
    lat: coords[1] !== undefined ? Number(coords[1]) : null,
    lng: coords[0] !== undefined ? Number(coords[0]) : null,
    source: "photon"
  };
};

// Format normalized address object from Nominatim API result
const normalizeNominatimItem = (item) => {
  const addr = item.address || {};
  const lat = item.lat ? parseFloat(item.lat) : null;
  const lng = item.lon ? parseFloat(item.lon) : null;

  const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
  const houseNumber = addr.house_number || "";
  const addressLine = [houseNumber, road].filter(Boolean).join(" ") || item.name || addr.suburb || "";
  const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
  const state = addr.state || "";
  const pincode = addr.postcode || "";
  const country = addr.country || "";

  return {
    id: `nom-${item.place_id || Math.random()}`,
    label: item.name || addressLine || city || item.display_name?.split(",")[0],
    addressLine: addressLine || item.display_name?.split(",")[0] || "",
    city: city || "",
    state: state || "",
    pincode: pincode || "",
    country: country || "",
    fullAddress: item.display_name || "",
    lat,
    lng,
    source: "nominatim"
  };
};

/**
 * Search locations by query string (autocomplete suggestions)
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>} List of standardized address suggestions
 */
export const searchAddressSuggestions = async (query, limit = 5) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();

  // Try Photon API first (ultra-fast, built for autocomplete typeahead)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=${limit}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.features) && data.features.length > 0) {
        return data.features.map(normalizePhotonFeature);
      }
    }
  } catch (photonErr) {
    console.warn("Photon autocomplete failed, attempting Nominatim fallback:", photonErr.message);
  }

  // Fallback to Nominatim OpenStreetMap
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=${limit}`;
    const response = await fetch(nomUrl, {
      headers: {
        Accept: "application/json"
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map(normalizeNominatimItem);
      }
    }
  } catch (nomErr) {
    console.error("Nominatim geocoding fallback failed:", nomErr);
  }

  return [];
};

/**
 * Reverse geocode latitude and longitude to structured address
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object>} Standardized address
 */
export const reverseGeocode = async (lat, lng) => {
  if (lat == null || lng == null) return null;

  // 1. Try Nominatim reverse
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return normalizeNominatimItem(data);
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error:", err.message);
  }

  // 2. Try Photon reverse fallback
  try {
    const pUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const res = await fetch(pUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.features && data.features[0]) {
        return normalizePhotonFeature(data.features[0]);
      }
    }
  } catch (err) {
    console.error("Photon reverse geocode error:", err);
  }

  return {
    id: `gps-${lat}-${lng}`,
    label: `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    addressLine: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    city: "",
    state: "",
    pincode: "",
    country: "",
    fullAddress: `Coordinates: ${lat}, ${lng}`,
    lat,
    lng,
    source: "gps"
  };
};

/**
 * Request device GPS coordinates and reverse geocode into structured address
 * @returns {Promise<Object>}
 */
export const getCurrentUserLocationAddress = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const addressData = await reverseGeocode(latitude, longitude);
          resolve(addressData);
        } catch (err) {
          reject(err);
        }
      },
      (geoError) => {
        let msg = "Could not retrieve location";
        if (geoError.code === 1) msg = "Location permission denied";
        else if (geoError.code === 2) msg = "Location unavailable";
        else if (geoError.code === 3) msg = "Location request timed out";
        reject(new Error(msg));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
};

/**
 * Generate Google Maps / OpenStreetMap direct link for an address or coordinates
 * @param {Object|string} target
 * @returns {string}
 */
export const getMapNavigationUrl = (target) => {
  if (!target) return "";
  if (typeof target === "object" && target.lat && target.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`;
  }
  const query = typeof target === "string" ? target : target.fullAddress || target.addressLine || "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
