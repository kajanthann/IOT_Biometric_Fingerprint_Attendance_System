#include <Wire.h>
#include <Adafruit_SH110X.h>
#include <Adafruit_Fingerprint.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include "time.h"
#include "secrets.h"
#include <EEPROM.h>

// ---------------- OLED ----------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 128
Adafruit_SH1107 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire);

// Variables for OLED text bounds
int16_t tx1, ty1;
uint16_t tw, th;
String bottomMsg = "Waiting...";
unsigned long lastTopUpdate = 0;

// ---------------- AS608 ----------------
HardwareSerial mySerial(1);
#define RX_PIN 18
#define TX_PIN 19
Adafruit_Fingerprint finger(&mySerial);

// ---------------- LED ----------------
#define GREEN_LED 2
#define RED_LED 4

// ---------------- EEPROM ----------------
#define EEPROM_SIZE 4096
#define MAX_STUDENTS 50
#define MAX_OFFLINE_ATTENDANCE 30
#define STUDENT_NAME_LEN 20
#define STUDENT_REG_LEN 15
#define STUDENT_RECORD_SIZE (1 + STUDENT_NAME_LEN + STUDENT_REG_LEN)
#define STUDENTS_EEPROM_SIZE (1 + (MAX_STUDENTS * STUDENT_RECORD_SIZE))
#define TS_LEN 20
#define OFFLINE_RECORD_SIZE (1 + STUDENT_NAME_LEN + STUDENT_REG_LEN + TS_LEN)
#define OFFLINE_EEPROM_SIZE (1 + (MAX_OFFLINE_ATTENDANCE * OFFLINE_RECORD_SIZE))
#define OFFLINE_START_ADDR (STUDENTS_EEPROM_SIZE)

#if (STUDENTS_EEPROM_SIZE + OFFLINE_EEPROM_SIZE) > EEPROM_SIZE
#error "EEPROM layout exceeds EEPROM_SIZE"
#endif

// ---------------- Firebase ----------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ---------------- Data Structures ----------------
struct Student {
  uint8_t id;
  char name[STUDENT_NAME_LEN];
  char regNum[STUDENT_REG_LEN];
};
Student students[MAX_STUDENTS];
uint8_t studentCount = 0;

struct Attendance {
  uint8_t id;
  char name[STUDENT_NAME_LEN];
  char regNum[STUDENT_REG_LEN];
  char timestamp[TS_LEN];
};
Attendance offlineAttendance[MAX_OFFLINE_ATTENDANCE];
uint8_t offlineCount = 0;

bool firebaseReady = false;
enum SystemState { VERIFY, ENROLL };
SystemState currentState = VERIFY;

// ---------------- NTP ----------------
const char *ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800;
const int daylightOffset_sec = 0;

// ---------------- Function Prototypes ----------------
void oledTop();
void oledBottom(const String &msg, uint8_t line = 0, bool sendToFirebase = false);
void oledBottomRefresh();
void oledProgressBar(uint8_t percent);
void enrollFinger(FirebaseJson &enrollDataJson);
void verifyFingerNonBlocking();
bool writeFirebase(const String &path, FirebaseJson &json);
String getTimestamp();
bool readEnrollData(FirebaseJson &json, String &name, String &regNum);
void reconnectWiFi();
void reconnectFirebase();
void saveStudentsToEEPROM();
void loadStudentsFromEEPROM();
void saveOfflineAttendanceToEEPROM();
void loadOfflineAttendanceFromEEPROM();
void syncOfflineAttendance();
void removeOfflineRecordAt(uint8_t idx);
bool safeEEPROMWrite(int addr, const uint8_t *buf, size_t len);
String sanitizeKey(const String &s);

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n--- ESP32 Fingerprint Attendance (Revised) ---");

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  if (!EEPROM.begin(EEPROM_SIZE)) Serial.println("EEPROM.begin failed!");

  loadStudentsFromEEPROM();
  loadOfflineAttendanceFromEEPROM();

  Wire.begin(21, 22);
  if (!display.begin(0x3C, true)) {
    Serial.println(F("OLED init failed"));
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
  Serial.println("Checking fingerprint sensor...");
  if (finger.verifyPassword()) oledBottom("AS608 Found!");
  else {
    oledBottom("AS608 NOT FOUND!");
    digitalWrite(RED_LED, HIGH);
    while (1) delay(1);
  }

  reconnectWiFi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  firebaseReady = Firebase.ready();
  oledBottom(firebaseReady ? "Firebase Ready!" : "Firebase Failed!");
  if (firebaseReady) Firebase.RTDB.setString(&fbdo, "/systemState", "VERIFY");

  currentState = VERIFY;
  bottomMsg = "Place finger...";
  oledBottomRefresh();
}

