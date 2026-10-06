/**
 * RBAC (Role-Based Access Control) & Route Authorization Guard
 * Enforces client-side authorization before redirects and browser history changes.
 */

export const ROLES = {
  ADMIN: "ADMIN",
  COORD: "CO-ORD",
  LEADTEACHER: "LEADTEACHER",
  ASHATEACHER: "ASHATEACHER",
  VOLUNTEER: "VOLUNTEER",
  ADMIN_REPORTS: "ADMIN-REPORTS",
  GUEST: "GUEST"
};

const ROLE_HIERARCHY = {
  GUEST: 1,
  VOLUNTEER: 2,
  "ADMIN-REPORTS": 2,
  ASHATEACHER: 3,
  "CO-ORD": 4,
  LEADTEACHER: 4,
  ADMIN: 5
};

export const ROUTE_PERMISSIONS = {
  "/": {
    minRole: ROLES.GUEST,
    allowUnauthenticated: true,
    description: "Learning Trail & Offline Curriculum"
  },
  "/analytics": {
    minRole: ROLES.GUEST,
    allowUnauthenticated: true, // Aggregated analytics are available for all (PII is masked for GUEST)
    description: "Assessment & Usage Analytics Dashboard"
  },
  "/insights": {
    minRole: ROLES.ASHATEACHER, // LLM querying requires Asha Teacher or Admin account
    allowUnauthenticated: false,
    description: "Asha Insights AI Visualizer"
  }
};

/**
 * Checks whether the current user's session has sufficient credentials to access a target route.
 * @param {string} targetPath - e.g. '/', '/analytics', '/insights'
 * @returns {{ allowed: boolean, reason?: string, requiredRole?: string }}
 */
export function canAccessRoute(targetPath) {
  const normalizedPath = targetPath.split("?")[0].replace(/\/+$/, "") || "/";
  const rule = ROUTE_PERMISSIONS[normalizedPath] || ROUTE_PERMISSIONS["/"];

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("kp_token") : null;
  let user = null;
  if (typeof localStorage !== "undefined") {
    try {
      user = JSON.parse(localStorage.getItem("kp_user") || "null");
    } catch (e) {
      user = null;
    }
  }

  // 1. Check if route requires an active, valid authentication token
  if (!rule.allowUnauthenticated) {
    if (!token || isTokenExpired(token)) {
      return {
        allowed: false,
        reason: "AUTH_REQUIRED",
        requiredRole: rule.minRole
      };
    }
  }

  // 2. If authenticated, check role hierarchy
  const userRole = (user?.role || (token ? ROLES.ASHATEACHER : ROLES.GUEST)).toUpperCase();
  const userLevel = ROLE_HIERARCHY[userRole] || 1;
  const requiredLevel = ROLE_HIERARCHY[rule.minRole] || 1;

  if (userLevel < requiredLevel) {
    return {
      allowed: false,
      reason: "ROLE_UNAUTHORIZED",
      requiredRole: rule.minRole
    };
  }

  return { allowed: true };
}

/**
 * Checks if a JWT token is expired by decoding its expiration claim.
 * @param {string} token
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}

/**
 * Intercepts navigation to ensure RBAC authorization before triggering window.location or history changes.
 * @param {string} targetUrl - Target path or URL
 * @param {Function} [onDenied] - Callback invoked when authorization fails
 */
export function navigateWithRBAC(targetUrl, onDenied) {
  const path = targetUrl.startsWith("http") ? new URL(targetUrl).pathname : targetUrl;
  const access = canAccessRoute(path);

  if (!access.allowed) {
    if (onDenied) {
      onDenied(access);
    } else {
      console.warn(`[RBAC] Access denied to ${targetUrl}: ${access.reason}`);
      if (access.reason === "AUTH_REQUIRED") {
        alert("Authentication Required: Please log in as a teacher or admin to access this page.");
      } else {
        alert(`Access Restricted: This page requires ${access.requiredRole} privileges.`);
      }
    }
    return false;
  }

  window.location.href = targetUrl;
  return true;
}
