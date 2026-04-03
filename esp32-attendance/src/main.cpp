#include <Wire.h>
#include <Adafruit_SH110X.h>
#include <Adafruit_Fingerprint.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "time.h"
#include "esp_sntp.h"
#include "secrets.h"
#include <EEPROM.h>

//  OLED
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 128
Adafruit_SH1107 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire);

int16_t  tx1, ty1;
uint16_t tw, th;
String   bottomMsg  = "Waiting...";
unsigned long lastTopUpdate = 0;

//  AS608
HardwareSerial mySerial(1);
#define RX_PIN 18
#define TX_PIN 19
Adafruit_Fingerprint finger(&mySerial);

//  LEDs
#define GREEN_LED 2
#define RED_LED   4

//  NTP / Time
const char *ntpServer          = "pool.ntp.org";
const char *ntpServer2         = "time.cloudflare.com";
const long  gmtOffset_sec      = 19800;
const int   daylightOffset_sec = 0;
#define TZ_SUFFIX "+05:30"

#define NTP_RESYNC_INTERVAL_MS  3600000UL
#define NTP_STALE_MS            7200000UL

volatile bool ntpSynced     = false;
unsigned long ntpSyncedAtMs = 0;
unsigned long lastNTPResync = 0;

// Welcome message 2-second hold
// 0 = no hold active. Set to millis() on match. Cleared by loop() after 2000ms.
unsigned long welcomeShownAt = 0;

//  EEPROM layout
#define EEPROM_SIZE             4096
#define MAX_STUDENTS            50
#define MAX_OFFLINE_ATTENDANCE  30
#define STUDENT_NAME_LEN        20
#define STUDENT_REG_LEN         15
#define TS_LEN                  26
#define STUDENT_RECORD_SIZE     (1 + STUDENT_NAME_LEN + STUDENT_REG_LEN)
#define STUDENTS_EEPROM_SIZE    (1 + (MAX_STUDENTS * STUDENT_RECORD_SIZE))
#define OFFLINE_RECORD_SIZE     (1 + STUDENT_NAME_LEN + STUDENT_REG_LEN + TS_LEN)
#define OFFLINE_EEPROM_SIZE     (1 + (MAX_OFFLINE_ATTENDANCE * OFFLINE_RECORD_SIZE))
#define OFFLINE_START_ADDR      (STUDENTS_EEPROM_SIZE)

#if (STUDENTS_EEPROM_SIZE + OFFLINE_EEPROM_SIZE) > EEPROM_SIZE
  #error "EEPROM layout exceeds EEPROM_SIZE"
#endif

//  MQTT topics
#define TOPIC_ATTENDANCE   "fp/attendance"
#define TOPIC_ENROLLED     "fp/enrolled"
#define TOPIC_HEARTBEAT    "fp/heartbeat"
#define TOPIC_MESSAGE      "fp/message"
#define TOPIC_STATE_PUB    "fp/stateAck"
#define TOPIC_SYS_STATE    "fp/systemState"
#define TOPIC_ENROLL_DATA  "fp/enrollData"
#define MQTT_BUF_SIZE 512

//  MQTT client
WiFiClientSecure wifiSecure;
PubSubClient     mqttClient(wifiSecure);
bool             mqttConnected = false;

volatile bool newStateReceived  = false;
volatile bool newEnrollReceived = false;
char mqttStateBuf[16]                    = "VERIFY";
char mqttEnrollNameBuf[STUDENT_NAME_LEN] = {0};
char mqttEnrollRegBuf[STUDENT_REG_LEN]   = {0};

//  Data structures
struct Student {
  uint8_t id;
  char    name[STUDENT_NAME_LEN];
  char    regNum[STUDENT_REG_LEN];
};
Student students[MAX_STUDENTS];
uint8_t studentCount = 0;

struct Attendance {
  uint8_t id;
  char    name[STUDENT_NAME_LEN];
  char    regNum[STUDENT_REG_LEN];
  char    timestamp[TS_LEN];
};
Attendance offlineAttendance[MAX_OFFLINE_ATTENDANCE];
uint8_t    offlineCount = 0;

enum SystemState { VERIFY, ENROLL };
SystemState currentState = VERIFY;

