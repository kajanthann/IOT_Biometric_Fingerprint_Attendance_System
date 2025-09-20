# 📌 ESP32 Fingerprint Attendance System

This project is an **IoT-based Attendance Management System** built using **ESP32**, **AS608 Fingerprint Sensor**, **Adafruit OLED Display**, and **Firebase Realtime Database**.  
It allows students to **enroll fingerprints** and later verify them for **attendance logging**. Data is stored in Firebase with timestamps for tracking.

---

## 🚀 Features
- 🔑 **Fingerprint Enrollment** (AS608 sensor)
- 👆 **Fingerprint Verification**
- 🖥️ **OLED Display (SH1107)** for user feedback
- 📶 **Wi-Fi Enabled ESP32** for cloud communication
- ☁️ **Firebase Realtime Database** integration
- ⏰ **NTP Timestamping** for accurate attendance logs
- ✅ **LED Indicators** for success (Green) and failure (Red)
- 📊 **Web Dashboard** for viewing attendance, student management, and timetable

---

## 🛠️ Hardware Requirements
- **ESP32 Development Board**
- **AS608 Fingerprint Sensor**
- **Adafruit SH1107 OLED Display (128x128)**
- **LEDs (Green & Red) + Resistors**
- **Breadboard + Jumper wires**
- Wi-Fi connection

---

## 🔌 Hardware Connections

| Component                | ESP32 Pin      | Notes                        |
|--------------------------|----------------|------------------------------|
| AS608 Fingerprint Sensor | RX → GPIO 18   | ESP32 UART1 RX (finger TX)   |
|                          | TX → GPIO 19   | ESP32 UART1 TX (finger RX)   |
|                          | VCC → 3.3V     | Power                        |
|                          | GND → GND      | Ground                       |
| OLED Display (SH1107)    | SDA → GPIO 21  | I2C Data                     |
|                          | SCL → GPIO 22  | I2C Clock                    |
|                          | VCC → 3.3V     | Power                        |
|                          | GND → GND      | Ground                       |
| Green LED                | Anode → GPIO 2 | Success indicator            |
| Red LED                  | Anode → GPIO 4 | Failure indicator            |
| LEDs Cathode             | GND            | Use resistor (220Ω)          |

**Wi-Fi:**  
Connect ESP32 to a 2.4GHz Wi-Fi network.

**Power:**  
Use USB or external 5V supply for ESP32.

**Wiring Notes:**
- Use a breadboard and jumper wires for prototyping.
- Ensure correct voltage levels for all components.
- Place current-limiting resistors (220Ω) in series with LEDs.

---

## 📂 Project Structure

```
IOT/
├── Attendance/           # React web dashboard
│   ├── src/              # React source code
│   ├── public/           # Static assets
│   ├── package.json      # Dashboard dependencies
│   └── ...               # Other dashboard files
├── esp32-attendance/     # ESP32 firmware (PlatformIO)
│   ├── src/              # Main firmware code (main.cpp)
│   ├── include/          # Header files
│   ├── lib/              # Custom libraries
│   ├── platformio.ini    # PlatformIO config
│   └── ...               # Other firmware files
└── README.md             # Project documentation
```

---

## ⚡ ESP32 Firmware Overview

- Written in C++ using Arduino framework ([src/main.cpp](esp32-attendance/src/main.cpp))
- Handles fingerprint enrollment and verification via AS608 sensor
- Displays status and messages on OLED
- Connects to Wi-Fi and syncs data with Firebase
- Stores student records in EEPROM for persistence
- Uses NTP for accurate timestamps

---

## 🌐 Web Dashboard Overview

- Built with React + Vite ([Attendance/src](Attendance/src))
- Connects to Firebase for real-time data
- Admin login for secure student registration
- View attendance logs, student details, modules, and timetable
- CSV timetable import from Google Sheets
- Responsive UI with Tailwind CSS

---

## 🚦 How It Works

1. **Enrollment:** Admin registers student details via dashboard. ESP32 receives data and enrolls fingerprint.
2. **Verification:** Student scans fingerprint. ESP32 matches and logs attendance to Firebase.
3. **Dashboard:** Attendance and student data are visualized in real-time.

---

## 🏁 Getting Started

### ESP32 Firmware

1. Install [PlatformIO](https://platformio.org/) in VS Code.
2. Open `esp32-attendance/` folder.
3. Add your Wi-Fi and Firebase credentials in `src/secrets.h`.
4. Connect hardware as per requirements.
5. Build and upload firmware to ESP32.

### Web Dashboard

1. Open `Attendance/` folder.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start development server:
   ```sh
   npm run dev
   ```
4. Access dashboard at `http://localhost:5173`

---

## 📖 Documentation

- [ESP32 Firmware](esp32-attendance/src/main.cpp)
- [React Dashboard](Attendance/src/App.jsx)
- [PlatformIO Unit Testing](esp32-attendance/test/)
- [Custom Libraries](esp32-attendance/lib/)
- [Header Files](esp32-attendance/include/)

---

## 📝 License

MIT License. See [LICENSE](LICENSE) for details.