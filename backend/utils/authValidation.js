import validator from "validator";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "trashmail.com",
  "fakeinbox.com",
  "sharklasers.com",
  "getnada.com",
  "discard.email",
  "throwaway.email",
]);

export function normalizeEmail(email) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

export function validateName(name) {
  const cleaned = String(name || "").trim().replace(/\s+/g, " ");
  if (cleaned.length < 3) return "Full name must be at least 3 characters";
  if (cleaned.length > 80) return "Full name is too long";
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(cleaned)) {
    return "Name can only contain letters, spaces, and . ' -";
  }
  if (!/[A-Za-z]{2,}/.test(cleaned)) return "Enter a valid name";
  return null;
}

export function validateEmailAddress(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "Email is required";
  if (!validator.isEmail(normalized, { allow_utf8_local_part: false })) {
    return "Enter a valid email address";
  }
  const domain = normalized.split("@")[1] || "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "Disposable / temporary emails are not allowed. Use a real email.";
  }
  if (!domain.includes(".") || domain.endsWith(".")) {
    return "Enter a valid email domain";
  }
  return null;
}

export function validatePassword(password) {
  const pwd = String(password || "");
  if (pwd.length < 8) return "Password must be at least 8 characters";
  if (pwd.length > 128) return "Password is too long";
  if (!/[a-z]/.test(pwd)) return "Password must include a lowercase letter";
  if (!/[A-Z]/.test(pwd)) return "Password must include an uppercase letter";
  if (!/[0-9]/.test(pwd)) return "Password must include a number";
  if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must include a special character (!@#$%^&*)";
  return null;
}

export function validatePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).trim();
  if (!validator.isMobilePhone(cleaned, "any", { strictMode: false }) && !/^\+?[0-9\-\s]{8,15}$/.test(cleaned)) {
    return "Enter a valid phone number";
  }
  return null;
}