//  Function prototypes
void    oledTop();
void    oledBottom(const String &msg, bool sendToMQTT = false);
void    oledBottomRefresh();
void    oledProgressBar(uint8_t percent);
void    oledShowState();
void    enrollFinger();
void    verifyFingerNonBlocking();
bool    mqttPublish(const char *topic, const String &payload, bool retained = false);
String  getTimestamp();
bool    isTimeSynced();
bool    waitForNTPSync(uint32_t timeoutMs);
void    triggerNTPResync();
void    reconnectWiFi();
void    reconnectMQTT();
void    mqttCallback(char *topic, byte *payload, unsigned int length);
void    saveStudentsToEEPROM();
void    loadStudentsFromEEPROM();
void    saveOfflineAttendanceToEEPROM();
void    loadOfflineAttendanceFromEEPROM();
void    syncOfflineAttendance();
void    removeOfflineRecordAt(uint8_t idx);
bool    safeEEPROMWrite(int addr, const uint8_t *buf, size_t len);
String  sanitizeKey(const String &s);

// ─────────────────────────────────────────────────────────────
//  NTP
// ─────────────────────────────────────────────────────────────
void ntpSyncCallback(struct timeval *tv) {
  ntpSynced     = true;
  ntpSyncedAtMs = millis();
  Serial.printf("[NTP] Synced — epoch=%llu\n", (unsigned long long)tv->tv_sec);
}

bool isTimeSynced() {
  if (!ntpSynced) return false;
  if ((millis() - ntpSyncedAtMs) > NTP_STALE_MS) {
    ntpSynced = false;
    Serial.println("[NTP] Sync stale — forcing resync");
    return false;
  }
  return true;
}

bool waitForNTPSync(uint32_t timeoutMs = 10000) {
  uint32_t start = millis();
  while (sntp_get_sync_status() == SNTP_SYNC_STATUS_RESET) {
    if (millis() - start > timeoutMs) {
      Serial.println("[NTP] Sync timeout");
      return false;
    }
    delay(100);
  }
  ntpSynced     = true;
  ntpSyncedAtMs = millis();
  return true;
}

void triggerNTPResync() {
  Serial.println("[NTP] Forcing resync...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer, ntpServer2);
}

String getTimestamp() {
  if (!isTimeSynced()) {
    Serial.println("[Time] Not synced");
    return "";
  }
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("[Time] getLocalTime() failed");
    return "";
  }
  char buffer[TS_LEN];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S" TZ_SUFFIX, &timeinfo);
  return String(buffer);
}

// ─────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n--- ESP32 Fingerprint Attendance (MQTT) ---");

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED,   OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED,   LOW);

  if (!EEPROM.begin(EEPROM_SIZE)) Serial.println("[EEPROM] begin failed!");
  loadStudentsFromEEPROM();
  loadOfflineAttendanceFromEEPROM();

  Wire.begin(21, 22);
  if (!display.begin(0x3C, true)) {
    Serial.println(F("[OLED] init failed"));
    while (1) delay(10);
  }
  display.clearDisplay();
  display.setRotation(0);
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  oledBottom("System Booting...");

  mySerial.begin(57600, SERIAL_8N1, RX_PIN, TX_PIN);
  delay(100);
  oledBottom("Checking AS608...");
  if (finger.verifyPassword()) {
    oledBottom("AS608 Found!");
    Serial.println("[FP] AS608 found");
  } else {
    oledBottom("AS608 NOT FOUND!");
    Serial.println("[FP] AS608 NOT FOUND");
    digitalWrite(RED_LED, HIGH);
    while (1) delay(1);
  }

  oledBottom("Connecting WiFi...");
  reconnectWiFi();
  oledBottom(WiFi.status() == WL_CONNECTED ? "WiFi OK!" : "WiFi FAILED!");

  sntp_set_time_sync_notification_cb(ntpSyncCallback);
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer, ntpServer2);

  oledBottom("Syncing time...");
  if (waitForNTPSync(12000)) {
    struct tm t;
    if (getLocalTime(&t) && t.tm_year > 100) {
      oledBottom("Time synced!");
      Serial.printf("[NTP] OK: %04d-%02d-%02d %02d:%02d:%02d\n",
                    t.tm_year + 1900, t.tm_mon + 1, t.tm_mday,
                    t.tm_hour, t.tm_min, t.tm_sec);
    } else {
      ntpSynced = false;
      oledBottom("Time: bad value!");
      Serial.println("[NTP] getLocalTime returned insane value");
    }
  } else {
    oledBottom("Time sync failed!");
  }
  lastNTPResync = millis();

  wifiSecure.setInsecure();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(MQTT_BUF_SIZE);

  oledBottom("Connecting MQTT...");
  reconnectMQTT();
  oledBottom(mqttConnected ? "MQTT Ready!" : "MQTT Failed!");
  delay(600);

  currentState = VERIFY;
  bottomMsg    = "Place finger...";
  oledShowState();
}

