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
// NOTE: ESP32 EEPROM emulation uses NVS under the hood.
// Keep EEPROM_SIZE reasonable (<=4096 recommended).
// We design record sizes so the total fits into EEPROM_SIZE.
#define EEPROM_SIZE 4096

// reduced record sizes to fit into EEPROM
#define MAX_STUDENTS 50
#define MAX_OFFLINE_ATTENDANCE 30

// stored fields for student: id (1), name (20), regNum (15)
#define STUDENT_NAME_LEN 20
#define STUDENT_REG_LEN 15
#define STUDENT_RECORD_SIZE (1 + STUDENT_NAME_LEN + STUDENT_REG_LEN)
#define STUDENTS_EEPROM_SIZE (1 + (MAX_STUDENTS * STUDENT_RECORD_SIZE))

// offline attendance record: id(1), name(20), regNum(15), timestamp(20)
#define TS_LEN 20  // e.g. "2025-10-15T14:32:05" fits
#define OFFLINE_RECORD_SIZE (1 + STUDENT_NAME_LEN + STUDENT_REG_LEN + TS_LEN)
#define OFFLINE_EEPROM_SIZE (1 + (MAX_OFFLINE_ATTENDANCE * OFFLINE_RECORD_SIZE))
#define OFFLINE_START_ADDR (STUDENTS_EEPROM_SIZE)

// Sanity check: total must be <= EEPROM_SIZE
#if (STUDENTS_EEPROM_SIZE + OFFLINE_EEPROM_SIZE) > EEPROM_SIZE
  #error "EEPROM layout exceeds EEPROM_SIZE. Reduce counts or sizes."
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
void oledBottom(const String &msg, bool force = false);
void oledBottomRefresh();
void enrollFinger(FirebaseJson &enrollDataJson);
void verifyFingerNonBlocking();
bool writeFirebase(const String &path, FirebaseJson &json);
String getTimestamp();
bool readEnrollData(FirebaseJson &json, String &name, String &regNum, String &indexNum, String &email);
void reconnectWiFi();
void reconnectFirebase();
void saveStudentsToEEPROM();
void loadStudentsFromEEPROM();
void saveOfflineAttendanceToEEPROM();
void loadOfflineAttendanceFromEEPROM();
void syncOfflineAttendance();
void removeOfflineRecordAt(uint8_t idx);
bool safeEEPROMWrite(int addr, const uint8_t *buf, size_t len);

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n--- ESP32 Fingerprint Attendance (Revised) ---");

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  if(!EEPROM.begin(EEPROM_SIZE)) {
    Serial.println("EEPROM.begin failed!");
    // We continue but EEPROM operations will likely fail.
  } else {
    Serial.printf("EEPROM initialized (%d bytes)\n", EEPROM_SIZE);
  }

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
  if (finger.verifyPassword()) {
    oledBottom("AS608 Found!");
    Serial.println("AS608 Found!");
  } else {
    oledBottom("AS608 NOT FOUND!");
    Serial.println("AS608 NOT FOUND! Check wiring!");
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
  // OLED top update every second
  if (millis() - lastTopUpdate > 1000) {
    oledTop();
    lastTopUpdate = millis();
  }

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) reconnectWiFi();
  if (!Firebase.ready()) {
    firebaseReady = false;
    reconnectFirebase();
  } else firebaseReady = true;

  // Heartbeat timestamp to Firebase
  if (firebaseReady && millis() - lastHeartbeat > 1000) {
    Firebase.RTDB.setString(&fbdo, "/status", getTimestamp());
    lastHeartbeat = millis();
  }

  // Sync offline attendance every 3 seconds if possible
  if (firebaseReady && offlineCount > 0 && millis() - lastOfflineSync > 3000) {
    syncOfflineAttendance();
    lastOfflineSync = millis();
  }

  // Fetch system state from Firebase (non-blocking get)
  String fbState = (currentState == ENROLL) ? "ENROLL" : "VERIFY";
  if (firebaseReady && Firebase.RTDB.getString(&fbdo, "/systemState")) {
    fbState = fbdo.stringData();
  }

  // Enrollment
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

  // Verification
  if (fbState == "VERIFY") verifyFingerNonBlocking();

  delay(10); // Small loop delay
}

