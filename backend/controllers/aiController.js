import path from "path";
import AIDetectionLog from "../models/AIDetectionLog.js";
import Complaint from "../models/Complaint.js";
import Department from "../models/Department.js";
import { detectImageAuthenticity, detectTextAuthenticity } from "../services/advancedAiService.js";
import { CATEGORY_TO_DEPARTMENT } from "../constants/categories.js";
import { generateTicketId } from "../utils/ticket.js";

export async function detectImage(req, res) {
  const imageRelativePath = req.file ? path.join("uploads", req.file.filename).split(path.sep).join("/") : "";
  const result = await detectImageAuthenticity({ imageRelativePath });
  return res.json({
    prediction: result.prediction,
    confidence: result.confidence,
    authenticityScore: result.authenticityScore,
    reasons: result.reasons,
    imagePath: imageRelativePath,
  });
}

export async function detectText(req, res) {
  const { title = "", description = "" } = req.body;
  const result = await detectTextAuthenticity({ title, description });
  return res.json({
    prediction: result.prediction,
    confidence: result.confidence,
    authenticityScore: result.authenticityScore,
    reasons: result.reasons,
  });
}

export async function listRejectedLogs(req, res) {
  const rows = await AIDetectionLog.find({ action: "rejected" })
    .sort({ createdAt: -1 })
    .populate("userId", "name email")
    .lean();
  res.json({ logs: rows });
}

export async function approveRejectedLog(req, res) {
  const log = await AIDetectionLog.findById(req.params.id);
  if (!log) return res.status(404).json({ message: "AI log not found" });
  if (log.action !== "rejected") return res.status(400).json({ message: "Only rejected logs can be overridden" });

  const d = log.complaintDraft || {};
  if (!d.title || !d.description) {
    return res.status(400).json({ message: "Log draft is incomplete" });
  }

  const category = "other";
  const departmentName = CATEGORY_TO_DEPARTMENT[category] || CATEGORY_TO_DEPARTMENT.other;
  const department = await Department.findOne({ name: departmentName });

  const complaint = await Complaint.create({
    ticketId: generateTicketId(),
    title: d.title,
    description: d.description,
    image: d.image || "",
    location: d.location || "",
    category,
    department: department?._id || null,
    departmentName,
    status: "assigned",
    aiResult: {
      categoryConfidence: 0.3,
      textFakeScore: 1 - (log.result?.textAuthenticityScore || 0),
      imageFakeScore: 1 - (log.result?.imageAuthenticityScore || 0),
      spamScore: 0,
      overallGenuine: true,
      isSuspicious: false,
      reasons: [`Manual override by admin (${req.user.email})`],
      rawServiceResponse: {
        fromLogId: log._id,
        override: true,
      },
    },
    timeline: [
      { stage: "submitted", label: "Complaint submitted from rejected queue", note: "Admin override path", by: req.user._id },
      { stage: "assigned", label: "Assigned after manual override", note: "Approved by admin", by: req.user._id },
    ],
    createdBy: log.userId,
    contactPhone: d.contactPhone || "",
  });

  log.action = "manual_override";
  log.reviewedByAdmin = req.user._id;
  await log.save();

  res.json({ complaintId: complaint._id, ticketId: complaint.ticketId, message: "Rejected complaint approved via manual override" });
}