// ─────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────
unsigned long lastHeartbeat   = 0;
unsigned long lastOfflineSync = 0;

void loop() {
  if (!mqttClient.connected()) {
    mqttConnected = false;
    reconnectMQTT();
  } else {
    mqttConnected = true;
  }
  mqttClient.loop();

  if (WiFi.status() != WL_CONNECTED) reconnectWiFi();

  if (WiFi.status() == WL_CONNECTED &&
      millis() - lastNTPResync > NTP_RESYNC_INTERVAL_MS) {
    triggerNTPResync();
    lastNTPResync = millis();
  }

  if (millis() - lastTopUpdate > 1000) {
    oledTop();
    lastTopUpdate = millis();
  }

  // ── Welcome message 2-second hold ──────────────────────────
  // After 2s, clear hold and revert display to VERIFY state
  if (welcomeShownAt > 0 && millis() - welcomeShownAt >= 2000) {
    welcomeShownAt = 0;
    bottomMsg = "Place finger...";
    oledShowState();
  }

  if (mqttConnected && millis() - lastHeartbeat > 2000) {
    String ts = getTimestamp();
    if (ts.length() > 0) {
      StaticJsonDocument<128> hb;
      hb["ts"]     = ts;
      hb["synced"] = isTimeSynced();
      String hbPayload;
      serializeJson(hb, hbPayload);
      mqttPublish(TOPIC_HEARTBEAT, hbPayload);
    }
    lastHeartbeat = millis();
  }

  if (mqttConnected && isTimeSynced() &&
      offlineCount > 0 && millis() - lastOfflineSync > 3000) {
    syncOfflineAttendance();
    lastOfflineSync = millis();
  }

  if (newStateReceived) {
    newStateReceived = false;
    String s(mqttStateBuf);
    Serial.printf("[State] → %s\n", s.c_str());
    if (s == "ENROLL") {
      currentState = ENROLL;
    } else {
      currentState   = VERIFY;
      welcomeShownAt = 0;
      bottomMsg      = "Place finger...";
      oledShowState();
    }
  }

  if (currentState == ENROLL) {
    welcomeShownAt = 0;
    oledBottom("Enrollment Started...", true);
    Serial.println("[Enroll] Waiting for fp/enrollData...");

    unsigned long waitStart = millis();
    while (!newEnrollReceived && millis() - waitStart < 12000) {
      mqttClient.loop();
      if (millis() - lastTopUpdate > 1000) { oledTop(); lastTopUpdate = millis(); }
      delay(50);
    }

    if (newEnrollReceived) {
      newEnrollReceived = false;
      Serial.printf("[Enroll] Data: name=%s regNum=%s\n",
                    mqttEnrollNameBuf, mqttEnrollRegBuf);
      enrollFinger();
      oledBottom("Enrollment Complete!", true);
      delay(1000);
    } else {
      Serial.println("[Enroll] Timeout — no fp/enrollData received");
      oledBottom("No enroll data!", true);
      digitalWrite(RED_LED, HIGH); delay(1500); digitalWrite(RED_LED, LOW);
    }

    memset(mqttEnrollNameBuf, 0, STUDENT_NAME_LEN);
    memset(mqttEnrollRegBuf,  0, STUDENT_REG_LEN);
    newEnrollReceived = false;

    currentState = VERIFY;
    mqttPublish(TOPIC_STATE_PUB, "VERIFY", true);
    bottomMsg = "Place finger...";
    oledShowState();
  }

  if (currentState == VERIFY) {
    verifyFingerNonBlocking();
  }

  delay(10);
}