// ---------------- OLED ----------------
void oledTop() {
  display.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setTextSize(1);
  display.setCursor(0,0);

  String info = String(WiFi.status() == WL_CONNECTED ? "WiFi:Ok" : "WiFi:X") +
                " FB:" + (firebaseReady ? "Ok" : "X");

  struct tm t;
  char buf[20];
  if (getLocalTime(&t)) strftime(buf, sizeof(buf), "%d-%m | %H:%M", &t);
  else strcpy(buf,"--:--:--");

  display.println(info);
  display.setCursor(0, 20);
  display.println(buf);

  display.setTextSize(2);
  display.setCursor(0, 40);
  display.println("FOC-SE");
  display.setTextSize(1);
  display.drawLine(0, SCREEN_HEIGHT/2-1, SCREEN_WIDTH, SCREEN_WIDTH/2-1, SH110X_WHITE); // keep layout

  display.display();
}

void oledBottom(const String &msg, bool force) {
  bottomMsg = msg;
  display.fillRect(0, SCREEN_HEIGHT/2, SCREEN_WIDTH, SCREEN_HEIGHT/2, SH110X_BLACK);
  display.setCursor(0, SCREEN_HEIGHT/2);
  display.println(bottomMsg);

  // Show offline count in bottom-left if offline
  if (WiFi.status()!=WL_CONNECTED || !firebaseReady) {
    display.setCursor(0, SCREEN_HEIGHT-10);
    display.print("Offline: "); display.print(offlineCount);
  }

  display.display();
}

void oledBottomRefresh() { oledBottom(bottomMsg, true); }

// ---------------- Firebase ----------------
bool writeFirebase(const String &path, FirebaseJson &json) {
  if (!firebaseReady) return false;
  bool ok = Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json);
  if (!ok) {
    Serial.printf("Firebase write failed: %s (err: %s)\n", path.c_str(), fbdo.errorReason().c_str());
  } else {
    Serial.printf("Firebase wrote: %s\n", path.c_str());
  }
  return ok;
}

// ---------------- Timestamp ----------------
String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00";
  char buffer[TS_LEN];
  // produce compact ISO-like timestamp within TS_LEN
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(buffer);
}

