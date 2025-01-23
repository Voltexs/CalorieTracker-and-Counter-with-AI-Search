# FuelMe 🥗

A comprehensive nutrition and meal tracking application built with React Native and Expo.

---

## 🌟 Features

- **Meal Tracking**: Log your daily meals and track nutritional intake
- **Custom Meal Plans**: Create and manage personalized meal plans
- **Macro Tracking**: Monitor your protein, carbs, and fat intake
- **Step Counter**: Built-in pedometer to track daily activity
- **Nutrition Chat**: AI-powered nutrition assistant
- **Progress Visualization**: Visual representations of your nutritional goals

---

## 🚀 Tech Stack

- **React Native**
- **Expo**
- **AsyncStorage** for local data persistence
- **React Navigation**
- **Expo Sensors**
- **NativeWind** (TailwindCSS)
- **Linear Gradient**
- **React Query**

---

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Voltexs/CalorieTracker-and-Counter-with-AI-Search
   ```

2. **Install dependencies**

   ```bash
   cd FuelMe
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

---

## 📋 Environment Setup

Ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm/yarn**
- **Expo CLI**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

---

## 🔑 API Keys

The app uses **Nutritionix API** for food data. You'll need to set up your API keys in:

```javascript
export const NUTRITIONIX_CONFIG = {
  APP_ID: 'YOUR_APP_ID',
  API_KEY: 'YOUR_API_KEY',
  BASE_URL: 'https://trackapi.nutritionix.com/v2'
};
```

> **Important:** Keep your API keys secure and do not expose them in public repositories.

---

## 📦 Available Scripts

Reference from `package.json`:

```json
"scripts": {
  "start": "expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web"
}
```

---

## 🏗️ Project Structure

```
FuelMe/
├── src/
│   ├── screens/         # Screen components
│   ├── components/      # Reusable components
│   ├── config/          # Configuration files
│   └── theme/           # Theme and styling
├── assets/             # Images and fonts
└── android/            # Native Android files
```

---

## 📱 APK Download

The Android APK is available for download. [Download the latest release here](https://github.com/Voltexs/CalorieTracker-and-Counter-with-AI-Search/releases/tag/v1.0.0).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the **BSD License** - see the LICENSE file for details.

---

## 👨‍💻 Author

**Janco** - Initial Work,
**Cassie** - Initial Work

---

## 📝 Note

This project is still under development. Features and documentation may change.
