import path from "path";
import Complaint from "../models/Complaint.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import AIDetectionLog from "../models/AIDetectionLog.js";
import { analyzeComplaint } from "../services/aiService.js";
import { detectImageAuthenticity, detectTextAuthenticity } from "../services/advancedAiService.js";
import { generateTicketId } from "../utils/ticket.js";
import { emitToComplaint, emitToUser } from "../utils/socket.js";
import { sendEmailNotification } from "../services/notificationService.js";

function publicImageUrl(rel) {
  if (!rel) return "";
  const p = rel.replace(/^\//, "");
  return `/${p.split(path.sep).join("/")}`;
}

async function resolveDepartmentDoc(departmentName) {
  const dept = await Department.findOne({ name: departmentName });
  return dept;
}

export async function createComplaint(req, res) {
  const { title, description, location, lat, lng, contactPhone } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required" });
  }

  const relPath = req.file ? path.join("uploads", req.file.filename).split(path.sep).join("/") : "";

  const ai = await analyzeComplaint({
    title,
    description,
    imageRelativePath: relPath,
    userId: req.user._id,
  });

  const imageDetection = await detectImageAuthenticity({ imageRelativePath: relPath });
  const textDetection = await detectTextAuthenticity({ title, description });
  const imageThreshold = Number(process.env.AI_IMAGE_AUTH_THRESHOLD || 0.55);
  const textThreshold = Number(process.env.AI_TEXT_AUTH_THRESHOLD || 0.6);
  const imageRejected = imageDetection.authenticityScore < imageThreshold || imageDetection.prediction === "fake";
  const textRejected = textDetection.authenticityScore < textThreshold || textDetection.prediction === "ai_generated";
  const shouldReject = imageRejected || textRejected || ai.isSuspicious;

  if (shouldReject) {
    const log = await AIDetectionLog.create({
      userId: req.user._id,
      complaintDraft: {
        title: title.trim(),
        description: description.trim(),
        image: relPath,
        location: (location || "").trim(),
        contactPhone: (contactPhone || "").trim(),
      },
      result: {
        imagePrediction: imageDetection.prediction,
        textPrediction: textDetection.prediction,
        imageAuthenticityScore: imageDetection.authenticityScore,
        textAuthenticityScore: textDetection.authenticityScore,
        confidence: Math.min(imageDetection.confidence || 0, textDetection.confidence || 0),
        reasons: [...(ai.reasons || []), ...(imageDetection.reasons || []), ...(textDetection.reasons || [])],
        rawImageResponse: imageDetection.raw,
        rawTextResponse: textDetection.raw,
      },
      action: "rejected",
    });
    return res.status(422).json({
      message: imageRejected
        ? "Complaint rejected: uploaded image appears AI-generated or manipulated. Please upload a genuine complaint photo."
        : "Complaint seems suspicious or AI-generated. Please upload genuine complaint details.",
      verification: {
        imageAuthenticityScore: imageDetection.authenticityScore,
        textAuthenticityScore: textDetection.authenticityScore,
        confidence: Math.min(imageDetection.confidence || 0, textDetection.confidence || 0),
        reasons: log.result.reasons,
        rejectionLogId: log._id,
      },
    });
  }

  const timeline = [
    {
      stage: "submitted",
      label: "Complaint submitted",
      note: "Your complaint was received.",
    },
    {
      stage: "ai_verification",
      label: ai.isSuspicious ? "AI verification: suspicious" : "AI verification: genuine",
      note: ai.reasons.length ? ai.reasons.join("; ") : "Automated checks completed.",
    },
  ];

  let status = "suspicious";
  let department = null;
  let departmentName = "";
  let ticketId = null;

  if (!ai.isSuspicious) {
    status = "assigned";
    departmentName = ai.departmentName;
    department = await resolveDepartmentDoc(departmentName);
    ticketId = generateTicketId();
    timeline.push({
      stage: "assigned",
      label: "Routed to department",
      note: department
        ? `Assigned to ${department.name}`
        : `Target department: ${departmentName} (create department record to link).`,
    });
  } else {
    timeline.push({
      stage: "suspicious",
      label: "Held for admin review",
      note: "Automated system flagged this complaint. An admin will review.",
    });
  }

  const complaint = await Complaint.create({
    ticketId: ticketId || `HOLD-${Date.now().toString(36).toUpperCase()}`,
    title: title.trim(),
    description: description.trim(),
    image: relPath,
    location: (location || "").trim(),
    coordinates: {
      lat: lat != null && lat !== "" ? Number(lat) : null,
      lng: lng != null && lng !== "" ? Number(lng) : null,
    },
    category: ai.category,
    department: department?._id || null,
    departmentName: department?.name || departmentName,
    status,
    aiResult: {
      categoryConfidence: ai.categoryConfidence,
      textFakeScore: ai.textFakeScore,
      imageFakeScore: ai.imageFakeScore,
      spamScore: ai.spamScore,
      overallGenuine: ai.overallGenuine,
      isSuspicious: ai.isSuspicious,
      reasons: ai.reasons,
      rawServiceResponse: ai.rawServiceResponse,
    },
    timeline,
    createdBy: req.user._id,
    contactPhone: (contactPhone || "").trim(),
  });

  emitToUser(req.user._id.toString(), "complaint:created", {
    complaintId: complaint._id,
    status: complaint.status,
    ticketId: complaint.ticketId,
  });

  const createdBy = await User.findById(req.user._id).lean();
  await sendEmailNotification({
    to: createdBy?.email,
    subject: `VeriClaim complaint received (${complaint.ticketId})`,
    text: `Your complaint "${complaint.title}" was received and assigned. Track it using ticket ${complaint.ticketId}.`,
  });

  res.status(201).json({
    complaint: {
      ...complaint.toObject(),
      imageUrl: publicImageUrl(complaint.image),
    },
  });
}