// ---------------- Enrollment ----------------
void enrollFinger(FirebaseJson &enrollDataJson) {
  if (studentCount >= MAX_STUDENTS) {
    oledBottom("Max students!");
    digitalWrite(RED_LED,HIGH); delay(500); digitalWrite(RED_LED,LOW);
    Serial.println("Enroll failed: max students reached");
    return;
  }

  String name, regNum, indexNum, email;
  if (!readEnrollData(enrollDataJson, name, regNum, indexNum, email)) {
    oledBottom("Invalid enroll data!");
    Serial.println("Enroll failed: invalid JSON data");
    digitalWrite(RED_LED,HIGH); delay(500); digitalWrite(RED_LED,LOW);
    return;
  }

  uint8_t id = studentCount + 1;

  oledBottom("Place finger to enroll...");
  Serial.println("Waiting for finger (first)...");
  unsigned long start = millis();
  int p;
  // wait for finger image with timeout
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p == FINGERPRINT_NOFINGER) {
      if (millis() - start > 15000) { oledBottom("Enroll timeout"); Serial.println("Enroll timeout"); return; }
      delay(50);
      continue;
    } else {
      Serial.printf("finger.getImage error: %d\n", p);
      oledBottom("Image error!");
      delay(100);
    }
  }

  if (finger.image2Tz(1) != FINGERPRINT_OK) { oledBottom("Image conv fail"); Serial.println("image2Tz(1) fail"); return; }
  if (finger.fingerSearch() == FINGERPRINT_OK) { oledBottom("Already Enrolled!"); Serial.println("Enroll aborted: already in DB"); return; }

  oledBottom("Remove finger...");
  delay(800);
  start = millis();
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    if (millis() - start > 5000) break;
    delay(20);
  }

  oledBottom("Place finger again...");
  Serial.println("Waiting for finger (second)...");
  start = millis();
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p == FINGERPRINT_NOFINGER) {
      if (millis() - start > 15000) { oledBottom("Enroll timeout"); Serial.println("Enroll timeout 2"); return; }
      delay(50);
      continue;
    } else {
      Serial.printf("finger.getImage error2: %d\n", p);
      oledBottom("Image error!");
      delay(100);
    }
  }

  if (finger.image2Tz(2) != FINGERPRINT_OK) { oledBottom("2nd conv fail"); Serial.println("image2Tz(2) fail"); return; }
  if (finger.createModel() != FINGERPRINT_OK) { oledBottom("Model fail"); Serial.println("createModel fail"); return; }
  if (finger.storeModel(id) != FINGERPRINT_OK) { oledBottom("Store fail"); Serial.println("storeModel fail"); return; }

  // save student minimal info
  students[studentCount].id = id;
  name.toCharArray(students[studentCount].name, sizeof(students[studentCount].name));
  regNum.toCharArray(students[studentCount].regNum, sizeof(students[studentCount].regNum));
  studentCount++;
  saveStudentsToEEPROM();

  oledBottom("Enroll Success:\n-> " + name);
  digitalWrite(GREEN_LED,HIGH); delay(500); digitalWrite(GREEN_LED,LOW);
  Serial.printf("Enrolled id=%d name=%s reg=%s\n", id, students[studentCount-1].name, students[studentCount-1].regNum);

  if(firebaseReady){
    FirebaseJson json;
    json.set("id",id); json.set("name",name); json.set("regNum",regNum);
    writeFirebase("/students/"+String(id),json);
    Firebase.RTDB.deleteNode(&fbdo,"/messages"); // optional cleanup
  }
}

// ---------------- Verification ----------------
void verifyFingerNonBlocking() {
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck < 200) return;
  lastCheck = millis();

  int p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER) { oledBottom("Place finger..."); return; }
  if (p != FINGERPRINT_OK) { oledBottom("Image error!"); Serial.printf("getImage err %d\n", p); return; }

  if (finger.image2Tz(1) != FINGERPRINT_OK) { oledBottom("Image conv fail"); Serial.println("image2Tz fail (verify)"); return; }

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
    digitalWrite(GREEN_LED, HIGH); delay(200); digitalWrite(GREEN_LED, LOW);
    String timestamp = getTimestamp();
    Serial.printf("Verified id=%d name=%s time=%s\n", id, name.c_str(), timestamp.c_str());

    if (firebaseReady) {
      FirebaseJson json;
      json.set("id", id); json.set("name", name); json.set("regNum", regNum); json.set("timestamp", timestamp);
      String path = "/attendance/" + String(id) + "_" + timestamp;
      if (!writeFirebase(path, json)) {
        // failed to write -> save offline
        if (offlineCount < MAX_OFFLINE_ATTENDANCE) {
          offlineAttendance[offlineCount].id = id;
          name.toCharArray(offlineAttendance[offlineCount].name, STUDENT_NAME_LEN);
          regNum.toCharArray(offlineAttendance[offlineCount].regNum, STUDENT_REG_LEN);
          timestamp.toCharArray(offlineAttendance[offlineCount].timestamp, TS_LEN);
          offlineCount++; saveOfflineAttendanceToEEPROM();
          oledBottom("Saved offline!");
          Serial.println("Saved attendance offline (write failed)");
        } else {
          oledBottom("Offline full!");
          Serial.println("Offline storage full");
        }
      } // else written ok (writeFirebase logs)
    } else {
      // offline: store locally
      if (offlineCount < MAX_OFFLINE_ATTENDANCE) {
        offlineAttendance[offlineCount].id = id;
        name.toCharArray(offlineAttendance[offlineCount].name, STUDENT_NAME_LEN);
        regNum.toCharArray(offlineAttendance[offlineCount].regNum, STUDENT_REG_LEN);
        timestamp.toCharArray(offlineAttendance[offlineCount].timestamp, TS_LEN);
        offlineCount++; saveOfflineAttendanceToEEPROM();
        oledBottom("Offline stored!");
        Serial.println("Stored attendance offline (no connectivity)");
      } else {
        oledBottom("Offline full!");
        Serial.println("Offline storage full (no connectivity)");
      }
    }
  } else {
    oledBottom("No Match!");
    digitalWrite(RED_LED, HIGH); delay(150); digitalWrite(RED_LED, LOW);
  }
}