// ─────────────────────────────────────────────────────────────
//  MQTT CALLBACK
// ─────────────────────────────────────────────────────────────
void mqttCallback(char *topic, byte *payload, unsigned int length) {
  char buf[MQTT_BUF_SIZE];
  unsigned int len = min(length, (unsigned int)(MQTT_BUF_SIZE - 1));
  memcpy(buf, payload, len);
  buf[len] = '\0';

  String topicStr(topic);
  Serial.printf("[MQTT] ← %s : %s\n", topic, buf);

  if (topicStr == TOPIC_SYS_STATE) {
    strncpy(mqttStateBuf, buf, sizeof(mqttStateBuf) - 1);
    mqttStateBuf[sizeof(mqttStateBuf) - 1] = '\0';
    newStateReceived = true;
    return;
  }

  if (topicStr == TOPIC_ENROLL_DATA) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, buf) == DeserializationError::Ok) {
      strncpy(mqttEnrollNameBuf, doc["name"]   | "", STUDENT_NAME_LEN - 1);
      strncpy(mqttEnrollRegBuf,  doc["regNum"] | "", STUDENT_REG_LEN  - 1);
      mqttEnrollNameBuf[STUDENT_NAME_LEN - 1] = '\0';
      mqttEnrollRegBuf[STUDENT_REG_LEN   - 1] = '\0';
      newEnrollReceived = true;
      Serial.printf("[MQTT] Enroll parsed: %s / %s\n",
                    mqttEnrollNameBuf, mqttEnrollRegBuf);
    } else {
      Serial.println("[MQTT] fp/enrollData parse FAILED");
    }
    return;
  }
}

// ─────────────────────────────────────────────────────────────
//  MQTT publish helper
// ─────────────────────────────────────────────────────────────
bool mqttPublish(const char *topic, const String &payload, bool retained) {
  if (!mqttClient.connected()) return false;
  bool ok = mqttClient.publish(topic, payload.c_str(), retained);
  Serial.printf("[MQTT] %s → %s\n", ok ? "PUB" : "FAIL", topic);
  return ok;
}

// ─────────────────────────────────────────────────────────────
//  OLED — top half
// ─────────────────────────────────────────────────────────────
void oledTop() {
  display.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.print(WiFi.status() == WL_CONNECTED ? "WiFi:Ok" : "WiFi:X");
  display.setCursor(85, 0);
  display.print(mqttConnected ? "MQTT:Ok" : "MQTT:X");

  struct tm t;
  char buf[22];
  if (isTimeSynced() && getLocalTime(&t)) {
    strftime(buf, sizeof(buf), "%d-%m | %H:%M:%S", &t);
  } else {
    strncpy(buf, "No time sync", sizeof(buf));
  }
  display.getTextBounds(buf, 0, 20, &tx1, &ty1, &tw, &th);
  display.setCursor((SCREEN_WIDTH - tw) / 2, 20);
  display.println(buf);

  String label = "FOC - SE";
  display.setTextSize(2);
  display.getTextBounds(label, 0, 40, &tx1, &ty1, &tw, &th);
  display.setCursor((SCREEN_WIDTH - tw) / 2, 40);
  display.println(label);
  display.setTextSize(1);

  display.drawLine(0, SCREEN_HEIGHT / 2 - 1,
                   SCREEN_WIDTH, SCREEN_HEIGHT / 2 - 1, SH110X_WHITE);
  display.display();
}

// ─────────────────────────────────────────────────────────────
//  OLED — bottom half
// ─────────────────────────────────────────────────────────────
void oledBottom(const String &msg, bool sendToMQTT) {
  bottomMsg = msg;
  display.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setCursor(0, SCREEN_HEIGHT / 2 + 2);
  display.println(bottomMsg);

  if (WiFi.status() != WL_CONNECTED || !mqttConnected) {
    display.setCursor(0, SCREEN_HEIGHT - 10);
    display.print("Offline: ");
    display.print(offlineCount);
  }
  display.display();

  if (sendToMQTT && mqttConnected) {
    StaticJsonDocument<128> doc;
    doc["msg"] = bottomMsg;
    String p;
    serializeJson(doc, p);
    mqttPublish(TOPIC_MESSAGE, p);
  }
}

