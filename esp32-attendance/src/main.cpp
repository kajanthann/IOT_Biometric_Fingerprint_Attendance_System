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

// --- OLED setup ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 128
Adafruit_SH1107 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire);

// --- ESP32 UART for AS608 ---
HardwareSerial mySerial(1);
#define RX_PIN 18
#define TX_PIN 19
Adafruit_Fingerprint finger(&mySerial);

// --- LED pins ---
#define GREEN_LED 2
#define RED_LED 4


WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

config.database_url = FIREBASE_HOST;
config.signer.tokens.legacy_token = FIREBASE_AUTH;


FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

struct Student {
  uint8_t id;
  String name;
  String regNum;
  String indexNum;
};
Student students[50];
uint8_t studentCount = 0;

bool firebaseReady = false;

enum SystemState { IDLE, ENROLL, VERIFY };
SystemState currentState = IDLE;

// NTP time settings
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800;   // GMT+5:30 (Sri Lanka/India)
const int daylightOffset_sec = 0;

// ---------------- Function Prototypes ----------------
void oledMsg(String msg, uint8_t line = 0);
void oledIdle();
void enrollFinger();
void verifyFinger();
bool writeFirebase(String path, FirebaseJson &json);
String getTimestamp();

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  // Initialize OLED
  Wire.begin(21, 22);
  if (!display.begin(0x3C, true)) {
    Serial.println(F("OLED init failed"));
    while (1);
  }
  display.clearDisplay();
  display.setRotation(0);
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  oledMsg("System Booting...");

  // Initialize fingerprint sensor
  mySerial.begin(57600, SERIAL_8N1, RX_PIN, TX_PIN);
  delay(100);
  oledMsg("Checking AS608...");
  if (finger.verifyPassword()) {
    oledMsg("AS608 Found!");
    Serial.println("AS608 Found!");
    Serial.print("Sensor contains "); Serial.print(finger.templateCount); Serial.println(" templates");
  } else {
    oledMsg("AS608 NOT FOUND!");
    Serial.println("Check wiring!");
    digitalWrite(RED_LED, HIGH);
    while (1) delay(1);
  }

  // Connect Wi-Fi
  oledMsg("Connecting Wi-Fi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 20000) break;
  }

  if (WiFi.status() == WL_CONNECTED) {
    oledMsg("Wi-Fi Connected!");
    Serial.println("Wi-Fi Connected. IP: " + WiFi.localIP().toString());
    digitalWrite(GREEN_LED,HIGH);

    // Init NTP
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  } else {
    oledMsg("Wi-Fi Failed!");
    Serial.println("Wi-Fi connection failed");
    digitalWrite(RED_LED, HIGH);
  }

  // Firebase init
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.ready()) {
    firebaseReady = true;
    oledMsg("Firebase Ready!");
    Serial.println("Firebase Ready");
  } else {
    oledMsg("Firebase Failed!");
    Serial.println("Firebase init failed");
  }

  currentState = IDLE;
  oledIdle();
}

void loop() {
  switch (currentState) {
    case IDLE:
      if (Serial.available()) {
        char key = Serial.read();
        while (Serial.available()) Serial.read();
        if (key == '1') currentState = ENROLL;
        else if (key == '2') currentState = VERIFY;
        else Serial.println("Invalid key. Press 1 or 2");
      }
      break;

    case ENROLL:
      enrollFinger();
      currentState = IDLE;
      oledIdle();
      break;

    case VERIFY:
      verifyFinger();
      currentState = IDLE;
      oledIdle();
      break;
  }
  delay(100);
}

// ---------------- OLED helpers ----------------
void oledMsg(String msg, uint8_t line) {
  display.clearDisplay();
  display.setCursor(0, line * 10);
  display.println(msg);
  display.display();
  Serial.println("OLED: " + msg);
}

void oledIdle() {
  display.clearDisplay();
  display.setCursor(0,0);
  display.println("Press 1-Enroll");
  display.setCursor(0,10);
  display.println("2-Verify");
  display.display();
}

// ---------------- Firebase helper ----------------
bool writeFirebase(String path, FirebaseJson &json) {
  if (WiFi.status() != WL_CONNECTED) WiFi.reconnect();
  if (!Firebase.ready()) Firebase.begin(&config, &auth);
  return Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json);
}

// ---------------- Get Timestamp ----------------
String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "Unknown";
  }
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

