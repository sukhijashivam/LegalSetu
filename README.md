# 🇮🇳 LegalSetu – India’s AI-Powered Multilingual Legal Assistant 🤖📚⚖️

**LegalSetu** is a groundbreaking AI platform crafted for the unique needs of the Indian legal landscape. It empowers citizens to navigate laws, analyze legal documents, explore the Constitution, find nearby lawyers, chat with advocates, and fill legal forms — all in **their preferred Indian language**, via **voice or text**.

This is not just a tool — it’s a **mission to make legal help accessible, understandable, and inclusive for every Indian**, from metro cities to remote villages.

---

## 🌟 Why LegalSetu?

- 🇮🇳 **Made for Indian Law & Citizens**
- 🌐 **Multilingual Everything**: Interface, chat, voice, input, and output — all in **10+ Indian languages**
- 🗣️ **Ask in your voice, get answers in your language**
- ⚡ **Powered by AI** for instant results and smart analysis
- 👨‍⚖️ **Real Lawyers, Real Chat** via **Advotalk**

---

## 🚀 Key Features – Explained with Use Cases

---

### 🧠 Neeti

> Your personal lawyer in your pocket — available in your own language.

**How it works**:
- Open the chat interface  
- 🗣️ Ask any legal doubt via **text or voice**, in your **regional language**  
- 🤖 AI instantly replies with simple, localized explanations

---

### 📄 Document Analyzer + Smart Chat

> Understand any legal document — even if it’s complex or not in your language.

**How it works**:
- 📤 Upload a document (PDF, image, etc.)  
- 💬 Chat with it clause by clause  
- 🔍 Get multilingual explanations and legal context

---

### 📜 Constitution Explorer

> Explore the Indian Constitution like never before — smart, searchable, and regionalized.

**How it works**:
- 🔎 Search by keyword  
- 📘 Get relevant Articles  
- 📖 Understand them in your own language  

---

### 📝 Smart AI Form Filler (Form-Filling)

> Filling complex government forms? Let AI handle it — with your guidance, in your language.

**How it works**:
- 📤 Upload form  
- 🤖 AI asks simple multilingual questions  
- 📝 You answer via text or voice  
- 📥 Get a fully filled PDF  

---

### 📍 Advocate – Find Nearby Lawyers *(New)*

> Looking for real legal assistance near you? Let LegalSetu connect you.

**How it works**:
- 📌 Uses your location to show verified advocates within a 5km radius  
- 📇 Displays details like name, experience, rating, contact number, and distance  
- 📈 Sort by relevance, distance, rating, or experience  
- 🗺️ Direct link to Maps for real-time navigation  
- ☎️ One-tap call to connect

**Built with**: Google Maps API + Firebase + Custom Logic

---

### 🧑‍⚖️ Advotalk – Live Chat with Verified Advocates *(New)*

> Real-time legal advice, directly from qualified professionals.

**How it works**:
- 🔐 Advocates register and verify their profile
- 📂 Users browse detailed advocate profiles
- 💬 Initiate a live consultation directly from the app
- 🔁 Chat with advocates in real-time using Socket.IO

**Tech Stack**:
- Frontend: React + Firebase Auth + Voice & Translation Context  
- Backend: Node.js + Express + Socket.IO + MySQL + AWS S3  
- Auth: JWT (for Advocates), Firebase (for Users)  
- Real-time: Secure WebSocket connections with room-based architecture

---

## 🌐 Languages Supported

LegalSetu works entirely in:

- 🇬🇧 English  
- 🇮🇳 हिंदी (Hindi)  
- 📿 বাংলা (Bengali)  
- 🎶 తెలుగు (Telugu)  
- 🛕 தமிழ் (Tamil)  
- 🎨 मराठी (Marathi)  
- 🥻 ગુજરાતી (Gujarati)  
- 🥁 ಕನ್ನಡ (Kannada)  
- 🌺 മലയാളം (Malayalam)  
- 🌀 ଓଡ଼ିଆ (Odia)  
- 🏔️ ਪੰਜਾਬੀ (Punjabi)  
- 🌾 অসমীয়া (Assamese)  
- 🕌 اُردُو‎ (Urdu)  

✅ Regional Language UI  
✅ Regional Language Chat  
✅ Voice Input & Output in all supported languages  
✅ No need to switch to English at any step!

---

## 🔐 Security & Authentication

- Firebase Authentication (Email & Google Sign-In)  
- JWT for Advocate sessions  
- Secure sessions and database isolation  
- Encrypted file handling  
- AWS S3 for profile/doc storage

---

## 🛠️ Technology Stack

### Frontend
| Layer        | Tech Used |
|--------------|-----------|
| 💻 Frontend  | Vite + React, Tailwind CSS, Framer Motion |
| 🔐 Auth      | Firebase Auth (Email & Google Sign-In) |
| 🌍 Maps      | Google Maps API |
| 🎨 UI/UX     | Tailwind CSS + Framer Motion Animations |

### Backend
| Layer        | Tech Used |
|--------------|-----------|
| 🖥 Backend Framework | Node.js + Express |
| ☁️ Storage   | AWS S3 + MySQL (mysql2) |
| 🧠 AI Models | Google Generative AI (Gemini) + Google Translate |
| 🗣️ Voice     | Google Cloud Text-to-Speech & Speech-to-Text |
| 🔌 Real-time | Socket.IO for advocate chat |


---

## 💼 Real-Life Use Cases

| Persona          | Use Case Description |
|------------------|----------------------|
| 👨‍🌾 *Rural Citizen* | Speak in Bhojpuri to get legal advice on property disputes |
| 👩‍💼 *Tenant*        | Upload rent agreement → chat in Hindi → understand every clause |
| 👩‍🎓 *Student*       | Ask in Marathi: "What are my fundamental rights?" → Constitution Explorer finds it |
| 🧓 *Senior Citizen* | Use voice to fill pension form in Kannada → download prefilled form |
| 👩‍🦰 *Working Woman* | Get legal protection info against workplace harassment in regional language |
| 👨‍⚖️ *Law Seeker*     | Use the “Advocate” feature to locate nearby legal help instantly |
| 🗣️ *Real-Time Talker* | Chat directly with a live advocate using voice + multilingual text |

---

## 🔮 What’s Coming Soon

- 🧾 Audio summaries for long documents  
- 📞 Voice call with Advocates  
- 📱 Android/iOS App  
- 📢 WhatsApp chatbot  
- 🗣️ Expansion to **20+ Indian languages**

---

> ⚖️ **LegalSetu is not just software — it’s a legal revolution for Bharat.**  
> Now, legal help doesn’t need to be confusing, English-only, or lawyer-dependent.  
> It's just a few taps and one voice away — in your language.  
> From AI chat to real advocate support — we’ve got you covered.
