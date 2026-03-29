# ESP32 IoT Student Fingerprint Attendance System

A complete IoT-based attendance tracking system leveraging ESP32 microcontroller with fingerprint biometric sensors, real-time Firebase synchronization, and a modern React web dashboard.

## 🎯 Project Overview

This system provides an automated, secure, and efficient way to track student attendance using biometric fingerprint recognition. The system consists of three main components:

1. **Hardware Layer** - ESP32-based device with fingerprint sensor and OLED display
2. **Backend Layer** - Node.js MQTT-Firebase bridge server
3. **Frontend Layer** - React-based web dashboard for analytics and management

### Key Features

✅ **Biometric Authentication** - Fingerprint-based attendance marking  
✅ **Real-time Synchronization** - MQTT bridge for reliable data transmission  
✅ **Offline Support** - Local EEPROM storage with sync on reconnection  
✅ **Web Dashboard** - Comprehensive analytics and attendance tracking  
✅ **Student Management** - Register, manage, and monitor student records  
✅ **Time Table Integration** - Schedule-based attendance analysis  
✅ **Module Tracking** - Course and module-wise attendance reports  
✅ **Cloud Storage** - Firebase Realtime Database for secure data persistence  

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         ESP32 IoT Device (Fingerprint Station)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Fingerprint Sensor (AS608)                         │   │
│  │ • OLED Display (SH1107 - 128x128)                    │   │
│  │ • WiFi Connectivity                                  │   │
│  │ • Real-time Clock (NTP Sync - IST +5:30)            │   │
│  │ • LED Indicators (Green/Red)                         │   │
│  │ • Local EEPROM Storage (50 students, 30 records)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                    MQTT over SSL/TLS                         │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼─────────────┐         ┌────────────▼────────────┐
│   MQTT Broker       │         │  Node.js Backend Server │
│   (Public MQTT)     │         │  ┌────────────────────┐ │
└─────────────────────┘         │  │ MQTT Listener      │ │
                                │  │ Timestamp Validator│ │
                                │  │ Deduplication      │ │
                                │  │ Firebase Writer    │ │
                                │  └────────────────────┘ │
                                └────────────┬────────────┘
                                             │
                            ┌────────────────┴────────────────┐
                            │                                 │
                    ┌───────▼──────────┐         ┌────────────▼───────┐
                    │  Firebase RTD    │         │  Service Account   │
                    │  • /students     │         │  Authentication    │
                    │  • /attendance   │         │  (serviceAccountKey)
                    │  • /modules      │         │                    │
                    │  • /timetable    │         │                    │
                    └───────┬──────────┘         └────────────────────┘
                            │
                            │ REST API
                            │
                    ┌───────▼──────────────────┐
                    │  React Web Dashboard     │
                    │  ┌────────────────────┐  │
                    │  │ • Login Page       │  │
                    │  │ • Student Manager  │  │
                    │  │ • Attendance View  │  │
                    │  │ • Analytics        │  │
                    │  │ • Time Table       │  │
                    │  │ • Modules          │  │
                    │  └────────────────────┘  │
                    │  Built with Vite         │
                    │  Styled with Tailwind    │
                    └──────────────────────────┘