// ---------------- Loop ----------------
unsigned long lastHeartbeat = 0;
unsigned long lastOfflineSync = 0;
void loop() {
  if (millis() - lastTopUpdate > 1000) { oledTop(); lastTopUpdate = millis(); }

  if (WiFi.status() != WL_CONNECTED) reconnectWiFi();
  if (!Firebase.ready()) { firebaseReady = false; reconnectFirebase(); }
  else firebaseReady = true;

  if (firebaseReady && millis() - lastHeartbeat > 1000) {
    Firebase.RTDB.setString(&fbdo, "/status", getTimestamp());
    lastHeartbeat = millis();
  }

  if (firebaseReady && offlineCount > 0 && millis() - lastOfflineSync > 3000) {
    syncOfflineAttendance();
    lastOfflineSync = millis();
  }

  String fbState = (currentState == ENROLL) ? "ENROLL" : "VERIFY";
  if (firebaseReady && Firebase.RTDB.getString(&fbdo, "/systemState")) fbState = fbdo.stringData();

  static bool enrolling = false;
  static FirebaseJson enrollJson;
  if (fbState == "ENROLL" && !enrolling) {
    enrolling = true;
    if (firebaseReady) Firebase.RTDB.getJSON(&fbdo, "/enrollData", &enrollJson);
    oledBottom("Enrollment Started...");
    enrollFinger(enrollJson);
    oledBottom("Enrollment Complete!");
    enrolling = false;
    if (firebaseReady) {
      Firebase.RTDB.deleteNode(&fbdo, "/messages");
      Firebase.RTDB.setString(&fbdo, "/systemState", "VERIFY");
    }
    currentState = VERIFY;
    bottomMsg = "Place finger...";
    oledBottomRefresh();
  }

  if (fbState == "VERIFY") verifyFingerNonBlocking();
  delay(10);
}

// ---------------- OLED ----------------
void oledTop() {
  display.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.print(WiFi.status() == WL_CONNECTED ? "WiFi:Ok" : "WiFi:X");
  display.setCursor(SCREEN_WIDTH - 32, 0);
  display.print(firebaseReady ? "FB:Ok" : "FB:X");

  struct tm t;
  char buf[20];
  int dateY = 20;
  if (getLocalTime(&t)) {
    strftime(buf, sizeof(buf), "%d-%m | %H:%M", &t);
    display.getTextBounds(buf, 0, dateY, &tx1, &ty1, &tw, &th);
    display.setCursor((SCREEN_WIDTH - tw) / 2, dateY);
    display.println(buf);
  } else {
    display.setCursor(10, dateY);
    display.println("--:--:--");
  }

  String devInfo = "FOC - SE";
  display.setTextSize(2);
  display.getTextBounds(devInfo, 0, 40, &tx1, &ty1, &tw, &th);
  display.setCursor((SCREEN_WIDTH - tw) / 2, 40);
  display.println(devInfo);
  display.setTextSize(1);

  display.drawLine(0, SCREEN_HEIGHT/2 - 1, SCREEN_WIDTH, SCREEN_HEIGHT/2 - 1, SH110X_WHITE);
  

  display.display();
}

void oledBottom(const String &msg, uint8_t line, bool sendToFirebase) {
  bottomMsg = msg;
  display.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setCursor(0, SCREEN_HEIGHT / 2);
  display.println(bottomMsg);

  if (WiFi.status() != WL_CONNECTED || !firebaseReady) {
    display.setCursor(0, SCREEN_HEIGHT - 10);
    display.print("Offline: ");
    display.print(offlineCount);
  }

  display.display();

  // optionally notify firebase about messages (if requested)
  if (sendToFirebase && firebaseReady) {
    FirebaseJson json;
    json.set("msg", bottomMsg);
    Firebase.RTDB.pushJSON(&fbdo, "/messages", &json);
  }
}

void oledBottomRefresh() { 
  oledBottom(bottomMsg);
 }