// ---------------- WiFi & Firebase ----------------
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("Reconnecting WiFi...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(200);
  }
  Serial.printf("WiFi status: %d\n", WiFi.status());
  digitalWrite(GREEN_LED, WiFi.status() == WL_CONNECTED ? HIGH : LOW);
  digitalWrite(RED_LED, WiFi.status() != WL_CONNECTED ? HIGH : LOW);
}

void reconnectFirebase() {
  Serial.println("Reconnecting Firebase...");
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ---------------- EEPROM helpers ----------------
bool safeEEPROMWrite(int addr, const uint8_t *buf, size_t len) {
  if (addr < 0 || (addr + (int)len) > EEPROM_SIZE) {
    Serial.printf("EEPROM write out of range: addr=%d len=%u\n", addr, (unsigned)len);
    return false;
  }
  for (size_t i = 0; i < len; ++i) {
    EEPROM.write(addr + i, buf[i]);
  }
  return true;
}

void saveStudentsToEEPROM() {
  int addr = 0;
  EEPROM.write(addr++, studentCount);
  for (int i = 0; i < studentCount; i++) {
    uint8_t id = students[i].id;
    safeEEPROMWrite(addr, &id, 1); addr += 1;
    safeEEPROMWrite(addr, (uint8_t*)students[i].name, STUDENT_NAME_LEN); addr += STUDENT_NAME_LEN;
    safeEEPROMWrite(addr, (uint8_t*)students[i].regNum, STUDENT_REG_LEN); addr += STUDENT_REG_LEN;
  }
  // zero out remaining student slots (optional)
  for (int i = studentCount; i < MAX_STUDENTS; ++i) {
    // leave as-is to save wear, or clear if you prefer
    addr += STUDENT_RECORD_SIZE;
  }
  if (!EEPROM.commit()) {
    Serial.println("EEPROM.commit() failed when saving students");
  } else Serial.println("Students saved to EEPROM");
}

void loadStudentsFromEEPROM() {
  int addr = 0;
  uint8_t cnt = EEPROM.read(addr++);
  if (cnt > MAX_STUDENTS) {
    Serial.println("EEPROM student count invalid, resetting to 0");
    cnt = 0;
  }
  studentCount = cnt;
  for (int i = 0; i < studentCount; i++) {
    students[i].id = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_NAME_LEN; j++) students[i].name[j] = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_REG_LEN; j++) students[i].regNum[j] = EEPROM.read(addr++);
  }
  Serial.printf("Loaded %d students from EEPROM\n", studentCount);
}

