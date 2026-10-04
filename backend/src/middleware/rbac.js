const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * Roles defined in HLD:
 * - ADMIN, CO-ORD, LEADTEACHER: Full access to all schools, unmasked.
 * - ASHATEACHER, VOLUNTEER: Scoped to their assigned school(s), unmasked within scope.
 * - GUEST, ADMIN-REPORTS: Read-only, masked aggregates only, no student PII.
 */
const ROLES = {
  ADMIN: "ADMIN",
  COORD: "CO-ORD",
  LEADTEACHER: "LEADTEACHER",
  ASHATEACHER: "ASHATEACHER",
  VOLUNTEER: "VOLUNTEER",
  ADMIN_REPORTS: "ADMIN-REPORTS",
  GUEST: "GUEST"
};

/**
 * Middleware: Enforces authentication and extracts role + school scope.
 * If optional = true, unauthenticated users are treated as GUEST with masking.
 */
function rbacMiddleware({ required = true } = {}) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      if (required) {
        return res.status(401).json({
          error: "Authentication required. Please provide a valid Bearer token.",
          code: "AUTH_REQUIRED"
        });
      }
      // If not strictly required, default to masked GUEST scope
      req.userScope = {
        role: ROLES.GUEST,
        isMasked: true,
        schoolId: null,
        authenticated: false
      };
      return next();
    }

    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
      const role = (payload.role || ROLES.ASHATEACHER).toUpperCase();
      const schoolId = payload.schoolId ? parseInt(payload.schoolId, 10) : null;

      const isPrivileged = [ROLES.ADMIN, ROLES.COORD, ROLES.LEADTEACHER].includes(role);
      const isMasked = [ROLES.GUEST, ROLES.ADMIN_REPORTS].includes(role);

      req.userScope = {
        role,
        teacherId: payload.sub,
        schoolId: isPrivileged ? null : schoolId, // privileged users are not constrained to a single school
        isMasked,
        authenticated: true
      };

      req.teacherId = payload.sub;
      next();
    } catch (err) {
      if (required) {
        return res.status(401).json({
          error: "Invalid or expired access token.",
          code: "INVALID_TOKEN"
        });
      }
      // Fallback to guest on invalid token if optional
      req.userScope = {
        role: ROLES.GUEST,
        isMasked: true,
        schoolId: null,
        authenticated: false
      };
      next();
    }
  };
}

/**
 * Strips Personally Identifiable Information (PII) for restricted roles (GUEST, ADMIN-REPORTS).
 */
function maskData(data, userScope) {
  if (!userScope || !userScope.isMasked || !data) {
    return data;
  }

  // Helper for single object
  const maskObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    const copy = Array.isArray(obj) ? [...obj] : { ...obj };

    // Mask student names
    if ("StudentName" in copy) {
      copy.StudentName = copy.SchoolStudentID ? `Student #${copy.SchoolStudentID}` : "[MASKED]";
    }
    if ("student_name" in copy) {
      copy.student_name = copy.student_id ? `Student #${copy.student_id}` : "[MASKED]";
    }

    // Scrub sensitive health/demographic details
    if ("DOB" in copy) delete copy.DOB;
    if ("Weight" in copy) delete copy.Weight;
    if ("Height" in copy) delete copy.Height;
    if ("MotherEd" in copy && userScope.role === ROLES.GUEST) copy.MotherEd = "[CONFIDENTIAL]";
    if ("FatherEd" in copy && userScope.role === ROLES.GUEST) copy.FatherEd = "[CONFIDENTIAL]";

    return copy;
  };

  if (Array.isArray(data)) {
    return data.map(maskObject);
  }

  // Handle nested objects / response payloads
  if (typeof data === "object") {
    const cloned = { ...data };
    for (const key of Object.keys(cloned)) {
      if (Array.isArray(cloned[key])) {
        cloned[key] = cloned[key].map(maskObject);
      } else if (typeof cloned[key] === "object") {
        cloned[key] = maskObject(cloned[key]);
      }
    }
    return maskObject(cloned);
  }

  return data;
}

module.exports = {
  ROLES,
  rbacMiddleware,
  maskData
};