void oledBottomRefresh() { oledBottom(bottomMsg); }

void oledShowState() {
  display.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setTextSize(2);
  String stateLabel = (currentState == ENROLL) ? "ENROLL" : "VERIFY";
  display.getTextBounds(stateLabel, 0, SCREEN_HEIGHT / 2 + 2, &tx1, &ty1, &tw, &th);
  display.setCursor((SCREEN_WIDTH - tw) / 2, SCREEN_HEIGHT / 2 + 2);
  display.println(stateLabel);
  display.setTextSize(1);
  display.setCursor(0, SCREEN_HEIGHT / 2 + 22);
  display.println(bottomMsg);
  if (WiFi.status() != WL_CONNECTED || !mqttConnected) {
    display.setCursor(0, SCREEN_HEIGHT - 10);
    display.print("Offline: ");
    display.print(offlineCount);
  }
  display.display();
}

void oledProgressBar(uint8_t percent) {
  uint8_t barWidth  = SCREEN_WIDTH - 4;
  uint8_t fillWidth = (barWidth * percent) / 100;
  display.fillRect(2, SCREEN_HEIGHT - 12, barWidth, 10, SH110X_BLACK);
  display.drawRect(2, SCREEN_HEIGHT - 12, barWidth, 10, SH110X_WHITE);
  if (fillWidth > 0)
    display.fillRect(2, SCREEN_HEIGHT - 12, fillWidth, 10, SH110X_WHITE);
  display.display();
}

