import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Department from "../models/Department.js";

const departments = [
  {
    name: "Sanitation",
    code: "SAN",
    description: "Waste and cleanliness",
    contactEmail: "sanitation@vericlaim.gov",
    contactPhone: "+91-90000-10001",
    helplineNumber: "1800-100-1001",
  },
  {
    name: "Water Department",
    code: "WAT",
    description: "Water supply and leakage control",
    contactEmail: "water@vericlaim.gov",
    contactPhone: "+91-90000-10002",
    helplineNumber: "1800-100-1002",
  },
  {
    name: "Electricity Department",
    code: "ELE",
    description: "Power and street lighting",
    contactEmail: "electricity@vericlaim.gov",
    contactPhone: "+91-90000-10003",
    helplineNumber: "1800-100-1003",
  },
  {
    name: "Roads & Drainage",
    code: "ROD",
    description: "Roads, potholes and drainage maintenance",
    contactEmail: "roads@vericlaim.gov",
    contactPhone: "+91-90000-10004",
    helplineNumber: "1800-100-1004",
  },
  {
    name: "Public Safety",
    code: "PSF",
    description: "Public hazard and emergency civic risks",
    contactEmail: "safety@vericlaim.gov",
    contactPhone: "+91-90000-10005",
    helplineNumber: "1800-100-1005",
    emergencyContact: "112",
  },
  {
    name: "Municipality",
    code: "MUN",
    description: "General municipality and civic operations",
    contactEmail: "municipality@vericlaim.gov",
    contactPhone: "+91-90000-10006",
    helplineNumber: "1800-100-1006",
  },
];

async function ensureUser({ name, email, password, role, department, phone = "" }) {
  const hash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.password = hash;
    existing.role = role;
    existing.phone = phone;
    existing.emailVerified = true;
    existing.otpHash = null;
    existing.otpExpires = null;
    existing.failedLoginAttempts = 0;
    existing.lockUntil = null;
    if (department) existing.department = department;
    await existing.save();
    return existing;
  }
  return User.create({
    name,
    email,
    password: hash,
    role,
    phone,
    emailVerified: true,
    ...(department ? { department } : {}),
  });
}

export async function seedDefaults() {
  for (const d of departments) {
    await Department.findOneAndUpdate({ code: d.code }, d, { upsert: true, new: true });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@vericlaim.gov";
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  await ensureUser({
    name: "System Administrator",
    email: adminEmail,
    password: adminPass,
    role: "admin",
  });

  const citizenEmail = process.env.SEED_CITIZEN_EMAIL || "citizen@vericlaim.gov";
  const citizenPass = process.env.SEED_CITIZEN_PASSWORD || "Citizen123!";
  await ensureUser({
    name: "Demo Citizen",
    email: citizenEmail,
    password: citizenPass,
    role: "citizen",
    phone: "+91-90000-20001",
  });

  const waterDept = await Department.findOne({ code: "WAT" });
  if (waterDept) {
    const officerEmail = process.env.SEED_OFFICER_EMAIL || "officer@vericlaim.gov";
    const officerPass = process.env.SEED_OFFICER_PASSWORD || "Officer123!";
    const officer = await ensureUser({
      name: "Water Department Officer",
      email: officerEmail,
      password: officerPass,
      role: "department_officer",
      department: waterDept._id,
      phone: "+91-90000-20002",
    });
    if (!waterDept.officers.some((id) => id.toString() === officer._id.toString())) {
      waterDept.officers.push(officer._id);
      await waterDept.save();
    }
  }

  console.log("Verified demo accounts ready:");
  console.log(`  Admin:   ${adminEmail} / ${adminPass}`);
  console.log(`  Citizen: ${citizenEmail} / ${citizenPass}`);
  console.log("  Officer: officer@vericlaim.gov / Officer123!");
}
