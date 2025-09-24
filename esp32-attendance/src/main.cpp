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

// ---------------- OLED setup ----------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 128
Adafruit_SH1107 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire);

int16_t tx1, ty1;
uint16_t tw, th;
String bottomMsg = "Waiting...";
unsigned long lastTopUpdate = 0;

// ---------------- ESP32 UART for AS608 ----------------
HardwareSerial mySerial(1);
#define RX_PIN 18
#define TX_PIN 19
Adafruit_Fingerprint finger(&mySerial);

// ---------------- LED pins ----------------
#define GREEN_LED 2
#define RED_LED 4

// ---------------- EEPROM settings ----------------
#define EEPROM_SIZE 1024
#define MAX_STUDENTS 50

// ---------------- Firebase ----------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ---------------- Student structure ----------------
struct Student {
  uint8_t id;
  char name[20];
  char regNum[15];
  char indexNum[15];
  char email[15];
};

Student students[MAX_STUDENTS];
uint8_t studentCount = 0;
bool firebaseReady = false;

// ---------------- System states ----------------
enum SystemState { VERIFY, ENROLL };
SystemState currentState = VERIFY;

// ---------------- NTP ----------------
const char *ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800;
const int daylightOffset_sec = 0;

// ---------------- Function Prototypes ----------------
void oledTop();
void oledBottom(String msg, uint8_t line = 0, bool sendToFirebase = false);
void oledBottomRefresh();
void enrollFinger(FirebaseJson &enrollDataJson);
void verifyFingerNonBlocking();
bool writeFirebase(String path, FirebaseJson &json);
String getTimestamp();
bool readEnrollData(FirebaseJson &json, String &name, String &regNum, String &indexNum, String &email);
void reconnectWiFi();
void reconnectFirebase();
void saveStudentsToEEPROM();
void loadStudentsFromEEPROM();

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  EEPROM.begin(EEPROM_SIZE);
  loadStudentsFromEEPROM();

  Wire.begin(21, 22);
  if (!display.begin(0x3C, true)) {
    Serial.println(F("OLED init failed"));
    while (1);
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
    Serial.println("AS608 Found!");
    Serial.print("Sensor contains ");
    Serial.print(finger.templateCount);
    Serial.println(" templates");
  } else {
    oledBottom("AS608 NOT FOUND!");
    Serial.println("Check wiring!");
    digitalWrite(RED_LED, HIGH);
    while (1) delay(1);
  }

  reconnectWiFi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.ready()) {
    firebaseReady = true;
    oledBottom("Firebase Ready!");
    Serial.println("Firebase Ready");
    Firebase.RTDB.setString(&fbdo, "/systemState", "VERIFY");
  } else {
    oledBottom("Firebase Failed!");
    Serial.println("Firebase init failed");
  }

  currentState = VERIFY;
  bottomMsg = "Place finger..."; // Initial message
  oledBottomRefresh();
}

// ---------------- Loop ----------------
unsigned long lastHeartbeat = 0;

void loop() {
  if (millis() - lastTopUpdate > 1000) {
    oledTop();
    lastTopUpdate = millis();
  }

  if (WiFi.status() != WL_CONNECTED) reconnectWiFi();
  if (!Firebase.ready()) {
    firebaseReady = false;
    reconnectFirebase();
  } else {
    firebaseReady = true;
  }

  if (firebaseReady && millis() - lastHeartbeat > 2000) {
    Firebase.RTDB.setString(&fbdo, "/status", getTimestamp());
    lastHeartbeat = millis();
  }

  if (!firebaseReady) return;

  String state = "";
  if (Firebase.RTDB.getString(&fbdo, "/systemState")) state = fbdo.stringData();

  // Enrollment
  if (state == "ENROLL" && currentState != ENROLL) {
    currentState = ENROLL;
    FirebaseJson enrollJson;
    if (Firebase.RTDB.getJSON(&fbdo, "/enrollData")) enrollJson = fbdo.jsonObject();
    oledBottom("Enrollment Started...", 0, true);
    enrollFinger(enrollJson);

    // Short success message before switching back to VERIFY
    oledBottom("Enrollment Complete!", 0, true);
    delay(1500);
    Firebase.RTDB.deleteNode(&fbdo, "/messages");

    Firebase.RTDB.setString(&fbdo, "/systemState", "VERIFY");
    currentState = VERIFY;

    // Let verifyFingerNonBlocking handle OLED
    bottomMsg = "Place finger...";
    oledBottomRefresh();
  }

  // Verification
  if (state == "VERIFY" && currentState == VERIFY) verifyFingerNonBlocking();

  delay(50);
}

