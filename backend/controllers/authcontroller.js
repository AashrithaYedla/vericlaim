import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { sendVerificationEmail } from "../services/emailService.js";
import {
  normalizeEmail,
  validateName,
  validateEmailAddress,
  validatePassword,
  validatePhone,
} from "../utils/authValidation.js";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      department: user.department ? user.department.toString() : null,
      emailVerified: !!user.emailVerified,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

function publicUser(user, extra = {}) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    department: user.department || null,
    emailVerified: !!user.emailVerified,
    ...extra,
  };
}

function makeOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function hashValue(value) {
  return bcrypt.hash(String(value), 12);
}

async function issueEmailOtp(user) {
  const code = makeOtp();
  user.otpHash = await hashValue(code);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  await user.save();

  const mail = await sendVerificationEmail({
    to: user.email,
    code,
    name: user.name,
  });

  const payload = {
    requiresVerification: true,
    email: user.email,
    message: "Verification code sent to your email. Enter the code to activate your account.",
    emailProvider: mail.provider,
  };
  // Only expose preview/dev helpers outside production
  if (process.env.NODE_ENV !== "production") {
    if (mail.previewUrl) payload.emailPreviewUrl = mail.previewUrl;
    if (mail.devCode) payload.devCode = mail.devCode;
  }
  return payload;
}

async function createUnverifiedAccount({ name, email, password, phone, role, department }) {
  const nameErr = validateName(name);
  if (nameErr) {
    const err = new Error(nameErr);
    err.status = 400;
    throw err;
  }
  const emailErr = validateEmailAddress(email);
  if (emailErr) {
    const err = new Error(emailErr);
    err.status = 400;
    throw err;
  }
  const passwordErr = validatePassword(password);
  if (passwordErr) {
    const err = new Error(passwordErr);
    err.status = 400;
    throw err;
  }
  const phoneErr = validatePhone(phone);
  if (phoneErr) {
    const err = new Error(phoneErr);
    err.status = 400;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail }).select("+otpHash");
  if (existing?.emailVerified) {
    const err = new Error("Email already registered. Please log in.");
    err.status = 409;
    throw err;
  }

  const hash = await hashValue(password);
  if (existing) {
    existing.name = validator.escape(String(name).trim());
    existing.password = hash;
    existing.phone = phone ? validator.escape(String(phone).trim()) : "";
    existing.role = role;
    existing.department = department || null;
    existing.emailVerified = false;
    await existing.save();
    return existing;
  }

  return User.create({
    name: validator.escape(String(name).trim()),
    email: normalizedEmail,
    password: hash,
    phone: phone ? validator.escape(String(phone).trim()) : "",
    role,
    department: department || null,
    emailVerified: false,
  });
}

export async function register(req, res) {
  try {
    const user = await createUnverifiedAccount({ ...req.body, role: "citizen" });
    const payload = await issueEmailOtp(user);
    res.status(201).json(payload);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Registration failed" });
  }
}

export async function registerAdmin(req, res) {
  try {
    const invite = String(req.body.inviteCode || "").trim();
    const expected = process.env.ADMIN_INVITE_CODE || "VeriClaim-Admin-Secure";
    if (!invite || invite !== expected) {
      return res.status(403).json({
        message: "Invalid admin invite code. Admin accounts require an official invite.",
      });
    }
    const user = await createUnverifiedAccount({ ...req.body, role: "admin" });
    const payload = await issueEmailOtp(user);
    res.status(201).json(payload);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Registration failed" });
  }
}

export async function registerDepartmentAdmin(req, res) {
  try {
    const { departmentCode } = req.body;
    if (!departmentCode) {
      return res.status(400).json({ message: "departmentCode is required" });
    }
    const dept = await Department.findOne({ code: String(departmentCode).toUpperCase().trim() });
    if (!dept) {
      return res.status(404).json({
        message: "Department not found. Use a valid code: SAN, WAT, ELE, ROD, PSF, or MUN",
      });
    }

    const user = await createUnverifiedAccount({
      ...req.body,
      role: "department_officer",
      department: dept._id,
    });

    if (!dept.officers.some((id) => id.toString() === user._id.toString())) {
      dept.officers.push(user._id);
      await dept.save();
    }

    const payload = await issueEmailOtp(user);
    res.status(201).json({ ...payload, departmentCode: dept.code });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Registration failed" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();
    if (!email || !code) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Verification code must be 6 digits" });
    }

    const user = await User.findOne({ email }).select("+password +otpHash");
    if (!user) return res.status(404).json({ message: "Account not found. Please register first." });
    if (user.emailVerified) {
      const token = signToken(user);
      return res.json({
        message: "Email already verified",
        token,
        user: publicUser(user),
      });
    }
    if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Verification code expired. Request a new one." });
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Too many invalid code attempts. Request a new code." });
    }

    const ok = await bcrypt.compare(code, user.otpHash);
    if (!ok) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(401).json({ message: "Invalid verification code" });
    }

    user.emailVerified = true;
    user.otpHash = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    if (user.role === "department_officer" && user.department) {
      const dept = await Department.findById(user.department);
      if (dept && !dept.officers.some((id) => id.toString() === user._id.toString())) {
        dept.officers.push(user._id);
        await dept.save();
      }
    }

    const token = signToken(user);
    res.json({
      message: "Email verified successfully",
      token,
      user: publicUser(user),
    });
  } catch (e) {
    console.error("verifyEmail error", e);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
}

export async function resendOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email }).select("+otpHash");
    if (!user) return res.status(404).json({ message: "Account not found" });
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified. Please log in." });
    }

    const payload = await issueEmailOtp(user);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ message: e.message || "Could not resend code" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const emailErr = validateEmailAddress(email);
    if (emailErr) return res.status(400).json({ message: emailErr });

    const user = await User.findOne({ email: normalizeEmail(email) }).select(
      "+password +otpHash"
    );
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account locked due to too many failed attempts. Try again in ${mins} minute(s).`,
      });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0;
        await user.save();
        return res.status(423).json({
          message: `Account locked for ${LOCK_MINUTES} minutes after multiple failed logins.`,
        });
      }
      await user.save();
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      const payload = await issueEmailOtp(user);
      return res.status(403).json({
        message: "Email not verified. We sent a new verification code to your inbox.",
        ...payload,
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    console.error("login error", e);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
}

export async function createOfficer(req, res) {
  try {
    const { name, email, password, phone, departmentId } = req.body;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId required" });
    }
    const dept = await Department.findById(departmentId);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const user = await createUnverifiedAccount({
      name,
      email,
      password,
      phone,
      role: "department_officer",
      department: dept._id,
    });
    user.emailVerified = true;
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    if (!dept.officers.some((id) => id.toString() === user._id.toString())) {
      dept.officers.push(user._id);
      await dept.save();
    }

    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Could not create officer" });
  }
}

export async function me(req, res) {
  const dept = req.user.department ? await Department.findById(req.user.department).lean() : null;
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone,
    department: req.user.department,
    departmentName: dept?.name || null,
    emailVerified: !!req.user.emailVerified,
  });
}
