"use strict";

require("dotenv").config();
const mqtt = require("mqtt");
const admin = require("firebase-admin");
const fs = require("fs");

// ================================================================
//  Firebase init
// ================================================================
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error("[Firebase] serviceAccountKey.json not found at:", serviceAccountPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: process.env.FIREBASE_DB_URL,
});

const db = admin.database();
console.log("[Firebase] Connected to:", process.env.FIREBASE_DB_URL);

// ================================================================
//  MQTT Topics  — must match ESP32 defines exactly
// ================================================================
const T_ATTENDANCE = "fp/attendance";
const T_ENROLLED = "fp/enrolled";
const T_HEARTBEAT = "fp/heartbeat";
const T_MESSAGE = "fp/message";
const T_STATE_ACK = "fp/stateAck";

const T_SYS_STATE = "fp/systemState";
const T_ENROLL_DATA = "fp/enrollData";

// ================================================================
//  Timestamp validation
//
//  The ESP32 sends ISO-8601 strings like "2025-06-15T14:30:05+05:30".
//  We reject:
//    - anything that parses to before 2020 (stale/unsynced clock)
//    - anything more than 5 minutes in the future (clock skew)
//    - the epoch-0 placeholder "1970-..."
//
//  EPOCH_MIN_MS: 2020-01-01T00:00:00Z in milliseconds
// ================================================================
const EPOCH_MIN_MS = 1577836800000;  // 2020-01-01 UTC
const CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes tolerance

/**
 * validateTimestamp(ts)
 * @param {string} ts  ISO-8601 string from ESP32
 * @returns {{ ok: boolean, epochMs: number, reason?: string }}
 */
function validateTimestamp(ts) {
  if (!ts || typeof ts !== "string") {
    return { ok: false, epochMs: 0, reason: "missing" };
  }
  if (ts.startsWith("1970")) {
    return { ok: false, epochMs: 0, reason: "epoch-0 placeholder" };
  }
  const epochMs = Date.parse(ts);
  if (isNaN(epochMs)) {
    return { ok: false, epochMs: 0, reason: `unparseable: "${ts}"` };
  }
  if (epochMs < EPOCH_MIN_MS) {
    return { ok: false, epochMs, reason: `before 2020 (${new Date(epochMs).toISOString()})` };
  }
  const nowMs = Date.now();
  if (epochMs > nowMs + CLOCK_SKEW_MS) {
    return { ok: false, epochMs, reason: `${Math.round((epochMs - nowMs) / 1000)}s in the future` };
  }
  return { ok: true, epochMs };
}

// ================================================================
//  Deduplication
//
//  Firebase path is /attendance/{id}_{sanitizedTimestamp}.
//  Before writing, we check if that path already exists.
//  This prevents duplicate records when the ESP32 retries a publish.
// ================================================================
async function attendanceRecordExists(path) {
  const snap = await db.ref(path).once("value");
  return snap.exists();
}