// ---------------- OLED progress bar ----------------
void oledProgressBar(uint8_t percent) {
  uint8_t barWidth = SCREEN_WIDTH - 4;
  uint8_t fillWidth = (barWidth * percent) / 100;

  display.fillRect(2, SCREEN_HEIGHT - 12, barWidth, 10, SH110X_BLACK);
  display.drawRect(2, SCREEN_HEIGHT - 12, barWidth, 10, SH110X_WHITE);
  if (fillWidth > 0) display.fillRect(2, SCREEN_HEIGHT - 12, fillWidth, 10, SH110X_WHITE);
  display.display();
}

// ---------------- Firebase ----------------
bool writeFirebase(const String &path, FirebaseJson &json) {
  if (!firebaseReady) return false;
  bool ok = Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json);
  if (!ok) Serial.printf("Firebase write failed: %s\n", fbdo.errorReason().c_str());
  else Serial.printf("Firebase wrote: %s\n", path.c_str());
  return ok;
}

// ---------------- Timestamp ----------------
String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00";
  char buffer[TS_LEN];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(buffer);
}

// ---------------- Enrollment ----------------
void enrollFinger(FirebaseJson &enrollDataJson) {
  if (studentCount >= MAX_STUDENTS) {
    oledBottom("Max students!", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  String name, regNum;
  if (!readEnrollData(enrollDataJson, name, regNum)) {
    oledBottom("Invalid data!", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  uint8_t id = studentCount + 1;
  int p = -1;

  // Wait for first finger (with simple progress animation)
  unsigned long start = millis();
  oledProgressBar(0);
  oledBottom("Place finger to enroll...", 0, true);
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p != FINGERPRINT_NOFINGER) oledBottom("Image error!", 0, true);
    uint8_t elapsedPercent = min(100UL, (millis() - start) * 100UL / 15000UL);
    oledProgressBar(elapsedPercent);
    if (millis() - start > 15000UL) { oledBottom("Enroll timeout", 0, true); oledProgressBar(0); return; }
    delay(80);
  }
  oledProgressBar(0);

  if (finger.image2Tz(1) != FINGERPRINT_OK) { oledBottom("Image fail", 0, true); digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW); return; }

  if (finger.fingerSearch() == FINGERPRINT_OK) {
    oledBottom("Already Enrolled!", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    if (firebaseReady) Firebase.RTDB.deleteNode(&fbdo, "/messages");
    return;
  }

  oledBottom("Remove finger", 0, true); delay(800);
  while (finger.getImage() != FINGERPRINT_NOFINGER) delay(20);

  // second placement
  start = millis();
  oledProgressBar(0);
  oledBottom("Place again...", 0, true);
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p != FINGERPRINT_NOFINGER) oledBottom("Image error!", 0, true);
    uint8_t elapsedPercent = min(100UL, (millis() - start) * 100UL / 15000UL);
    oledProgressBar(elapsedPercent);
    if (millis() - start > 15000UL) { oledBottom("Enroll timeout", 0, true); oledProgressBar(0); return; }
    delay(80);
  }
  oledProgressBar(0);

  if (finger.image2Tz(2) != FINGERPRINT_OK) { oledBottom("2nd fail", 0, true); digitalWrite(RED_LED, HIGH); delay(900); digitalWrite(RED_LED, LOW); return; }

  if (finger.createModel() != FINGERPRINT_OK) { oledBottom("Model fail", 0, true); digitalWrite(RED_LED, HIGH); delay(900); digitalWrite(RED_LED, LOW); return; }
  if (finger.storeModel(id) != FINGERPRINT_OK) { oledBottom("Store fail", 0, true); digitalWrite(RED_LED, HIGH); delay(900); digitalWrite(RED_LED, LOW); return; }

  // save student
  students[studentCount].id = id;
  memset(students[studentCount].name, 0, STUDENT_NAME_LEN);
  name.toCharArray(students[studentCount].name, STUDENT_NAME_LEN);
  memset(students[studentCount].regNum, 0, STUDENT_REG_LEN);
  regNum.toCharArray(students[studentCount].regNum, STUDENT_REG_LEN);
  studentCount++;
  saveStudentsToEEPROM();

  oledBottom("Enroll Success: " + name, 0, true);
  digitalWrite(GREEN_LED, HIGH); delay(900); digitalWrite(GREEN_LED, LOW);

  if (firebaseReady) {
    String path = "/students/" + String(id);
    FirebaseJson json;
    json.set("id", id);
    json.set("name", name);
    json.set("regNum", regNum);
    writeFirebase(path, json);
    Firebase.RTDB.deleteNode(&fbdo, "/messages");
  }
}