// ---------------- OLED helpers ----------------
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

  display.drawLine(0, SCREEN_HEIGHT / 2 - 1, SCREEN_WIDTH, SCREEN_HEIGHT / 2 - 1, SH110X_WHITE);
  display.display();
}

void oledBottom(String msg, uint8_t line, bool sendToFirebase) {
  bottomMsg = msg;
  display.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setCursor(0, SCREEN_HEIGHT / 2);
  display.print('\n');
  display.println(bottomMsg);
  display.display();
  Serial.println("OLED Bottom: " + msg);

  if (sendToFirebase && firebaseReady) {
    FirebaseJson json;
    json.set("msg", msg);
    Firebase.RTDB.pushJSON(&fbdo, "/messages", &json);
  }
}

void oledBottomRefresh() {
  display.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2, SH110X_BLACK);
  display.setCursor(0, SCREEN_HEIGHT / 2);
  display.print('\n');
  display.println(bottomMsg);
  display.display();
}

// ---------------- Firebase helper ----------------
bool writeFirebase(String path, FirebaseJson &json) {
  if (!firebaseReady) return false;
  return Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json);
}

// ---------------- Timestamp ----------------
String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "Unknown";
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(buffer);
}

// ---------------- Read enrollment data ----------------
bool readEnrollData(FirebaseJson &json, String &name, String &regNum, String &indexNum, String &email) {
  FirebaseJsonData jsonData;
  if (!json.get(jsonData, "name")) return false; name = jsonData.stringValue;
  if (!json.get(jsonData, "regNum")) return false; regNum = jsonData.stringValue;
  if (!json.get(jsonData, "indexNum")) return false; indexNum = jsonData.stringValue;
  if (!json.get(jsonData, "email")) return false; email = jsonData.stringValue;
  return true;
}

