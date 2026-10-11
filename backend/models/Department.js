import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    helplineNumber: { type: String, default: "" },
    officeAddress: { type: String, default: "" },
    supportHours: { type: String, default: "Mon-Fri 09:00-18:00" },
    emergencyContact: { type: String, default: "" },
    socialLinks: {
      website: { type: String, default: "" },
      facebook: { type: String, default: "" },
      x: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    /** User ids who are officers for this department */
    officers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