// ================================================================
//  Helper — sanitise Firebase key  (mirrors ESP32 sanitizeKey)
// ================================================================
function sanitizeKey(s) {
  return String(s || "unknown")
    .replace(/[.#$[\]/]/g, "-")
    .replace(/[+:]/g, "-")       // also strip ISO timezone separators
    .replace(/\s+/g, "_")
    .trim() || "unknown";
}

// ================================================================
//  Helper — publish with logging
// ================================================================
function mqttPublish(topic, payload, opts = { qos: 1 }) {
  return new Promise((resolve) => {
    mqttClient.publish(topic, payload, opts, (err) => {
      if (err) { console.error(`[MQTT] Publish failed → ${topic}:`, err.message); resolve(false); }
      else { console.log(`[MQTT] → ${topic}: ${payload}`); resolve(true); }
    });
  });
}

// ================================================================
//  MQTT connect
// ================================================================
const mqttUrl = `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT || 8883}`;

const mqttClient = mqtt.connect(mqttUrl, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  clientId: "NodeBridge_" + Math.random().toString(16).slice(2, 8),
  clean: true,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  rejectUnauthorized: false,
});

mqttClient.on("connect", () => {
  console.log("[MQTT] Connected to HiveMQ Cloud");
  const subs = [T_ATTENDANCE, T_ENROLLED, T_HEARTBEAT, T_MESSAGE, T_STATE_ACK];
  mqttClient.subscribe(subs, { qos: 1 }, (err) => {
    if (err) console.error("[MQTT] Subscribe error:", err.message);
    else console.log("[MQTT] Subscribed →", subs.join(", "));
  });
});

mqttClient.on("error", (e) => console.error("[MQTT] Error:", e.message));
mqttClient.on("reconnect", () => console.log("[MQTT] Reconnecting..."));
mqttClient.on("offline", () => console.log("[MQTT] Offline"));
mqttClient.on("disconnect", () => console.log("[MQTT] Disconnected"));

// ================================================================
//  MQTT → Firebase
// ================================================================
mqttClient.on("message", async (topic, buf) => {
  const raw = buf.toString().trim();
  console.log(`[MQTT] ← ${topic}: ${raw}`);

  try {

    // ── fp/attendance ─────────────────────────────────────────
    if (topic === T_ATTENDANCE) {
      const data = JSON.parse(raw);

      if (!data.id || !data.name || !data.timestamp) {
        console.warn("[Bridge] fp/attendance: missing required fields — skipping");
        return;
      }

      // ── Timestamp validation ──────────────────────────────
      const tsCheck = validateTimestamp(data.timestamp);
      if (!tsCheck.ok) {
        console.warn(`[Bridge] fp/attendance: REJECTED bad timestamp — ${tsCheck.reason}`);
        // Write to a quarantine path for manual review instead of discarding silently
        await db.ref("/attendance_quarantine").push({
          raw: data,
          reason: tsCheck.reason,
          receivedAt: new Date().toISOString(),
        });
        return;
      }

      // ntpSynced flag from ESP32 — extra sanity check
      if (data.ntpSynced === false) {
        console.warn("[Bridge] fp/attendance: ESP32 reports ntpSynced=false — quarantining");
        await db.ref("/attendance_quarantine").push({
          raw: data,
          reason: "ESP32 reported ntpSynced=false",
          receivedAt: new Date().toISOString(),
        });
        return;
      }

      // ── Deduplication ────────────────────────────────────
      const key = sanitizeKey(data.timestamp);
      const path = `/attendance/${data.id}_${key}`;

      if (await attendanceRecordExists(path)) {
        console.log(`[Bridge] Duplicate attendance — skipping ${path}`);
        return;
      }

      // ── Write to Firebase ─────────────────────────────────
      await db.ref(path).set({
        id: data.id,
        name: data.name,
        regNum: data.regNum || "",
        timestamp: data.timestamp,              // ESP32's NTP time (authoritative)
        timestampMs: tsCheck.epochMs,             // parsed epoch ms for easy querying
        receivedAt: new Date().toISOString(),    // bridge server time (audit only)
        receivedAtMs: Date.now(),
      });
      console.log(`[Firebase] Attendance written → ${path}`);
      return;
    }

    // ── fp/enrolled ───────────────────────────────────────────
    if (topic === T_ENROLLED) {
      const data = JSON.parse(raw);
      if (!data.id || !data.name) {
        console.warn("[Bridge] fp/enrolled: missing fields — skipping");
        return;
      }

      // Validate enroll timestamp if present (non-fatal if missing)
      let enrolledAtMs = Date.now();
      if (data.enrolledAt) {
        const tsCheck = validateTimestamp(data.enrolledAt);
        if (tsCheck.ok) {
          enrolledAtMs = tsCheck.epochMs;
        } else {
          console.warn(`[Bridge] fp/enrolled: enrolledAt invalid (${tsCheck.reason}) — using server time`);
        }
      }

      await db.ref(`/students/${data.id}`).set({
        id: data.id,
        name: data.name,
        regNum: data.regNum || "",
        enrolledAt: data.enrolledAt || new Date(enrolledAtMs).toISOString(),
        enrolledAtMs: enrolledAtMs,
      });
      console.log(`[Firebase] Student enrolled → /students/${data.id}`);
      return;
    }

    // ── fp/heartbeat ──────────────────────────────────────────
    //  Now receives JSON: { ts: "...", synced: true/false }
    //  Writes both the ESP32 timestamp and bridge-received time.
    if (topic === T_HEARTBEAT) {
      let espTs = null;
      let synced = false;
      try {
        const hb = JSON.parse(raw);
        espTs = hb.ts || null;
        synced = hb.synced || false;
      } catch {
        // Legacy: plain timestamp string
        espTs = raw;
        synced = true;
      }

      // /status stores only the last heartbeat timestamp string
      // so the Firebase branch stays clean: status: "2026-03-24T10:49:14+05:30"
      if (espTs && validateTimestamp(espTs).ok) {
        await db.ref("/status").set(espTs);
      }
      return;
    }

    // ── fp/message ────────────────────────────────────────────
    if (topic === T_MESSAGE) {
      let msg = raw;
      try { msg = JSON.parse(raw).msg || raw; } catch { }
      await db.ref("/messages").push({
        msg,
        receivedAt: new Date().toISOString(),
        receivedAtMs: Date.now(),
      });
      return;
    }

    // ── fp/stateAck ───────────────────────────────────────────
    if (topic === T_STATE_ACK) {
      await db.ref("/systemState").set(raw);
      console.log(`[Firebase] systemState synced ← ${raw}`);

      // When ESP32 returns to VERIFY after an enrollment attempt
      // (success or failure), clean up /messages and /enrollData after 3 s
      if (raw.trim() === "VERIFY") {
        console.log("[Cleanup] VERIFY received → clearing messages...");

        setTimeout(async () => {
          try {
            await db.ref("/messages").remove();
            await db.ref("/enrollData").remove();
            console.log("[Firebase] Cleaned /messages & /enrollData ✅");
          } catch (e) {
            console.error("[Firebase] Cleanup error:", e.message);
          }
        }, 2000);
      }
      return;
    }

  } catch (e) {
    console.error("[Bridge] Message handler error:", e.message, "| raw:", raw);
  }
});

// ================================================================
//  Firebase → MQTT
//  Watches for enroll commands and forwards to ESP32.
// ================================================================
let lastPublishedState = "VERIFY";

db.ref("/systemState").on("value", async (snap) => {
  const state = snap.val();
  if (!state) return;
  if (state !== "ENROLL") return;
  if (lastPublishedState === "ENROLL") return;
  lastPublishedState = "ENROLL";

  console.log("[Firebase] systemState = ENROLL detected");

  try {
    const enrollSnap = await db.ref("/enrollData").once("value");
    const enrollData = enrollSnap.val();

    if (!enrollData || !enrollData.name || !enrollData.regNum) {
      console.warn("[Bridge] /enrollData missing or incomplete — aborting enroll");
      await db.ref("/systemState").set("VERIFY");
      lastPublishedState = "VERIFY";
      return;
    }

    const dataPayload = JSON.stringify({
      name: enrollData.name,
      regNum: enrollData.regNum,
    });
    await mqttPublish(T_ENROLL_DATA, dataPayload);

    await new Promise(r => setTimeout(r, 300));

    await mqttPublish(T_SYS_STATE, "ENROLL");
    console.log("[Bridge] Enroll command dispatched →", enrollData.name, enrollData.regNum);

  } catch (e) {
    console.error("[Bridge] Enroll dispatch error:", e.message);
    await db.ref("/systemState").set("VERIFY");
    lastPublishedState = "VERIFY";
  }
});

// Reset guard when ESP32 acknowledges VERIFY
db.ref("/systemState").on("value", (snap) => {
  const state = snap.val();
  if (state === "VERIFY") lastPublishedState = "VERIFY";
});

// ================================================================
//  Graceful shutdown
// ================================================================
async function shutdown(signal) {
  console.log(`\n[Bridge] ${signal} received — shutting down...`);
  db.ref("/systemState").off();
  mqttClient.end(true, {}, () => console.log("[MQTT] Client closed"));
  await admin.app().delete();
  console.log("[Bridge] Shutdown complete");
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log("[Bridge] Started — listening for MQTT messages and Firebase events...");