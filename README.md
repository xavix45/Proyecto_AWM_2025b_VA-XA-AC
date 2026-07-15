# 🎫 FestiMap Ecuador - Premium Edition

[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.1-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-1.36-blue?logo=google&logoColor=white)](https://ai.google.dev/)

> A comprehensive platform for managing and discovering cultural events and festivals in Ecuador, powered by Artificial Intelligence and Geolocation.

---

## 📖 About the Project

**FestiMap Ecuador** is a technological solution designed to centralize the country's cultural information. It allows users to discover local festivities, plan smart travel routes, and receive personalized assistance through an AI assistant, while offering organizers a robust administrative dashboard for event management.

### ✨ Key Features

* **🤖 AI Assistant (Gemini):** Smart event queries, personalized recommendations, and itinerary planning.
* **🗺️ Interactive Map & GPS:** Real-time event visualization with `expo-location` and `turf.js` integration for geospatial calculations.
* **📅 Personalized Agenda:** Save your favorite events and organize your cultural calendar.
* **📊 Administrative Dashboard:** Statistics analysis, user management, and full control over the event catalog.
* **📄 Report Generation:** Export travel plans and event details to PDF using `expo-print`.
* **🔐 Security:** Robust authentication with JWT and password encryption.

---

## 🛠️ Tech Stack

### Frontend (Mobile & Web)
* **Framework:** React Native / React 19
* **Language:** TypeScript
* **Styles:** Tailwind CSS (v4)
* **Navigation:** React Navigation (Stack & Tabs)
* **AI:** Google Gemini API (@google/genai)
* **Tools:** Axios, Expo SDK (Location, AV, Print, Sharing)

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB with Mongoose
* **Security:** JSON Web Tokens (JWT), Bcrypt.js

---

## 🚀 Installation and Setup

### Prerequisites
* Node.js (v18+)
* MongoDB (Local or Atlas)
* Google Gemini API Key

### 1. Clone the repository
```bash
git clone [https://github.com/Anghel01/festimap-ecuador.git](https://github.com/Anghel01/festimap-ecuador.git)
cd festimap-ecuador
```

### 2. Server Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder:
```env
PORT=8000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_super_secret_jwt
```
Start the server:
```bash
npm run dev
```

### 3. Client Setup
```bash
cd ..
npm install
```
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key
```
Start the application:
```bash
npm run dev
```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # Global state management (User, Agenda)
│   ├── navigation/     # Route configuration (Stack, Tabs)
│   ├── screens/        # Main screens (Home, AI, Admin, etc.)
│   └── config/         # API and services configurations
├── server/
│   ├── controllers/    # Business logic
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API endpoints definition
│   └── middlewares/    # Auth and error handling
└── types.ts            # TypeScript definitions
```

---

## 📸 Screenshots

WEB

![WhatsApp Image 2026-02-21 at 10 14 38](https://github.com/user-attachments/assets/33a9cf9f-2a01-49e5-9553-e83dd16b7bce)
![WhatsApp Image 2026-02-21 at 10 14 38 (4)](https://github.com/user-attachments/assets/51281ff1-6188-4666-a5ad-509451974dd0)

MOVIL

![WhatsApp Image 2026-02-21 at 10 14 38 (1)](https://github.com/user-attachments/assets/b0da0a77-83d3-437e-b9f8-e7379b0ef808)
![WhatsApp Image 2026-02-21 at 10 14 38 (2)](https://github.com/user-attachments/assets/a2dd29c6-2ff3-46a8-be34-531182831a5f)
![WhatsApp Image 2026-02-21 at 10 14 38 (3)](https://github.com/user-attachments/assets/40da31cc-9ad1-4f0c-afb8-6252640e140c)

---

## 👨‍💻 Author

**Angelo Israel Conterón Santillán**
* **LinkedIn:** https://www.linkedin.com/in/angelo-conteron/
* **GitHub:** [@Anghel01](https://github.com/Anghel01)

---

## 📄 License

This project is licensed under the ISC License. See the `package.json` file for details.
