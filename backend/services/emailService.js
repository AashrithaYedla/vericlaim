import nodemailer from "nodemailer";
import { sendEmailNotification } from "./notificationService.js";

let etherealTransporter = null;
let etherealFrom = null;

async function getEtherealTransporter() {
  if (etherealTransporter) return etherealTransporter;
  const testAccount = await nodemailer.createTestAccount();
  etherealFrom = testAccount.user;
  etherealTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log("Ethereal test mailbox ready:", testAccount.user);
  return etherealTransporter;
}

/**
 * Sends OTP email. Uses SMTP from .env when configured;
 * otherwise falls back to Ethereal (preview URL for local testing).
 */
export async function sendVerificationEmail({ to, code, name }) {
  const subject = "VeriClaim email verification code";
  const text = `Hi ${name},\n\nYour VeriClaim verification code is: ${code}\n\nThis code expires in 10 minutes.\nIf you did not request this, ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2>Verify your VeriClaim account</h2>
      <p>Hi ${name},</p>
      <p>Use this one-time code to verify your email:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;color:#0ea5e9">${code}</p>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#64748b;font-size:12px">If you did not create an account, you can ignore this email.</p>
    </div>
  `;

  const smtpResult = await sendEmailNotification({ to, subject, text, html });
  if (smtpResult.sent) {
    return { sent: true, provider: "smtp" };
  }

  try {
    const tx = await getEtherealTransporter();
    const info = await tx.sendMail({
      from: `VeriClaim <${etherealFrom}>`,
      to,
      subject,
      text,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`OTP email for ${to}: ${code}`);
    if (previewUrl) console.log("Email preview:", previewUrl);
    return { sent: true, provider: "ethereal", previewUrl };
  } catch (e) {
    console.error("Failed to send verification email:", e.message);
    // Last-resort local fallback so registration is not blocked offline
    console.log(`[DEV OTP] ${to} => ${code}`);
    return { sent: true, provider: "console", previewUrl: null, devCode: code };
  }
}
