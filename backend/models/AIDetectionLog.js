import mongoose from "mongoose";

const aiDetectionLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    complaintDraft: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      image: { type: String, default: "" },
      location: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
    },
    result: {
      imagePrediction: { type: String, enum: ["real", "fake", "suspicious"], default: "suspicious" },
      textPrediction: { type: String, enum: ["human", "ai_generated", "suspicious"], default: "suspicious" },
      imageAuthenticityScore: { type: Number, default: 0 },
      textAuthenticityScore: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      reasons: [{ type: String }],
      rawImageResponse: { type: mongoose.Schema.Types.Mixed, default: null },
      rawTextResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    action: { type: String, enum: ["accepted", "rejected", "manual_override"], default: "rejected", index: true },
    reviewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("AIDetectionLog", aiDetectionLogSchema);