// ─────────────────────────────────────────────────────────────
//  ENROLLMENT
// ─────────────────────────────────────────────────────────────
void enrollFinger() {
  if (studentCount >= MAX_STUDENTS) {
    oledBottom("Max students!", true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  String name   = String(mqttEnrollNameBuf);
  String regNum = String(mqttEnrollRegBuf);

  if (name.length() == 0 || regNum.length() == 0) {
    oledBottom("Invalid data!", true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  uint8_t id = studentCount + 1;
  int p      = -1;

  oledProgressBar(0);
  oledBottom("Place finger to enroll...", true);
  unsigned long start = millis();

  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p != FINGERPRINT_NOFINGER) oledBottom("Image error!", true);
    oledProgressBar((uint8_t)min(100UL, (millis() - start) * 100UL / 15000UL));
    if (millis() - lastTopUpdate > 1000) { oledTop(); lastTopUpdate = millis(); }
    if (millis() - start > 15000UL) {
      oledBottom("Enroll timeout", true);
      oledProgressBar(0);
      return;
    }
    delay(80);
  }
  oledProgressBar(0);

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    oledBottom("Image fail", true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  if (finger.fingerSearch() == FINGERPRINT_OK) {
    oledBottom("Already Enrolled!", true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  oledBottom("Remove finger", true);
  delay(800);
  while (finger.getImage() != FINGERPRINT_NOFINGER) delay(20);

  oledProgressBar(0);
  oledBottom("Place again...", true);
  start = millis();

  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p != FINGERPRINT_NOFINGER) oledBottom("Image error!", true);
    oledProgressBar((uint8_t)min(100UL, (millis() - start) * 100UL / 15000UL));
    if (millis() - lastTopUpdate > 1000) { oledTop(); lastTopUpdate = millis(); }
    if (millis() - start > 15000UL) {
      oledBottom("Enroll timeout", true);
      oledProgressBar(0);
      return;
    }
    delay(80);
  }
  oledProgressBar(0);

  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    oledBottom("2nd fail", true);
    digitalWrite(RED_LED, HIGH); delay(900); digitalWrite(RED_LED, LOW);
    return;
  }
  if (finger.createModel() != FINGERPRINT_OK) {
    oledBottom("Model fail", true);
    digitalWrite(RED_LED, HIGH); delay(900); digitalWrite(RED_LED, LOW);
    return;
  }
  if (finger.storeModel(id) != FINGERPRINT_OK) {
    oledBottom("Store fail", true);
    digitalWrite(RED_LED, HIGH); delay(900); digitalWrite(RED_LED, LOW);
    return;
  }

  students[studentCount].id = id;
  memset(students[studentCount].name,   0, STUDENT_NAME_LEN);
  memset(students[studentCount].regNum, 0, STUDENT_REG_LEN);
  name.toCharArray(students[studentCount].name,     STUDENT_NAME_LEN);
  regNum.toCharArray(students[studentCount].regNum, STUDENT_REG_LEN);
  studentCount++;
  saveStudentsToEEPROM();

  StaticJsonDocument<256> doc;
  doc["id"]         = id;
  doc["name"]       = name;
  doc["regNum"]     = regNum;
  doc["enrolledAt"] = getTimestamp();
  String payload;
  serializeJson(doc, payload);
  mqttPublish(TOPIC_ENROLLED, payload);

  oledBottom("Enroll Success: " + name, true);
  Serial.printf("[Enroll] OK id=%d name=%s\n", id, name.c_str());
  digitalWrite(GREEN_LED, HIGH); delay(900); digitalWrite(GREEN_LED, LOW);
}

// ─────────────────────────────────────────────────────────────
//  VERIFICATION  (non-blocking, polled every 300ms)
//
//  Welcome hold:
//    welcomeShownAt > 0  →  hold active, skip all sensor polling
//    loop() clears it after 2000ms and reverts display
// ─────────────────────────────────────────────────────────────
void verifyFingerNonBlocking() {
  static unsigned long lastCheck = 0;

  // Block all sensor polling while welcome message is showing
  if (welcomeShownAt > 0) return;

  if (millis() - lastCheck < 300) return;
  lastCheck = millis();

  int p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER) {
    if (!isTimeSynced()) {
      oledBottom("No time sync!");
    } else {
      oledBottom("Place finger...");
    }
    return;
  }
  if (p != FINGERPRINT_OK)                  { oledBottom("Image error!");    return; }
  if (finger.image2Tz(1) != FINGERPRINT_OK) { oledBottom("Image conv fail"); return; }

  if (finger.fingerFastSearch() == FINGERPRINT_OK) {
    uint8_t id     = finger.fingerID;
    String  name   = "Unknown";
    String  regNum = "";

    for (uint8_t i = 0; i < studentCount; i++) {
      if (students[i].id == id) {
        name   = String(students[i].name);
        regNum = String(students[i].regNum);
        break;
      }
    }

    String timestamp  = getTimestamp();
    bool   timeSyncOk = (timestamp.length() > 0);

    if (timeSyncOk) {
      // Show welcome and start the 2-second hold
      oledBottom("Welcome:\n-> " + name);
      welcomeShownAt = millis();
    } else {
      Serial.println("[Verify] Time not synced — storing offline");
      oledBottom("No time sync!\nStored offline.");
      // No hold for warning messages
    }

    digitalWrite(GREEN_LED, HIGH); delay(180); digitalWrite(GREEN_LED, LOW);
    Serial.printf("[Verify] id=%d name=%s ts=%s synced=%d\n",
                  id, name.c_str(), timestamp.c_str(), (int)timeSyncOk);

    Attendance rec;
    rec.id = id;
    memset(rec.name,      0, STUDENT_NAME_LEN);
    memset(rec.regNum,    0, STUDENT_REG_LEN);
    memset(rec.timestamp, 0, TS_LEN);
    name.toCharArray(rec.name,     STUDENT_NAME_LEN);
    regNum.toCharArray(rec.regNum, STUDENT_REG_LEN);
    if (timeSyncOk) {
      timestamp.toCharArray(rec.timestamp, TS_LEN);
    } else {
      strncpy(rec.timestamp, "1970-01-01T00:00:00+05:30", TS_LEN - 1);
    }

    StaticJsonDocument<300> doc;
    doc["id"]        = id;
    doc["name"]      = name;
    doc["regNum"]    = regNum;
    doc["timestamp"] = rec.timestamp;
    doc["ntpSynced"] = timeSyncOk;
    String payload;
    serializeJson(doc, payload);

    bool shouldPublish = mqttConnected && timeSyncOk;

    if (shouldPublish && mqttPublish(TOPIC_ATTENDANCE, payload)) {
      // Published OK — welcome holds for 2s, loop() reverts display
    } else {
      if (offlineCount < MAX_OFFLINE_ATTENDANCE) {
        offlineAttendance[offlineCount] = rec;
        offlineCount++;
        saveOfflineAttendanceToEEPROM();
        if (timeSyncOk) {
          welcomeShownAt = 0;   // cancel hold, show offline notice instead
          oledBottom(mqttConnected ? "Saved offline!" : "Offline stored!");
        }
        Serial.println("[Verify] Stored offline");
      } else {
        welcomeShownAt = 0;
        oledBottom("Offline full!");
        Serial.println("[Verify] Offline buffer full");
      }
    }
  } else {
    oledBottom("No Match!");
    digitalWrite(RED_LED, HIGH); delay(150); digitalWrite(RED_LED, LOW);
  }
}

// ─────────────────────────────────────────────────────────────
//  WiFi reconnect
// ─────────────────────────────────────────────────────────────
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("[WiFi] Reconnecting...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000)
    delay(200);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connected: " + WiFi.localIP().toString());
    triggerNTPResync();
    lastNTPResync = millis();
  } else {
    Serial.println("[WiFi] Failed");
  }
}