// ---------------- Verification ----------------
void verifyFingerNonBlocking() {
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck < 200) return;
  lastCheck = millis();

  int p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER) {
    oledBottom("Place finger...");
    return;
  }
  if (p != FINGERPRINT_OK) {
    oledBottom("Image error!");
    return;
  }

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    oledBottom("Image conv fail");
    return;
  }

  if (finger.fingerFastSearch() == FINGERPRINT_OK) {
    uint8_t id = finger.fingerID;
    String name = "Unknown", regNum = "";
    for (uint8_t i = 0; i < studentCount; i++) {
      if (students[i].id == id) {
        name = String(students[i].name);
        regNum = String(students[i].regNum);
        break;
      }
    }

    oledBottom("Welcome:\n-> " + name);
    digitalWrite(GREEN_LED, HIGH); delay(180); digitalWrite(GREEN_LED, LOW);
    String timestamp = getTimestamp();
    Serial.printf("Verified id=%d name=%s time=%s\n", id, name.c_str(), timestamp.c_str());

    // create Attendance record (zero padded)
    Attendance rec;
    rec.id = id;
    memset(rec.name, 0, STUDENT_NAME_LEN);
    name.toCharArray(rec.name, STUDENT_NAME_LEN);
    memset(rec.regNum, 0, STUDENT_REG_LEN);
    regNum.toCharArray(rec.regNum, STUDENT_REG_LEN);
    memset(rec.timestamp, 0, TS_LEN);
    timestamp.toCharArray(rec.timestamp, TS_LEN);

    if (firebaseReady) {
      FirebaseJson json;
      json.set("id", id);
      json.set("name", name);
      json.set("regNum", regNum);
      json.set("timestamp", timestamp);
      // sanitize path key just in case
      String tsSafe = sanitizeKey(timestamp);
      String path = "/attendance/" + String(id) + "_" + tsSafe;
      if (!writeFirebase(path, json)) {
        if (offlineCount < MAX_OFFLINE_ATTENDANCE) {
          offlineAttendance[offlineCount] = rec;
          offlineCount++;
          saveOfflineAttendanceToEEPROM();
          oledBottom("Saved offline!");
          Serial.println("Saved offline (write failed)");
        } else oledBottom("Offline full!");
      }
    } else {
      if (offlineCount < MAX_OFFLINE_ATTENDANCE) {
        offlineAttendance[offlineCount] = rec;
        offlineCount++;
        saveOfflineAttendanceToEEPROM();
        oledBottom("Offline stored!");
        Serial.println("Stored offline (no connectivity)");
      } else oledBottom("Offline full!");
    }
  } else {
    oledBottom("No Match!");
    digitalWrite(RED_LED, HIGH);
    delay(150);
    digitalWrite(RED_LED, LOW);
  }
}

// ---------------- WiFi & Firebase ----------------
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("Reconnecting WiFi...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) delay(200);
}

void reconnectFirebase() {
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ---------------- EEPROM helpers ----------------
bool safeEEPROMWrite(int addr, const uint8_t *buf, size_t len) {
  if (addr < 0 || (addr + (int)len) > EEPROM_SIZE) return false;
  for (size_t i = 0; i < len; i++) EEPROM.write(addr + i, buf[i]);
  return true;
}

void saveStudentsToEEPROM() {
  int addr = 0;
  EEPROM.write(addr++, studentCount);
  for (int i = 0; i < studentCount; i++) {
    safeEEPROMWrite(addr, (uint8_t *)&students[i].id, 1); addr += 1;
    safeEEPROMWrite(addr, (uint8_t *)students[i].name, STUDENT_NAME_LEN); addr += STUDENT_NAME_LEN;
    safeEEPROMWrite(addr, (uint8_t *)students[i].regNum, STUDENT_REG_LEN); addr += STUDENT_REG_LEN;
  }
  EEPROM.commit();
  Serial.printf("Students saved (%d)\n", studentCount);
}

void loadStudentsFromEEPROM() {
  int addr = 0;
  uint8_t cnt = EEPROM.read(addr++);
  studentCount = (cnt > MAX_STUDENTS) ? 0 : cnt;
  for (int i = 0; i < studentCount; i++) {
    students[i].id = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_NAME_LEN; j++) students[i].name[j] = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_REG_LEN; j++) students[i].regNum[j] = EEPROM.read(addr++);
  }
  Serial.printf("Loaded %d students\n", studentCount);
}

