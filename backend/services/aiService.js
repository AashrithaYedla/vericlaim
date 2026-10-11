import axios from "axios";
import fs from "fs";
import path from "path";
import Complaint from "../models/Complaint.js";
import { CATEGORY_TO_DEPARTMENT, CATEGORIES } from "../constants/categories.js";

const GENERIC_PHRASES = [
  "lorem ipsum",
  "as an ai",
  "i cannot assist",
  "this is a test complaint",
  "fake complaint",
  "sample text",
];

const KEYWORD_MAP = [
  { keys: ["garbage", "trash", "waste", "litter", "dump"], cat: "garbage" },
  { keys: ["water leak", "leakage", "pipe burst", "flood", "no water"], cat: "water_leakage" },
  { keys: ["drain", "sewage", "clog", "manhole"], cat: "drainage" },
  { keys: ["road", "pothole", "crack", "asphalt"], cat: "road_damage" },
  { keys: ["electric", "power outage", "blackout", "wire", "transformer"], cat: "electricity" },
  { keys: ["street light", "lamp post", "dark street"], cat: "street_light" },
  { keys: ["pollution", "smoke", "dust", "chemical"], cat: "pollution" },
];

function scoreTextCategory(text) {
  const t = text.toLowerCase();
  let best = { cat: "other", score: 0 };
  for (const row of KEYWORD_MAP) {
    let s = 0;
    for (const k of row.keys) {
      if (t.includes(k)) s += 1;
    }
    if (s > best.score) best = { cat: row.cat, score: s };
  }
  const confidence = Math.min(0.95, 0.35 + best.score * 0.15);
  return { category: best.cat, categoryConfidence: best.score === 0 ? 0.25 : confidence };
}

function repetitiveScore(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 8) return 0;
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  const max = Math.max(...Object.values(counts));
  return Math.min(1, max / words.length);
}

function textFakeHeuristic(description, title) {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;
  const reasons = [];

  if (description.length < 20) {
    score += 0.25;
    reasons.push("Description is very short");
  }
  for (const g of GENERIC_PHRASES) {
    if (text.includes(g)) {
      score += 0.35;
      reasons.push(`Contains generic or AI-like phrase: "${g}"`);
      break;
    }
  }
  const rep = repetitiveScore(description);
  if (rep > 0.35) {
    score += 0.2;
    reasons.push("Highly repetitive wording");
  }
  if (/^(.)\1{10,}/.test(description.replace(/\s/g, ""))) {
    score += 0.3;
    reasons.push("Repeated character pattern");
  }
  return { score: Math.min(1, score), reasons };
}

function imageHeuristic(imagePath) {
  const reasons = [];
  let score = 0;
  if (!imagePath) return { score: 0, reasons: [] };
  try {
    const rel = imagePath.replace(/^\//, "");
    const full = path.join(process.cwd(), rel);
    const stat = fs.statSync(full);
    if (stat.size < 8000) {
      score += 0.25;
      reasons.push("Image file unusually small (possible placeholder)");
    }
    if (stat.size > 4.5 * 1024 * 1024) {
      score += 0.1;
      reasons.push("Very large image");
    }
  } catch {
    score += 0.15;
    reasons.push("Could not read image metadata");
  }
  return { score: Math.min(1, score), reasons };
}

async function callExternalAI({ title, description, imageRelativePath }) {
  const url = process.env.AI_SERVICE_URL || "http://localhost:8000";
  try {
    const payload = { title, description, image_path: imageRelativePath || null };
    const { data } = await axios.post(`${url.replace(/\/$/, "")}/analyze`, payload, { timeout: 15000 });
    return data;
  } catch (e) {
    console.warn("AI microservice unavailable, using local heuristics:", e.message);
    return null;
  }
}


/**
 * Merge local heuristics with optional FastAPI `/analyze` response.
 */
export async function analyzeComplaint({ title, description, imageRelativePath, userId }) {
  const localCat = scoreTextCategory(`${title} ${description}`);
  const textH = textFakeHeuristic(description, title);
  const imgH = imageHeuristic(imageRelativePath);

  let spamScore = 0;
  const spamReasons = [];
  if (userId) {
    const recent = await Complaint.countDocuments({
      createdBy: userId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recent >= 5) {
      spamScore = 0.6;
      spamReasons.push("Many complaints submitted in the last hour");
    }
  }

  const external = await callExternalAI({ title, description, imageRelativePath });

  let category = localCat.category;
  let categoryConfidence = localCat.categoryConfidence;
  let textFakeScore = textH.score;
  let imageFakeScore = imgH.score;
  const reasons = [...textH.reasons, ...imgH.reasons, ...spamReasons];

  if (external && typeof external === "object") {
    if (external.category && CATEGORIES.includes(external.category)) {
      category = external.category;
    }
    if (typeof external.category_confidence === "number") {
      categoryConfidence = Math.max(categoryConfidence, external.category_confidence);
    }
    if (typeof external.text_fake_score === "number") {
      textFakeScore = Math.max(textFakeScore, external.text_fake_score);
    }
    if (typeof external.image_fake_score === "number") {
      imageFakeScore = Math.max(imageFakeScore, external.image_fake_score);
    }
    if (Array.isArray(external.reasons)) reasons.push(...external.reasons);
  }

  const combinedFake = Math.min(1, 0.5 * textFakeScore + 0.35 * imageFakeScore + 0.4 * spamScore);
  const threshold = Number(process.env.AI_FAKE_THRESHOLD || 0.65);
  const isSuspicious = combinedFake >= threshold;

  const departmentName = CATEGORY_TO_DEPARTMENT[category] || CATEGORY_TO_DEPARTMENT.other;
  const overallGenuine = !isSuspicious;

  return {
    category,
    categoryConfidence,
    textFakeScore,
    imageFakeScore,
    spamScore,
    overallGenuine,
    isSuspicious,
    reasons,
    departmentName,
    rawServiceResponse: external,
  };
}
