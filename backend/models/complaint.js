import mongoose from "mongoose";
import { CATEGORIES } from "../constants/categories.js";

const timelineSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    label: { type: String, required: true },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    location: { type: String, default: "" },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "other",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentName: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "submitted",
        "ai_verification",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
        "suspicious",
        "rejected_fake",
      ],
      default: "submitted",
    },
    /** Structured AI / rules engine output */
    aiResult: {
      categoryConfidence: { type: Number, default: 0 },
      textFakeScore: { type: Number, default: 0 },
      imageFakeScore: { type: Number, default: 0 },
      spamScore: { type: Number, default: 0 },
      overallGenuine: { type: Boolean, default: true },
      isSuspicious: { type: Boolean, default: false },
      reasons: [{ type: String }],
      rawServiceResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    timeline: [timelineSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    officerAccepted: { type: Boolean, default: null },
    progressImages: [{ type: String }],
    contactPhone: { type: String, default: "" },
  },
  { timestamps: true }
);

complaintSchema.index({ createdBy: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ department: 1 });

export default mongoose.model("Complaint", complaintSchema);
