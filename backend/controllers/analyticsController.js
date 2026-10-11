import Complaint from "../models/Complaint.js";
import Department from "../models/Department.js";

export async function adminAnalytics(req, res) {
  const total = await Complaint.countDocuments();
  const byStatus = await Complaint.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const fakeCount = await Complaint.countDocuments({
    status: { $in: ["suspicious", "rejected_fake"] },
  });
  const resolved = await Complaint.countDocuments({ status: { $in: ["resolved", "closed"] } });
  const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 1000) / 10;

  const byDept = await Complaint.aggregate([
    { $match: { department: { $ne: null } } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
  ]);
  const deptIds = byDept.map((d) => d._id);
  const depts = await Department.find({ _id: { $in: deptIds } }).lean();
  const idToName = Object.fromEntries(depts.map((d) => [d._id.toString(), d.name]));

  const departmentWise = byDept.map((row) => ({
    departmentId: row._id,
    name: idToName[row._id.toString()] || "Unknown",
    count: row.count,
  }));

  const categoryBreakdown = await Complaint.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  res.json({
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    fakeCount,
    resolvedCount: resolved,
    resolutionRate,
    departmentWise,
    categoryBreakdown: categoryBreakdown.map((c) => ({ category: c._id, count: c.count })),
  });
}

export async function citizenStats(req, res) {
  const uid = req.user._id;
  const base = { createdBy: uid };
  const total = await Complaint.countDocuments(base);
  const inProgress = await Complaint.countDocuments({
    ...base,
    status: {
      $nin: ["resolved", "closed", "suspicious", "rejected_fake"],
    },
  });
  const completed = await Complaint.countDocuments({
    ...base,
    status: { $in: ["resolved", "closed"] },
  });
  const fake = await Complaint.countDocuments({
    ...base,
    status: { $in: ["suspicious", "rejected_fake"] },
  });

  res.json({ total, inProgress, completed, fake });
}
