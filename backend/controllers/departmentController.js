import Department from "../models/Department.js";

export async function listDepartments(_req, res) {
  const rows = await Department.find().sort({ name: 1 }).lean();
  res.json({ departments: rows });
}

export async function upsertDepartment(req, res) {
  const {
    name,
    code,
    description,
    contactEmail,
    contactPhone,
    helplineNumber,
    officeAddress,
    supportHours,
    emergencyContact,
    socialLinks,
  } = req.body;
  if (!name || !code) return res.status(400).json({ message: "name and code required" });
  const payload = {
    name: String(name).trim(),
    code: String(code).toUpperCase().trim(),
    description: description || "",
    contactEmail: contactEmail || "",
    contactPhone: contactPhone || "",
    helplineNumber: helplineNumber || "",
    officeAddress: officeAddress || "",
    supportHours: supportHours || "Mon-Fri 09:00-18:00",
    emergencyContact: emergencyContact || "",
    socialLinks: socialLinks || {},
  };
  const row = await Department.findOneAndUpdate({ code: payload.code }, payload, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  res.json({ department: row });
}