// ---------------- Enrollment ----------------
void enrollFinger(FirebaseJson &enrollDataJson) {
  if (studentCount >= MAX_STUDENTS) {
    oledBottom("Max students!", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  String name, regNum, indexNum, email;
  if (!readEnrollData(enrollDataJson, name, regNum, indexNum, email)) {
    oledBottom("Invalid data!", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  uint8_t id = studentCount + 1;
  int p = -1;

  oledBottom("Place finger...", 0, true);
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p != FINGERPRINT_NOFINGER) oledBottom("Image error!", 0, true);
    delay(50);
  }
  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    oledBottom("Image fail", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    oledBottom("Already Enrolled!", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    if (firebaseReady) Firebase.RTDB.deleteNode(&fbdo, "/messages");
    return;
  }

  oledBottom("Remove finger", 0, true); delay(2000);
  while (finger.getImage() != FINGERPRINT_NOFINGER);

  oledBottom("Place again...", 0, true);
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    if (p != FINGERPRINT_NOFINGER) oledBottom("Image error!", 0, true);
    delay(50);
  }
  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    oledBottom("2nd fail", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  if (finger.createModel() != FINGERPRINT_OK) {
    oledBottom("Model fail", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }
  if (finger.storeModel(id) != FINGERPRINT_OK) {
    oledBottom("Store fail", 0, true);
    digitalWrite(RED_LED, HIGH); delay(1000); digitalWrite(RED_LED, LOW);
    return;
  }

  students[studentCount].id = id;
  name.toCharArray(students[studentCount].name, 20);
  regNum.toCharArray(students[studentCount].regNum, 15);
  indexNum.toCharArray(students[studentCount].indexNum, 15);
  email.toCharArray(students[studentCount].email, 15);
  studentCount++;
  saveStudentsToEEPROM();

  oledBottom("Enroll Success:\n \n -> " + name, 0, true);
  digitalWrite(GREEN_LED, HIGH); delay(1000); digitalWrite(GREEN_LED, LOW);

  if (firebaseReady) {
    String path = "/students/" + String(id);
    FirebaseJson json;
    json.set("id", id);
    json.set("name", name);
    json.set("regNum", regNum);
    json.set("indexNum", indexNum);
    json.set("email", email);
    writeFirebase(path, json);
    Firebase.RTDB.deleteNode(&fbdo, "/messages");
  }
}

// ---------------- Verification ----------------
void verifyFingerNonBlocking() {
  static unsigned long lastCheck = 0;
  static bool showingMsg = false;

  if (millis() - lastCheck < 200) return;
  lastCheck = millis();

  int p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER) {
    if (!showingMsg) { oledBottom("Place finger..."); showingMsg = true; }
    return;
  } else if (p != FINGERPRINT_OK) {
    oledBottom("Image error!");
    digitalWrite(RED_LED, HIGH); delay(500); digitalWrite(RED_LED, LOW);
    showingMsg = false;
    return;
  }
  showingMsg = false;

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    oledBottom("Image conv fail");
    digitalWrite(RED_LED, HIGH); delay(500); digitalWrite(RED_LED, LOW);
    return;
  }

  if (finger.fingerFastSearch() == FINGERPRINT_OK) {
    uint8_t id = finger.fingerID;
    String name = "Unknown", regNum = "", indexNum = "", email = "";
    for (uint8_t i = 0; i < studentCount; i++) {
      if (students[i].id == id) {
        name = String(students[i].name);
        regNum = String(students[i].regNum);
        indexNum = String(students[i].indexNum);
        email = String(students[i].email);
      }
    }

    oledBottom("Welcome:\n \n-> " + name);
    digitalWrite(GREEN_LED, HIGH); delay(500); digitalWrite(GREEN_LED, LOW);

    if (firebaseReady) {
      String path = "/attendance/" + String(id) + "_" + String(millis());
      FirebaseJson json;
      json.set("id", id);
      json.set("name", name);
      json.set("regNum", regNum);
      json.set("indexNum", indexNum);
      json.set("email", email);
      json.set("timestamp", getTimestamp());
      writeFirebase(path, json);
    }
  } else {
    oledBottom("No Match!");
    digitalWrite(RED_LED, HIGH); delay(500); digitalWrite(RED_LED, LOW);
  }
}

// ---------------- Wi-Fi / Firebase Reconnect ----------------
void reconnectWiFi() {
  Serial.println("Reconnecting Wi-Fi...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) { delay(500); Serial.print("."); }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Reconnected!");
    digitalWrite(GREEN_LED, HIGH); digitalWrite(RED_LED, LOW);
  } else {
    Serial.println("\nWi-Fi Failed!");
    digitalWrite(RED_LED, HIGH); digitalWrite(GREEN_LED, LOW);
  }
}

void reconnectFirebase() {
  Serial.println("Reconnecting Firebase...");
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ---------------- EEPROM Functions ----------------
void saveStudentsToEEPROM() {
  EEPROM.write(0, studentCount);
  int addr = 1;
  for (int i = 0; i < studentCount; i++) {
    EEPROM.write(addr++, students[i].id);
    for (int j = 0; j < 20; j++) EEPROM.write(addr++, students[i].name[j]);
    for (int j = 0; j < 15; j++) EEPROM.write(addr++, students[i].regNum[j]);
    for (int j = 0; j < 15; j++) EEPROM.write(addr++, students[i].indexNum[j]);
    for (int j = 0; j < 15; j++) EEPROM.write(addr++, students[i].email[j]);
  }
  EEPROM.commit();
}

void loadStudentsFromEEPROM() {
  studentCount = EEPROM.read(0);
  if (studentCount > MAX_STUDENTS) studentCount = 0;
  int addr = 1;
  for (int i = 0; i < studentCount; i++) {
    students[i].id = EEPROM.read(addr++);
    for (int j = 0; j < 20; j++) students[i].name[j] = EEPROM.read(addr++);
    for (int j = 0; j < 15; j++) students[i].regNum[j] = EEPROM.read(addr++);
    for (int j = 0; j < 15; j++) students[i].indexNum[j] = EEPROM.read(addr++);
    for (int j = 0; j < 15; j++) students[i].email[j] = EEPROM.read(addr++);
  }
  Serial.println("Loaded " + String(studentCount) + " students from EEPROM");
}