export async function listMyComplaints(req, res) {
  const list = await Complaint.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate("department", "name code")
    .populate("assignedOfficer", "name email phone")
    .lean();
  res.json({
    complaints: list.map((c) => ({
      ...c,
      imageUrl: publicImageUrl(c.image),
    })),
  });
}

export async function deleteMyComplaint(req, res) {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: "Complaint not found" });
  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const lockedStatuses = new Set(["in_progress", "resolved", "closed"]);
  if (lockedStatuses.has(complaint.status)) {
    return res.status(400).json({
      message: "This complaint is already under process and cannot be deleted",
    });
  }

  await Complaint.deleteOne({ _id: complaint._id });
  emitToUser(req.user._id.toString(), "complaint:deleted", { complaintId: complaint._id });
  return res.json({ message: "Complaint deleted successfully", complaintId: complaint._id });
}

export async function getComplaint(req, res) {
  const c = await Complaint.findById(req.params.id)
    .populate("department", "name code")
    .populate("createdBy", "name email phone")
    .populate("assignedOfficer", "name email phone")
    .lean();
  if (!c) return res.status(404).json({ message: "Not found" });
  if (req.user.role === "citizen" && c.createdBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (req.user.role === "department_officer") {
    const uid = req.user._id.toString();
    const officerDept = req.user.department?.toString();
    const sameDept = c.department && c.department._id.toString() === officerDept;
    const assigned = c.assignedOfficer && c.assignedOfficer._id.toString() === uid;
    if (!sameDept && !assigned) return res.status(403).json({ message: "Forbidden" });
  }
  res.json({ complaint: { ...c, imageUrl: publicImageUrl(c.image), progressImageUrls: (c.progressImages || []).map(publicImageUrl) } });
}

export async function listAllComplaints(req, res) {
  const { status, department, fake } = req.query;
  const q = {};
  if (fake === "1") q.status = { $in: ["suspicious", "rejected_fake"] };
  else if (status) q.status = status;
  if (department) q.department = department;
  const list = await Complaint.find(q)
    .sort({ createdAt: -1 })
    .populate("department", "name code")
    .populate("createdBy", "name email phone")
    .populate("assignedOfficer", "name email")
    .lean();
  res.json({
    complaints: list.map((c) => ({ ...c, imageUrl: publicImageUrl(c.image) })),
  });
}

export async function updateComplaintAdmin(req, res) {
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ message: "Not found" });

  const {
    status,
    assignedOfficer,
    departmentId,
    note,
    releaseFromSuspicious,
  } = req.body;

  const release =
    releaseFromSuspicious === true ||
    releaseFromSuspicious === "true" ||
    releaseFromSuspicious === 1 ||
    releaseFromSuspicious === "1";

  if (release && (c.status === "suspicious" || c.status === "rejected_fake")) {
    c.status = "assigned";
    if (!c.ticketId || c.ticketId.startsWith("HOLD-")) {
      c.ticketId = generateTicketId();
    }
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (dept) {
        c.department = dept._id;
        c.departmentName = dept.name;
      }
    }
    c.timeline.push({
      stage: "assigned",
      label: "Released by admin",
      note: note || "Complaint verified and routed.",
      by: req.user._id,
    });
  }

  if (status && status !== c.status) {
    c.status = status;
    c.timeline.push({
      stage: status,
      label: `Status updated to ${status}`,
      note: note || "",
      by: req.user._id,
    });
  }

  if (assignedOfficer) {
    const officer = await User.findById(assignedOfficer);
    if (!officer || officer.role !== "department_officer") {
      return res.status(400).json({ message: "Invalid officer" });
    }
    c.assignedOfficer = officer._id;
    c.timeline.push({
      stage: "assigned",
      label: "Officer assigned",
      note: `${officer.name} assigned`,
      by: req.user._id,
    });
  }

  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (dept) {
      c.department = dept._id;
      c.departmentName = dept.name;
    }
  }

  if (req.file) {
    const rel = path.join("uploads", req.file.filename).split(path.sep).join("/");
    c.progressImages = [...(c.progressImages || []), rel];
    c.timeline.push({
      stage: c.status,
      label: "Progress image uploaded (admin)",
      note: note || "",
      by: req.user._id,
    });
  }

  await c.save();
  const populated = await Complaint.findById(c._id)
    .populate("department", "name code")
    .populate("createdBy", "name email")
    .populate("assignedOfficer", "name email")
    .lean();

  emitToComplaint(c._id.toString(), "complaint:updated", { complaintId: c._id, status: c.status });
  emitToUser(c.createdBy.toString(), "complaint:updated", { complaintId: c._id, status: c.status });
  const complaintOwner = await User.findById(c.createdBy).lean();
  await sendEmailNotification({
    to: complaintOwner?.email,
    subject: `VeriClaim update: ${c.ticketId}`,
    text: `Your complaint status is now "${c.status}".`,
  });

  res.json({
    complaint: { ...populated, imageUrl: publicImageUrl(populated.image) },
  });
}