```

---

## 📁 Project Structure

```
EM_IOT_Att/
├── README.md                          # This file
├── Attendance/                         # React Frontend Application
│   ├── package.json                   # Dependencies
│   ├── vite.config.js                 # Vite configuration
│   ├── eslint.config.js               # ESLint rules
│   ├── index.html                     # Entry HTML
│   ├── src/
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.jsx                    # Root component
│   │   ├── firebase.js                # Firebase initialization
│   │   ├── index.css                  # Global styles
│   │   ├── components/
│   │   │   ├── Header.jsx             # Navigation header
│   │   │   ├── Footer.jsx             # Page footer
│   │   │   ├── Hero.jsx               # Landing hero section
│   │   │   └── RegisterStudent.jsx    # Student registration modal
│   │   ├── context/
│   │   │   └── AppContext.jsx         # Global state management
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Home page
│   │   │   ├── Login.jsx              # Admin login
│   │   │   ├── Students.jsx           # Student management
│   │   │   ├── Attendance.jsx         # Attendance tracking
│   │   │   ├── TimeTable.jsx          # Schedule view
│   │   │   ├── ModuleCards.jsx        # Course overview
│   │   │   └── ModuleDetails.jsx      # Course details
│   │   ├── utils/
│   │   │   └── attendanceUtils.js     # Attendance calculations
│   │   └── assets/                    # Static assets
│   └── public/                        # Public static files
│
├── server/                            # Node.js Backend Server
│   ├── package.json                   # Dependencies
│   ├── server.js                      # Main server file
│   ├── serviceAccountKey.json         # Firebase credentials (⚠️ Secret)
│   └── .env (if using .env file)      # Environment variables
│
└── esp32-attendance/                  # Arduino/PlatformIO Firmware
    ├── platformio.ini                 # PlatformIO configuration
    ├── src/
    │   ├── main.cpp                   # Firmware main code
    │   └── secrets.h                  # WiFi & MQTT credentials
    ├── lib/                           # Custom libraries
    ├── include/                       # Header files
    └── test/                          # Unit tests
```

---

## 🔧 Tech Stack

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.10
- **Styling**: TailwindCSS 4.1.12
- **animations**: Framer Motion 12.23.24
- **Database**: Firebase Realtime Database
- **Icons**: Lucide React, Heroicons
- **Charting**: Recharts 3.1.2
- **CSV Parsing**: PapaParse 5.5.3

### Backend
- **Runtime**: Node.js
- **MQTT Client**: mqtt 5.0.1
- **Firebase**: firebase-admin 11.10.1
- **Environment**: dotenv 16.3.1
- **Dev Tools**: nodemon 3.1.14

### Hardware (ESP32)
- **Microcontroller**: ESP32
- **Fingerprint Sensor**: Adafruit AS608
- **Display**: Adafruit SH1107 (128x128 OLED)
- **Communication**: WiFi + MQTT over SSL/TLS
- **Libraries**: 
  - PubSubClient (MQTT)
  - ArduinoJson (JSON serialization)
  - Adafruit GFX/SH110X (OLED)
  - Adafruit Fingerprint

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** v16+ (for backend and frontend)
- **PlatformIO IDE** or Arduino IDE (for ESP32)
- **Firebase Project** with Realtime Database
- **MQTT Broker** (public or self-hosted)
- **WiFi Network** with internet access

### 1. Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable **Realtime Database** (Start in test mode)
3. Create database structure:
   ```
   esp32-attendance-db/
   ├── students/      {id: {name, regNum, fingerprintId, enrolledDate}}
   ├── attendance/    {id_timestamp: {studentId, name, regNum, timestamp}}
   ├── modules/       {moduleId: {name, code, students}}
   └── timetable/     {id: {day, time, module}}
   ```
4. Download service account key JSON and save as `server/serviceAccountKey.json`

### 2. Backend Server Setup

```bash
cd server
npm install

# Create .env file
echo "FIREBASE_DB_URL=https://your-project-default-rtdb.firebaseio.com" > .env
echo "MQTT_BROKER=mqtt.your-broker.com" >> .env
echo "MQTT_PORT=8883" >> .env
echo "MQTT_USERNAME=your_username" >> .env
echo "MQTT_PASSWORD=your_password" >> .env

# Start server
npm start        # Production
npm run dev      # Development (with nodemon)
```

**Server Validation Features**:
- Timestamp validation (rejects clocks before 2020, >5min future)
- Deduplication (prevents duplicate attendance records)
- ISO-8601 timezone handling (IST +5:30)
- Graceful Firebase error handling

### 3. Frontend Setup

```bash
cd Attendance
npm install

