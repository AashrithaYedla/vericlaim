import User from "../models/User.js";

export async function listOfficers(_req, res) {
  const officers = await User.find({ role: "department_officer" })
    .select("name email phone department")
    .populate("department", "name code")
    .lean();
  res.json({ officers });
}
