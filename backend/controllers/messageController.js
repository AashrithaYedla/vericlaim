import Message from "../models/Message.js";
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import { emitToUser, emitToComplaint } from "../utils/socket.js";

async function assertComplaintAccess(user, complaint) {
  if (user.role === "admin") return true;
  if (user.role === "citizen" && complaint.createdBy.toString() === user._id.toString()) return true;
  if (user.role === "department_officer") {
    const same = complaint.department && complaint.department.toString() === user.department?.toString();
    const assigned = complaint.assignedOfficer && complaint.assignedOfficer.toString() === user._id.toString();
    return same || assigned;
  }
  return false;
}

export async function listMessages(req, res) {
  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint) return res.status(404).json({ message: "Complaint not found" });
  if (!(await assertComplaintAccess(req.user, complaint))) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const messages = await Message.find({ complaintId: complaint._id })
    .sort({ createdAt: 1 })
    .populate("sender", "name email role")
    .populate("receiver", "name email role")
    .lean();
  res.json({ messages });
}

export async function sendMessage(req, res) {
  const { body, receiverId } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ message: "Message body required" });
  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint) return res.status(404).json({ message: "Complaint not found" });
  if (!(await assertComplaintAccess(req.user, complaint))) {
    return res.status(403).json({ message: "Forbidden" });
  }

  let receiver = null;
  if (receiverId) {
    receiver = await User.findById(receiverId);
    if (!receiver) return res.status(400).json({ message: "Receiver not found" });
  } else {
    if (req.user.role === "citizen") {
      receiver = await User.findOne({ role: "admin" });
      if (!receiver) return res.status(400).json({ message: "No admin to message" });
    } else if (req.user.role === "department_officer") {
      receiver = await User.findById(complaint.createdBy);
    } else {
      receiver = await User.findById(complaint.createdBy);
    }
  }

  const msg = await Message.create({
    complaintId: complaint._id,
    sender: req.user._id,
    receiver: receiver._id,
    body: body.trim().slice(0, 4000),
  });

  const populated = await Message.findById(msg._id)
    .populate("sender", "name email role")
    .populate("receiver", "name email role")
    .lean();

  emitToComplaint(complaint._id.toString(), "message:new", populated);
  emitToUser(receiver._id.toString(), "message:new", populated);

  res.status(201).json({ message: populated });
}
