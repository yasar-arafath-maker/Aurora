# 🌞 Aurora Solar - Professional Android App (Native Kotlin + Jetpack Compose)

This is a modern, production-grade Android application built using **Jetpack Compose**, **Material 3**, **CameraX**, and **Coroutines**, implementing the **"Now vs With Solar" Before-After Interactive Split Interface**.

---

## 🇮🇳 தமிழ் வழிமுறைகள் (Android Studio-வில் நீங்கள் செய்ய வேண்டியவை)

நீங்களாக எந்த ஒரு கோடும் (code) எழுதத் தேவையில்லை! எல்லா கோப்புகளும் தயாராக உள்ளன.

### எளிய 3 படிகள்:

1. **Android Studio திறக்கவும்:**
   - உங்கள் கணினியில் உள்ள **Android Studio** செயலியை திறக்கவும்.
   - முகப்புத் திரையில் உள்ள **"Open"** (கோப்பு திறக்கும் ஐகான்) பொத்தானை அழுத்தவும்.

2. **இந்த Android கோப்புறையை தேர்வு செய்யவும்:**
   - பாதை (Path):
     `c:\Users\athit\.gemini\antigravity-ide\scratch\aurora\android`
   - இதை தேர்ந்தெடுத்து **OK** கொடுக்கவும்.
   - Android Studio 1 நிமிடம் Gradle Sync செய்யும் (தானாகவே லைப்ரரிகள் டவுன்லோட் ஆகும்).

3. **செயலியை இயக்கவும் (Run):**
   - உங்கள் ஆண்ட்ராய்டு மொபைலை USB கேபிள் மூலம் கணினியுடன் இணைக்கவும் (அல்லது உள்ளமைக்கப்பட்ட Android Emulator பயன்படுத்தவும்).
   - மேலே உள்ள பச்சை நிற **▶️ Run** பொத்தானை அழுத்தவும்!
   - செயலி உங்கள் மொபைலில் முழு திரையில் (Full Screen) நிறுவப்பட்டு விடும்!

---

## 📱 App Highlights & Features

1. **Before-After Interactive Slider:**
   - Touch and drag handle left/right to compare **"NOW (Empty Space & High Bills)"** vs **"WITH SOLAR (Clean panels & ₹0 Zero Bill)"**.
2. **Space Preset Selector:**
   - 🏢 Flat Rooftop Terrace (மொட்டை மாடி)
   - 🌿 Apartment Balcony (பால்கனி)
   - 🏠 Slanted Tile Roof (ஓட்டு வீடு)
   - 🏭 Industrial Metal Shed (டின் கொட்டகை)
   - 🌳 Open Backyard (தோட்டம்)
3. **Live CameraX Space Scanning:**
   - Real-time camera viewfinder with alignment box for roofs and balconies.
4. **Dynamic Energy & Subsidy Calculator:**
   - Stepper to adjust 2 to 12 solar panels.
   - Calculates real-time **Monthly Savings (₹)**, **Units Generated**, and **PM Surya Ghar DBT Subsidy (₹78,000)**.
5. **Tamil & English Bilingual Switcher:**
   - One-tap switch between Tamil and English.
6. **1-Tap Action Sheet:**
   - Direct dialer to certified Tata Power / Adani Solar installers.
   - Instant WhatsApp Feasibility Report sharing.

---

## 💻 Tech Stack
- **Language**: Kotlin 2.0
- **UI Framework**: Android Jetpack Compose + Material 3
- **Camera**: CameraX (Camera2, Lifecycle, PreviewView)
- **Architecture**: MVVM with StateFlow
- **Min SDK**: API 26 (Android 8.0+)
- **Target SDK**: API 35 (Android 15+)
