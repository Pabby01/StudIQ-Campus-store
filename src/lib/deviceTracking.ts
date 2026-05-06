// Device and location tracking utility for user analytics

export interface DeviceInfo {
  device_type: string; // 'mobile' | 'tablet' | 'desktop'
  device_os: string; // 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux'
  browser: string;
  browser_version: string;
  user_agent: string;
}

export interface LocationInfo {
  city: string;
  country: string;
  ip_address: string;
  latitude?: number;
  longitude?: number;
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (typeof window === "undefined") {
    return {
      device_type: "unknown",
      device_os: "unknown",
      browser: "unknown",
      browser_version: "unknown",
      user_agent: "",
    };
  }

  const userAgent = window.navigator.userAgent;

  // Detect device type
  let device_type = "desktop";
  if (/Mobile|Android|iPhone|iPad|iPod/.test(userAgent)) {
    device_type = /iPad|Android(?!.*Mobile)/.test(userAgent)
      ? "tablet"
      : "mobile";
  }

  // Detect OS
  let device_os = "Unknown";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    device_os = "iOS";
  } else if (userAgent.includes("Android")) {
    device_os = "Android";
  } else if (userAgent.includes("Windows")) {
    device_os = "Windows";
  } else if (userAgent.includes("Macintosh")) {
    device_os = "macOS";
  } else if (userAgent.includes("Linux")) {
    device_os = "Linux";
  }

  // Detect browser
  let browser = "Unknown";
  let browser_version = "Unknown";

  if (userAgent.includes("Chrome")) {
    browser = "Chrome";
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    if (match) browser_version = match[1];
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
    const match = userAgent.match(/Version\/([\d.]+)/);
    if (match) browser_version = match[1];
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    if (match) browser_version = match[1];
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
    const match = userAgent.match(/Edge\/([\d.]+)/);
    if (match) browser_version = match[1];
  }

  return {
    device_type,
    device_os,
    browser,
    browser_version,
    user_agent: userAgent,
  };
}

export async function getLocationInfo(): Promise<LocationInfo> {
  // Try to get from browser geolocation API first
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false,
        });
      } else {
        reject(new Error("Geolocation not available"));
      }
    });

    // Get city/country from coordinates using reverse geocoding
    const { latitude, longitude } = position.coords;
    const locationData = await getLocationFromCoordinates(latitude, longitude);

    return {
      city: locationData.city || "Unknown",
      country: locationData.country || "Unknown",
      ip_address: "", // Will be filled by server
      latitude,
      longitude,
    };
  } catch (error) {
    // Fallback: try IP-based geolocation
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.city || "Unknown",
          country: data.country_name || "Unknown",
          ip_address: data.ip || "",
        };
      }
    } catch (ipError) {
      console.warn("Could not fetch IP-based location:", ipError);
    }

    return {
      city: "Unknown",
      country: "Unknown",
      ip_address: "",
    };
  }
}

async function getLocationFromCoordinates(
  latitude: number,
  longitude: number
): Promise<{ city: string; country: string }> {
  try {
    // Using OpenStreetMap's Nominatim service (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    if (response.ok) {
      const data = await response.json();
      const address = data.address || {};
      return {
        city: address.city || address.town || address.village || "Unknown",
        country: address.country || "Unknown",
      };
    }
  } catch (error) {
    console.warn("Could not reverse geocode coordinates:", error);
  }

  return { city: "Unknown", country: "Unknown" };
}

export async function captureUserTracking(
  walletAddress: string
): Promise<{
  device_info: DeviceInfo;
  location_info: LocationInfo;
}> {
  try {
    const [deviceInfo, locationInfo] = await Promise.all([
      getDeviceInfo(),
      getLocationInfo(),
    ]);

    // Send to backend for storage
    await fetch("/api/admin/analytics/user-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_address: walletAddress,
        activity_type: "page_view",
        device_type: deviceInfo.device_type,
        device_os: deviceInfo.device_os,
        browser: deviceInfo.browser,
        location_city: locationInfo.city,
        location_country: locationInfo.country,
        page_url: window.location.pathname,
      }),
    }).catch((err) => console.warn("Could not log user activity:", err));

    // Also update user profile with device info
    await fetch("/api/profile/device-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet_address: walletAddress,
        device_type: deviceInfo.device_type,
        device_os: deviceInfo.device_os,
        browser: deviceInfo.browser,
        browser_version: deviceInfo.browser_version,
        user_agent: deviceInfo.user_agent,
        city: locationInfo.city,
        country: locationInfo.country,
      }),
    }).catch((err) => console.warn("Could not update device info:", err));

    return { device_info: deviceInfo, location_info: locationInfo };
  } catch (error) {
    console.error("Error capturing user tracking:", error);
    return {
      device_info: {
        device_type: "unknown",
        device_os: "unknown",
        browser: "unknown",
        browser_version: "unknown",
        user_agent: "",
      },
      location_info: {
        city: "Unknown",
        country: "Unknown",
        ip_address: "",
      },
    };
  }
}
