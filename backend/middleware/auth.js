import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function authenticate(required = true) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) {
        if (!required) {
          req.user = null;
          return next();
        }
        return res.status(401).json({ message: "Authentication required" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.sub).select("-password");
      if (!user) return res.status(401).json({ message: "Invalid user" });
      if (!user.emailVerified) {
        return res.status(403).json({
          message: "Email not verified. Please verify your email before continuing.",
          requiresVerification: true,
          email: user.email,
        });
      }
      req.user = user;
      req.tokenPayload = decoded;
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }
    next();
  };
}
