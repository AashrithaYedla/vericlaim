import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["citizen", "admin", "department_officer"],
      default: "citizen",
    },
    phone: { type: String, trim: true, default: "" },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    emailVerified: { type: Boolean, default: false },
    otpHash: { type: String, select: false, default: null },
    otpExpires: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.virtual("isLocked").get(function isLocked() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

export default mongoose.model("User", userSchema);