void saveOfflineAttendanceToEEPROM() {
  int addr = OFFLINE_START_ADDR;
  EEPROM.write(addr++, offlineCount);
  for (int i = 0; i < offlineCount; i++) {
    EEPROM.write(addr++, offlineAttendance[i].id);
    safeEEPROMWrite(addr, (uint8_t *)offlineAttendance[i].name, STUDENT_NAME_LEN); addr += STUDENT_NAME_LEN;
    safeEEPROMWrite(addr, (uint8_t *)offlineAttendance[i].regNum, STUDENT_REG_LEN); addr += STUDENT_REG_LEN;
    safeEEPROMWrite(addr, (uint8_t *)offlineAttendance[i].timestamp, TS_LEN); addr += TS_LEN;
  }
  EEPROM.commit();
  Serial.printf("Offline saved (%d)\n", offlineCount);
}

void loadOfflineAttendanceFromEEPROM() {
  int addr = OFFLINE_START_ADDR;
  uint8_t cnt = EEPROM.read(addr++);
  if (cnt > MAX_OFFLINE_ATTENDANCE) cnt = 0;
  offlineCount = 0;
  for (int i = 0; i < cnt; i++) {
    offlineAttendance[i].id = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_NAME_LEN; j++) offlineAttendance[i].name[j] = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_REG_LEN; j++) offlineAttendance[i].regNum[j] = EEPROM.read(addr++);
    for (int j = 0; j < TS_LEN; j++) offlineAttendance[i].timestamp[j] = EEPROM.read(addr++);
    // ensure null-termination in case data truncated
    offlineAttendance[i].name[STUDENT_NAME_LEN - 1] = '\0';
    offlineAttendance[i].regNum[STUDENT_REG_LEN - 1] = '\0';
    offlineAttendance[i].timestamp[TS_LEN - 1] = '\0';
    offlineCount++;
  }
  Serial.printf("Loaded offline records: %d\n", offlineCount);
}

// ---------------- Offline Sync ----------------
void syncOfflineAttendance() {
  if (offlineCount == 0) return;
  oledBottom("Syncing offline...");
  int i = 0;
  while (i < offlineCount) {
    uint8_t percent = ((i + 1) * 100) / (offlineCount ? offlineCount : 1);
    oledProgressBar(percent);

    FirebaseJson json;
    json.set("id", offlineAttendance[i].id);
    json.set("name", String(offlineAttendance[i].name));
    json.set("regNum", String(offlineAttendance[i].regNum));
    json.set("timestamp", String(offlineAttendance[i].timestamp));

    String ts = sanitizeKey(String(offlineAttendance[i].timestamp));
    String path = "/attendance/" + String(offlineAttendance[i].id) + "_" + ts;

    if (writeFirebase(path, json)) {
      removeOfflineRecordAt(i); // don't increment i, items shift left
    } else {
      Serial.printf("Failed to sync record %d, will retry later\n", i);
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
  for (uint8_t i = idx; i < offlineCount - 1; i++) offlineAttendance[i] = offlineAttendance[i + 1];
  offlineCount--;
  saveOfflineAttendanceToEEPROM();
}

// ---------------- Enroll Data Reader ----------------
bool readEnrollData(FirebaseJson &json, String &name, String &regNum) {
  FirebaseJsonData data;
  // get name
  if (!json.get(data, "name")) return false;
  name = data.stringValue;
  // get regNum
  if (!json.get(data, "regNum")) return false;
  regNum = data.stringValue;
  return true;
}

// ---------------- Utility ----------------
String sanitizeKey(const String &s) {
  String out = s;
  // Firebase RTDB keys cannot contain . # $ [ ]
  out.replace('.', '-');
  out.replace('#', '-');
  out.replace('$', '-');
  out.replace('[', '-');
  out.replace(']', '-');
  // trim whitespace (just in case)
  out.trim();
  if (out.length() == 0) out = "unknown";
  return out;
}
