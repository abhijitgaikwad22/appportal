# 🌐 AppPortal

A full-stack **Application Management Portal** built with Node.js and a Glassmorphism UI — featuring secure authentication, multi-step forms, document upload, and payment processing.

🔗 **Live Demo:** [https://appportal.onrender.com](https://appportal.onrender.com)

---

## ✨ Features

- 🔐 **Secure Authentication** — Register & login with SHA-256 password hashing and UUID session tokens
- 👤 **Personal Information Form** — Identity, contact, and address details
- 🎓 **Education Details Form** — Academic qualifications and institutional background
- 📄 **Document Upload** — Upload passport photo, ID proof, marksheets (tracked client-side)
- 💳 **Payment Processing** — Credit/Debit Card, UPI, and Net Banking support with transaction ID generation
- 📊 **Live Dashboard** — Real-time stats showing registered users, forms submitted, and payments
- 🎨 **Glassmorphism UI** — Modern dark theme with animated background, blur effects, and smooth transitions
- 📱 **Fully Responsive** — Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Glassmorphism), Vanilla JavaScript |
| **Backend** | Node.js 22+ using only built-in `http` module |
| **Auth** | SHA-256 password hashing + UUID session tokens |
| **Storage** | JSON file persistence (`data/*.json`) |
| **Fonts** | Syne + DM Sans via Google Fonts |
| **Deployment** | Render (free hosting) |

> Zero external dependencies — no npm packages required!

---

## 📁 Project Structure

```
appportal/
├── server.js              ← Node.js backend server
├── package.json           ← Project config
├── data/                  ← Auto-created JSON storage
│   ├── users.json
│   ├── personal.json
│   ├── education.json
│   └── payments.json
└── web/
    ├── index.html         ← Landing page
    ├── css/
    │   └── style.css      ← Global Glassmorphism styles
    ├── js/
    │   └── api.js         ← Shared auth, fetch, toast helpers
    └── pages/
        ├── login.html     ← Register / Sign In
        ├── dashboard.html ← Application overview
        ├── personal.html  ← Step 1: Personal Info
        ├── education.html ← Step 2: Education Details
        ├── documents.html ← Step 3: Document Upload
        └── payment.html   ← Step 4: Payment
```

---

## 🚀 Run Locally

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/abhijitgaikwad22/appportal.git

# 2. Navigate into the folder
cd appportal

# 3. Start the server
node server.js

# 4. Open in browser
# http://localhost:8080
```

No `npm install` needed — zero external dependencies!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Live stats (users, forms, payments) |
| `POST` | `/api/auth/register` | Create account, returns session token |
| `POST` | `/api/auth/login` | Authenticate, returns session token |
| `GET` | `/api/personal` | Fetch saved personal info |
| `POST` | `/api/personal` | Save personal info |
| `GET` | `/api/education` | Fetch saved education details |
| `POST` | `/api/education` | Save education details |
| `POST` | `/api/payment` | Process payment, returns Transaction ID |

---

## 📸 Screenshots

### 🏠 Landing Page
> Glassmorphism hero with live stats and animated background

### 📋 Dashboard
> 4-step progress tracker with real-time completion status

### 💳 Payment Page
> Dynamic payment method switching (Card / UPI / Net Banking)

---

## 🔒 Security Features

- SHA-256 password hashing (passwords never stored in plain text)
- Path traversal attack prevention on static file serving
- CORS headers on all API responses
- Card details never sent to the server (client-side only)
- Request timeout to prevent slow-client attacks
- Input validation on all API endpoints

---

## 📝 Application Flow

```
Register / Login
      ↓
  Dashboard
      ↓
Step 1 → Personal Information
      ↓
Step 2 → Education Details
      ↓
Step 3 → Document Upload
      ↓
Step 4 → Payment → 🎉 Success!
```

---

## 🌍 Deployment

This app is deployed on **Render** (free tier).

To deploy your own instance:
1. Fork this repository
2. Go to [https://render.com](https://render.com)
3. Create a new **Web Service** from your fork
4. Set **Start Command** to `node server.js`
5. Deploy! ✅

---

## 👨‍💻 Author

**Abhijit Gaikwad**
- GitHub: [@abhijitgaikwad22](https://github.com/abhijitgaikwad22)
- Live App: [https://appportal.onrender.com](https://appportal.onrender.com)

---

## ⭐ Show Your Support

If you found this project helpful, please give it a **⭐ star** on GitHub!

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