void saveOfflineAttendanceToEEPROM() {
  int addr = OFFLINE_START_ADDR;
  EEPROM.write(addr++, offlineCount);
  for (int i = 0; i < offlineCount; i++) {
    EEPROM.write(addr++, offlineAttendance[i].id);
    safeEEPROMWrite(addr, (uint8_t*)offlineAttendance[i].name, STUDENT_NAME_LEN); addr += STUDENT_NAME_LEN;
    safeEEPROMWrite(addr, (uint8_t*)offlineAttendance[i].regNum, STUDENT_REG_LEN); addr += STUDENT_REG_LEN;
    safeEEPROMWrite(addr, (uint8_t*)offlineAttendance[i].timestamp, TS_LEN); addr += TS_LEN;
  }
  // optionally clear remaining slots
  if (!EEPROM.commit()) {
    Serial.println("EEPROM.commit() failed when saving offline attendance");
  } else Serial.println("Offline attendance saved to EEPROM");
}

void loadOfflineAttendanceFromEEPROM() {
  int addr = OFFLINE_START_ADDR;
  uint8_t cnt = EEPROM.read(addr++);
  if (cnt > MAX_OFFLINE_ATTENDANCE) cnt = 0;
  offlineCount = 0; // start clean

  for (int i = 0; i < cnt; i++) {
    offlineAttendance[i].id = EEPROM.read(addr++);
    for (int j = 0; j < STUDENT_NAME_LEN - 1; j++)
      offlineAttendance[i].name[j] = EEPROM.read(addr++);
    offlineAttendance[i].name[STUDENT_NAME_LEN - 1] = '\0';

    for (int j = 0; j < STUDENT_REG_LEN - 1; j++)
      offlineAttendance[i].regNum[j] = EEPROM.read(addr++);
    offlineAttendance[i].regNum[STUDENT_REG_LEN - 1] = '\0';

    for (int j = 0; j < TS_LEN - 1; j++)
      offlineAttendance[i].timestamp[j] = EEPROM.read(addr++);
    offlineAttendance[i].timestamp[TS_LEN - 1] = '\0';

    // Only keep record if timestamp looks valid (basic check: length > 0)
    if (strlen(offlineAttendance[i].timestamp) > 0 && offlineAttendance[i].timestamp[0] != '\0') {
        offlineAttendance[offlineCount++] = offlineAttendance[i];
    }
  }
  Serial.printf("Loaded %d offline records from EEPROM (after sanitizing)\n", offlineCount);
}


// ---------------- Offline Sync ----------------
void syncOfflineAttendance() {
  if (offlineCount == 0) return;
  Serial.printf("Attempting to sync %d offline records\n", offlineCount);
  // attempt to sync earliest records first
  for (int i = 0; i < offlineCount; i++) {
    FirebaseJson json;
    json.set("id", offlineAttendance[i].id);
    json.set("name", String(offlineAttendance[i].name));
    json.set("regNum", String(offlineAttendance[i].regNum));
    json.set("timestamp", String(offlineAttendance[i].timestamp));

String ts = String(offlineAttendance[i].timestamp);
// replace illegal Firebase RTDB path characters
ts.replace('.', '-');
ts.replace('#', '-');
ts.replace('$', '-');
ts.replace('[', '-');
ts.replace(']', '-');

uint8_t studentId = offlineAttendance[i].id;
String path = "/attendance/" + String(studentId) + "_" + ts;



    if (writeFirebase(path, json)) {
      Serial.printf("Synced offline record %d\n", i);
      removeOfflineRecordAt(i);
    } else {
      Serial.printf("Failed to sync offline record %d\n", i);
      // break early to avoid repeated failing attempts
      break;
    }
  }
}

void removeOfflineRecordAt(uint8_t idx) {
  if (idx >= offlineCount) return;
  for (uint8_t i = idx; i < offlineCount - 1; i++) offlineAttendance[i] = offlineAttendance[i + 1];
  offlineCount--;
  saveOfflineAttendanceToEEPROM();
}

// ---------------- Helper ----------------
bool readEnrollData(FirebaseJson &json, String &name, String &regNum, String &indexNum, String &email) {
  FirebaseJsonData jsonData;

  if (!json.get(jsonData, "name")) return false;
  name = jsonData.stringValue;

  if (!json.get(jsonData, "regNum")) return false;
  regNum = jsonData.stringValue;

  return true;
}