// ─────────────────────────────────────────────────────────────
//  MQTT reconnect
// ─────────────────────────────────────────────────────────────
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqttClient.connected()) { mqttConnected = true; return; }

  String clientId = String(MQTT_CLIENT_ID) + "_" +
                    String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.printf("[MQTT] Connecting as %s...\n", clientId.c_str());

  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
    mqttConnected = true;
    mqttClient.subscribe(TOPIC_SYS_STATE,   1);
    mqttClient.subscribe(TOPIC_ENROLL_DATA, 1);
    Serial.println("[MQTT] Connected & subscribed");
    mqttPublish(TOPIC_STATE_PUB, "VERIFY", true);
    mqttPublish(TOPIC_MESSAGE,   "ESP32 online");
  } else {
    mqttConnected = false;
    Serial.printf("[MQTT] Failed, state=%d\n", mqttClient.state());
  }
}

// ─────────────────────────────────────────────────────────────
//  Offline sync
// ─────────────────────────────────────────────────────────────
void syncOfflineAttendance() {
  if (offlineCount == 0) return;
  if (!isTimeSynced()) {
    Serial.println("[Sync] Skipped — time not synced");
    return;
  }

  oledBottom("Syncing offline...");
  Serial.printf("[Sync] Syncing %d records...\n", offlineCount);

  int i = 0;
  while (i < offlineCount) {
    if (strncmp(offlineAttendance[i].timestamp, "1970", 4) == 0) {
      Serial.printf("[Sync] Skipping record %d — bad timestamp\n", i);
      i++;
      continue;
    }

    uint8_t percent = ((i + 1) * 100) / (offlineCount ? offlineCount : 1);
    oledProgressBar(percent);

    StaticJsonDocument<300> doc;
    doc["id"]        = offlineAttendance[i].id;
    doc["name"]      = String(offlineAttendance[i].name);
    doc["regNum"]    = String(offlineAttendance[i].regNum);
    doc["timestamp"] = String(offlineAttendance[i].timestamp);
    doc["ntpSynced"] = true;
    String payload;
    serializeJson(doc, payload);

    if (mqttPublish(TOPIC_ATTENDANCE, payload)) {
      removeOfflineRecordAt(i);
    } else {
      Serial.printf("[Sync] Failed at record %d — retry later\n", i);
      oledBottom("Sync failed! Retry later...");
      break;
    }
    delay(200);
  }

  oledProgressBar(0);
  oledBottom("Sync complete!");
}

void removeOfflineRecordAt(uint8_t idx) {
  if (idx >= offlineCount) return;
  for (uint8_t i = idx; i < offlineCount - 1; i++)
    offlineAttendance[i] = offlineAttendance[i + 1];
  offlineCount--;
  saveOfflineAttendanceToEEPROM();
}

