# 📌 ESP32 Fingerprint Attendance System v2.0

## 📖 Overview
An intelligent IoT-based attendance management system combining biometric authentication with cloud connectivity. Perfect for educational institutions and organizations seeking to automate attendance tracking securely and efficiently.

## ⭐ Key Features
### Hardware Features
- 🔐 **Biometric Authentication** via AS608 Fingerprint Sensor
- 📱 **OLED Display** for real-time user feedback and status
- 💡 **Dual LED Indicators** for operation status
- 🔌 **Offline Capability** with EEPROM storage
- ⚡ **Power-Efficient Design** with sleep mode support

### Software Features
- 🌐 **Real-time Firebase Integration**
- 📊 **React Web Dashboard**
  - Student Management
  - Attendance Tracking
  - Timetable Integration
- 🔒 **Secure Authentication**
- 📱 **Responsive Design**

## 🛠️ Technical Requirements

### Hardware Components
| Component | Specification | Purpose |
|-----------|---------------|----------|
| ESP32 | Any ESP32 Dev Board | Main Controller |
| AS608 | Optical Fingerprint Sensor | Biometric Capture |
| Display | SH1107 OLED 128x128 | User Interface |
| LEDs | 2x (Green/Red) + 220Ω | Status Indicators |
| Power | 5V USB/External Supply | Power Source |

### Software Requirements
- **Development Environment**
  - VS Code + PlatformIO
  - Node.js v16+ & npm
  - Git
- **Cloud Services**
  - Firebase Project
  - Google Cloud Platform (optional)

## 📡 System Architecture

### Hardware Layout
```
ESP32 Development Board
├── AS608 Sensor (UART)
│   ├── TX → GPIO 19
│   └── RX → GPIO 18
├── OLED Display (I2C)
│   ├── SDA → GPIO 21
│   └── SCL → GPIO 22
└── Status LEDs
    ├── Green → GPIO 2
    └── Red → GPIO 4
```

### Software Architecture
```
Web Dashboard (React/Vite)
└── Firebase RTDB
    └── ESP32 Controller
        ├── Local EEPROM
        ├── Fingerprint DB
        └── Status Display
```

## 🚀 Quick Start Guide

### 1. Hardware Setup
1. Connect components following wiring diagram
2. Verify power connections
3. Test basic functionality

### 2. ESP32 Firmware
```bash
# Clone repository
git clone https://github.com/kajanthann/esp32-attendance.git

# Install PlatformIO CLI (if needed)
pip install platformio

# Build & Upload
cd esp32-attendance
pio run -t upload
```

### 3. Web Dashboard
```bash
# Setup dashboard
cd Attendance
npm install
npm run dev

# Access dashboard
open http://localhost:5173
```

## 📂 Project Structure
```
IOT/
├── docs/                    # Documentation
├── hardware/               # Circuit diagrams
├── esp32-attendance/       # ESP32 Firmware
│   ├── src/
│   │   ├── main.cpp       # Main program
│   │   └── config.h       # Configuration
│   └── platformio.ini
└── Attendance/            # Web Dashboard
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/        # Route pages
    │   └── utils/        # Helpers
    └── public/           # Static assets
```

## 🔧 Configuration

### ESP32 Settings
```cpp
// secrets.h
#define WIFI_SSID "your_ssid"
#define WIFI_PASS "your_password"
#define FIREBASE_URL "your_firebase_url"
```

### Firebase Setup
1. Create new Firebase project
2. Enable Realtime Database
3. Configure security rules
4. Add credentials to `secrets.h`

## 📊 Dashboard Features
- Student Registration & Management
- Real-time Attendance Monitoring
- Timetable Management
- Analytics Dashboard
- Admin Settings

## 🔍 Troubleshooting

### Common Issues
1. **Fingerprint Enrollment Fails**
   - Clean sensor surface
   - Verify finger placement
   - Check serial connection

2. **WiFi Connection Issues**
   - Verify credentials
   - Check signal strength
   - Reset ESP32

3. **Dashboard Access Problems**
   - Clear browser cache
   - Check Firebase rules
   - Verify admin credentials

## 🤝 Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Submit pull request

## 📄 License
MIT License - See [LICENSE](LICENSE)

## 📞 Support
- GitHub Issues: [Project Issues](https://github.com/kajanthann/esp32-attendance/issues)
- Email: support@example.com
- Documentation: [Wiki](https://github.com/kajanthann/esp32-attendance/wiki)