# Development server
npm run dev      # http://localhost:5173

# Build for production
npm run build    # Creates dist/ folder

# Deploy to GitHub Pages
npm run deploy
```

**Environment Variables** in `src/firebase.js`:
```javascript
// Already configured in firebase.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  // ... other config
};
```

### 4. ESP32 Firmware Setup

#### Option A: Using PlatformIO (Recommended)

```bash
cd esp32-attendance

# Edit platformio.ini for your board
# Ensure ESP32-DEV or compatible is selected

# Configure secrets.h
cp src/secrets.h.example src/secrets.h
# Edit src/secrets.h with:
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASS "Your_WiFi_Password"
#define MQTT_SERVER "mqtt.broker.com"
#define MQTT_PORT 8883

# Build and upload
pio run -t upload -e esp32dev
```

#### Option B: Using Arduino IDE

1. Install ESP32 board library
2. Install required libraries:
   - Adafruit SH110X
   - Adafruit Fingerprint
   - PubSubClient
   - ArduinoJson
3. Configure WiFi and MQTT in `secrets.h`
4. Upload via Arduino IDE

**Key ESP32 Configurations**:
- **Timezone**: UTC+5:30 (IST) - modify `gmtOffset_sec` for your timezone
- **EEPROM**: 4096 bytes
  - Students: 50 max records
  - Offline Attendance: 30 max records
- **NTP Resync**: Every 1 hour
- **OLED Display**: 128x128 SH1107
- **Serial Baud**: 115200

---

## 📱 Usage Guide

### Admin Login
1. Navigate to `/login`
2. Enter admin email: `smarfingeriot32@gmail.com` (configurable in App.jsx)
3. Authenticate with Firebase

### Student Time Attendance
1. **Enrollment**: Admin registers students with fingerprint ID
2. **Marking**: Student places finger on sensor at attendance station
3. **Offline Sync**: If offline, records stored locally and synced when online
4. **Verification**: LED indicators show success (green) or error (red)

### Dashboard Features

#### **Home Page** (`/home`)
- Overview statistics
- Recent attendance information
- Quick navigation

#### **Students Page** (`/students`)
- View all registered students
- Search by name, registration number, or fingerprint ID
- Register new students (admin only)
- Manage student records

#### **Attendance Page** (`/attendance`)
- View attendance by date/month/year
- Filter by attendance status (Present/Absent)
- Calculate attendance percentage
- Download attendance reports (CSV)

#### **Time Table Page** (`/time-table`)
- View class schedule
- Schedule-based attendance analysis
- Day and module-wise breakdown

#### **Modules Page** (`/modules`)
- Course/Module overview
- Student enrollment per module
- Module-wise attendance statistics

---

## 🛠️ API Endpoints & MQTT Topics

### MQTT Topics (ESP32 ↔ Server)

| Topic | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `fp/attendance` | ESP32 → Server | `{studentId, name, regNum, timestamp}` | Submit attendance record |
| `fp/enrolled` | Server → ESP32 | `{id, name, fingerprintId}` | Sync enrolled students |
| `fp/heartbeat` | ESP32 → Server | `{uptime, heapFree}` | Keep-alive signal |
| `fp/message` | Server → ESP32 | `{type, text}` | Display message on OLED |
| `fp/systemState` | Server → ESP32 | `{state}` | System state update |
| `fp/enrollData` | Server → ESP32 | `{id, name}` | Enrollment data sync |
| `fp/stateAck` | ESP32 → Server | `{ack}` | Acknowledge state change |

### Firebase REST Paths

| Path | Method | Purpose |
|------|--------|---------|
| `/students` | GET/POST/PUT | Manage student records |
| `/attendance` | GET/POST | View/log attendance |
| `/modules` | GET/POST | Course management |
| `/timetable` | GET | Schedule data |

---

## 🔒 Security Considerations

⚠️ **Important Security Notes**:

1. **Service Account Key**: Keep `serviceAccountKey.json` **SECRET**
   - Never commit to GitHub
   - Add to `.gitignore`
   - Use environment variables in production

2. **Firebase Security Rules**: Configure appropriate rules:
   ```json
   {
     "rules": {
       "students": {
         ".read": "auth != null",
         ".write": "root.child('admins').child(auth.uid).exists()"
       },
       "attendance": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
   }
   ```

3. **MQTT Security**:
   - Use SSL/TLS encryption (port 8883)
   - Store credentials in `secrets.h`
   - Rotate credentials periodically

4. **Admin Access**:
   - Restrict admin functions to authorized email
   - Current hardcoded admin: `smarfingeriot32@gmail.com`
   - Implement role-based access control

5. **ESP32 Firmware**:
   - Enable firmware encryption in PlatformIO
   - Secure WiFi credentials in hardware

---

## 🐛 Troubleshooting

### ESP32 Issues

| Issue | Solution |
|-------|----------|
| **No WiFi connection** | Check SSID/password in `secrets.h`, verify network range |
| **MQTT connection fails** | Verify broker address, port, credentials, firewall rules |
| **Fingerprint not recognized** | Re-enroll student, check sensor cleanliness |
| **OLED display blank** | Verify I2C address (0x3C), check SDA/SCL wiring |
| **NTP time not syncing** | Check internet connection, verify timezone offset |
| **EEPROM full** | Clear data or reduce MAX_STUDENTS/MAX_OFFLINE_ATTENDANCE |

### Backend Server Issues

| Issue | Solution |
|-------|----------|
| **Firebase connection error** | Verify `serviceAccountKey.json` path and validity |
| **MQTT connection drops** | Increase `keepalive` timeout, check network stability |
| **Duplicate records** | Check server deduplication logic, verify timestamps |
| **Missing environment vars** | Create `.env` with required variables |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| **Login not working** | Check Firebase project credentials in `firebase.js` |
| **No attendance data** | Verify backend is running and MQTT connected |
| **Build errors** | Run `npm install` again, check Node.js version |
| **Deployment fails** | Verify GitHub Pages settings, run `npm run build` |

---

## 📊 Database Schema

### Students Collection
```json
{
  "students": {
    "student_001": {
      "name": "John Doe",
      "regNum": "REG001",
      "fingerprintId": 1,
      "enrolledDate": "2024-01-15T10:30:00+05:30",
      "module": "CS101"
    }
  }
}
```

### Attendance Collection
```json
{
  "attendance": {
    "student_001_2024-01-15T10-30-00": {
      "studentId": "student_001",
      "name": "John Doe",
      "regNum": "REG001",
      "timestamp": "2024-01-15T10:30:00+05:30",
      "status": "present"
    }
  }
}
```

### Modules Collection
```json
{
  "modules": {
    "cs101": {
      "name": "Data Structures",
      "code": "CS101",
      "instructor": "Dr. Smith",
      "students": ["student_001", "student_002"]
    }
  }
}
```

---

## 📈 Key Metrics & Features

- **Real-time Sync**: <1sec attendance data propagation
- **Offline Capacity**: 30 attendance records in EEPROM
- **Student Limit**: 50 enrolled students per device
- **Database**: Firebase Realtime Database (unlimited)
- **Display**: 128x128 OLED with real-time feedback
- **Accuracy**: Biometric fingerprint matching (>99%)
- **Uptime**: 24/7 operation with NTP sync

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 📞 Support & Contact

**Author**: Arulaiah Kajanthan  
**Email**: smarfingeriot32@gmail.com  
**GitHub**: [kajanthann](https://github.com/kajanthann/ESP32_IOT_STUDENT_FINGERPRINT_ATTENDANCE_SYSTEM)

### Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [MQTT Protocol](https://mqtt.org/)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)

---

**Last Updated**: March 29, 2026  
**Version**: 1.0.0