// ─────────────────────────────────────────────────────────────
//  EEPROM helpers
// ─────────────────────────────────────────────────────────────
bool safeEEPROMWrite(int addr, const uint8_t *buf, size_t len) {
  if (addr < 0 || (addr + (int)len) > EEPROM_SIZE) return false;
  for (size_t i = 0; i < len; i++) EEPROM.write(addr + i, buf[i]);
  return true;
}

void saveStudentsToEEPROM() {
  int addr = 0;
  EEPROM.write(addr++, studentCount);
  for (int i = 0; i < studentCount; i++) {
    safeEEPROMWrite(addr, (uint8_t *)&students[i].id,    1);                addr += 1;
    safeEEPROMWrite(addr, (uint8_t *)students[i].name,   STUDENT_NAME_LEN); addr += STUDENT_NAME_LEN;
    safeEEPROMWrite(addr, (uint8_t *)students[i].regNum, STUDENT_REG_LEN);  addr += STUDENT_REG_LEN;
  }
  EEPROM.commit();
  Serial.printf("[EEPROM] Students saved: %d\n", studentCount);
}

void loadStudentsFromEEPROM() {
  int     addr = 0;
  uint8_t cnt  = EEPROM.read(addr++);
  studentCount = (cnt > MAX_STUDENTS) ? 0 : cnt;
  for (int i = 0; i < studentCount; i++) {
    students[i].id = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_NAME_LEN; j++) students[i].name[j]   = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_REG_LEN;  j++) students[i].regNum[j] = EEPROM.read(addr++);
    students[i].name[STUDENT_NAME_LEN - 1]  = '\0';
    students[i].regNum[STUDENT_REG_LEN - 1] = '\0';
  }
  Serial.printf("[EEPROM] Loaded %d students\n", studentCount);
}

void saveOfflineAttendanceToEEPROM() {
  int addr = OFFLINE_START_ADDR;
  EEPROM.write(addr++, offlineCount);
  for (int i = 0; i < offlineCount; i++) {
    EEPROM.write(addr++, offlineAttendance[i].id);
    safeEEPROMWrite(addr, (uint8_t *)offlineAttendance[i].name,      STUDENT_NAME_LEN); addr += STUDENT_NAME_LEN;
    safeEEPROMWrite(addr, (uint8_t *)offlineAttendance[i].regNum,    STUDENT_REG_LEN);  addr += STUDENT_REG_LEN;
    safeEEPROMWrite(addr, (uint8_t *)offlineAttendance[i].timestamp, TS_LEN);           addr += TS_LEN;
  }
  EEPROM.commit();
  Serial.printf("[EEPROM] Offline saved: %d\n", offlineCount);
}

void loadOfflineAttendanceFromEEPROM() {
  int     addr = OFFLINE_START_ADDR;
  uint8_t cnt  = EEPROM.read(addr++);
  if (cnt > MAX_OFFLINE_ATTENDANCE) cnt = 0;
  offlineCount = 0;
  for (int i = 0; i < cnt; i++) {
    offlineAttendance[i].id = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_NAME_LEN; j++) offlineAttendance[i].name[j]      = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_REG_LEN;  j++) offlineAttendance[i].regNum[j]    = EEPROM.read(addr++);
    for (int j = 0; j < TS_LEN;           j++) offlineAttendance[i].timestamp[j] = EEPROM.read(addr++);
    offlineAttendance[i].name[STUDENT_NAME_LEN - 1]  = '\0';
    offlineAttendance[i].regNum[STUDENT_REG_LEN - 1] = '\0';
    offlineAttendance[i].timestamp[TS_LEN - 1]       = '\0';
    offlineCount++;
  }
  Serial.printf("[EEPROM] Loaded %d offline records\n", offlineCount);
}

// ─────────────────────────────────────────────────────────────
//  Utility
// ─────────────────────────────────────────────────────────────
String sanitizeKey(const String &s) {
  String out = s;
  out.replace('.', '-'); out.replace('#', '-');
  out.replace('$', '-'); out.replace('[', '-');
  out.replace(']', '-'); out.trim();
  if (out.length() == 0) out = "unknown";
  return out;
}