export async function officerUpdateComplaint(req, res) {
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ message: "Not found" });
  const officerDept = req.user.department?.toString();
  if (c.department && c.department.toString() !== officerDept) {
    return res.status(403).json({ message: "Not your department" });
  }

  const { action, note, status } = req.body;

  if (action === "accept") {
    c.assignedOfficer = req.user._id;
    c.officerAccepted = true;
    c.status = "in_progress";
    c.timeline.push({
      stage: "in_progress",
      label: "Officer accepted",
      note: note || "Work in progress",
      by: req.user._id,
    });
  } else if (action === "reject") {
    c.officerAccepted = false;
    c.timeline.push({
      stage: c.status,
      label: "Officer declined assignment",
      note: note || "",
      by: req.user._id,
    });
  }

  if (status === "resolved" || status === "in_progress" || status === "closed") {
    c.status = status;
    c.timeline.push({
      stage: status,
      label: `Status: ${status}`,
      note: note || "",
      by: req.user._id,
    });
  }

  if (req.file) {
    const rel = path.join("uploads", req.file.filename).split(path.sep).join("/");
    c.progressImages = [...(c.progressImages || []), rel];
    c.timeline.push({
      stage: c.status,
      label: "Completion / progress proof uploaded",
      note: note || "",
      by: req.user._id,
    });
  }

  await c.save();
  const populated = await Complaint.findById(c._id)
    .populate("department", "name code")
    .populate("createdBy", "name email")
    .lean();

  emitToComplaint(c._id.toString(), "complaint:updated", { complaintId: c._id, status: c.status });
  emitToUser(c.createdBy.toString(), "complaint:updated", { complaintId: c._id, status: c.status });
  const complaintOwner = await User.findById(c.createdBy).lean();
  await sendEmailNotification({
    to: complaintOwner?.email,
    subject: `VeriClaim update: ${c.ticketId}`,
    text: `Your complaint status is now "${c.status}".`,
  });

  res.json({
    complaint: { ...populated, imageUrl: publicImageUrl(populated.image) },
  });
}

export async function listOfficerComplaints(req, res) {
  const deptId = req.user.department;
  const q = { department: deptId };
  const list = await Complaint.find(q)
    .sort({ createdAt: -1 })
    .populate("department", "name code")
    .populate("createdBy", "name email phone")
    .lean();
  res.json({
    complaints: list.map((c) => ({ ...c, imageUrl: publicImageUrl(c.image) })),
  });
}

export async function deleteComplaintImage(req, res) {
  /** optional cleanup - not exposed; keep for maintenance */
  res.status(501).json({ message: "Not implemented" });
}