// ---------------- Enrollment ----------------
void enrollFinger() {
  if (studentCount >= 50) { oledMsg("Max students reached!"); return; }

  uint8_t id = studentCount + 1;
  int p = -1;
  oledMsg("Place finger...");
  Serial.println("Enroll ID: " + String(id));

  // First scan
  while (p != FINGERPRINT_OK) { p = finger.getImage(); delay(50); }
  if (finger.image2Tz(1) != FINGERPRINT_OK) { oledMsg("Image fail"); return; }

  // 🔥 Check if finger already exists
  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    oledMsg("Already Enrolled!");
    Serial.println("Finger already exists! ID: " + String(finger.fingerID));
    digitalWrite(RED_LED,HIGH);
    delay(2000);
    digitalWrite(RED_LED,LOW);
    return;
  }

  oledMsg("Remove finger");
  delay(2000);
  while (finger.getImage() != FINGERPRINT_NOFINGER);

  oledMsg("Place same finger...");
  p = -1;
  while (p != FINGERPRINT_OK) { p = finger.getImage(); delay(50); }
  if (finger.image2Tz(2) != FINGERPRINT_OK) { oledMsg("Image 2 fail"); return; }

  if (finger.createModel() != FINGERPRINT_OK) { oledMsg("Model fail"); return; }
  if (finger.storeModel(id) != FINGERPRINT_OK) { oledMsg("Store fail"); return; }

  // Get student details
  oledMsg("Enter details in Serial",1);
  Serial.println("Enter student's name:");
  String name = ""; while (Serial.available() == 0) delay(100); name = Serial.readStringUntil('\n'); name.trim();

  Serial.println("Enter student's RegNum:");
  String regNum = ""; while (Serial.available() == 0) delay(100); regNum = Serial.readStringUntil('\n'); regNum.trim();

  Serial.println("Enter student's IndexNum:");
  String indexNum = ""; while (Serial.available() == 0) delay(100); indexNum = Serial.readStringUntil('\n'); indexNum.trim();

  if (name.length() == 0) name = "Student_" + String(id);

  students[studentCount].id = id;
  students[studentCount].name = name;
  students[studentCount].regNum = regNum;
  students[studentCount].indexNum = indexNum;
  studentCount++;

  oledMsg("Enrolled: " + name);
  Serial.println("Enrolled: " + name + " with ID: " + String(id));

  if (firebaseReady) {
    String path = "/students/" + String(id);
    FirebaseJson json;
    json.set("id", id);
    json.set("name", name);
    json.set("regNum", regNum);
    json.set("indexNum", indexNum);
    if (writeFirebase(path,json)) {
      oledMsg("Uploaded to Firebase",1);
      Serial.println("Firebase upload success: " + path);
    } else {
      oledMsg("Firebase fail",1);
      Serial.println("Firebase upload failed: " + fbdo.errorReason());
    }
  }

  digitalWrite(GREEN_LED,HIGH);
  delay(1000);
  digitalWrite(GREEN_LED,LOW);
}

// ---------------- Verification ----------------
void verifyFinger() {
  oledMsg("Place finger...");
  int p = -1;

  while (p != FINGERPRINT_OK) { p = finger.getImage(); delay(50); }

  if (finger.image2Tz(1) != FINGERPRINT_OK) { oledMsg("Image conv fail"); return; }

  p = finger.fingerFastSearch();
  if (p == FINGERPRINT_OK) {
    uint8_t id = finger.fingerID;
    String name = "Unknown";
    String regNum = "";
    String indexNum = "";
    for (uint8_t i=0; i<studentCount; i++) {
      if (students[i].id==id) {
        name=students[i].name;
        regNum=students[i].regNum;
        indexNum=students[i].indexNum;
      }
    }

    oledMsg("Welcome: " + name);
    Serial.println("ID:" + String(id) + " Name:" + name);
    digitalWrite(GREEN_LED,HIGH);

    if (firebaseReady) {
      String path = "/attendance/" + String(id) + "_" + String(millis());
      FirebaseJson json;
      json.set("id", id);
      json.set("name", name);
      json.set("regNum", regNum);
      json.set("indexNum", indexNum);
      json.set("timestamp", getTimestamp());
      if (writeFirebase(path,json)) {
        oledMsg("Attendance logged",1);
        Serial.println("Firebase attendance uploaded: " + path);
      } else {
        oledMsg("Upload fail",1);
        Serial.println("Firebase upload failed: " + fbdo.errorReason());
      }
    }

    delay(1500);
    digitalWrite(GREEN_LED,LOW);

  } else {
    oledMsg("No Match!");
    Serial.println("Fingerprint not found");
    digitalWrite(RED_LED,HIGH);
    delay(1500);
    digitalWrite(RED_LED,LOW);
  }
}
