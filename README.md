# 🎓 AttendAI — AI-Based Attendance Management System

Full-stack MERN app with Face Recognition, QR Code, and GPS attendance.

---

## 📁 Folder Structure

```
AI BASED/
├── client/          # React + Vite + Tailwind frontend
├── server/          # Node.js + Express backend
└── package.json     # Root convenience scripts
```

---

## ⚙️ Setup Instructions

### 1. Configure MongoDB Atlas

Edit `server/.env` and replace with your actual credentials:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lbattend?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

### 2. Install Dependencies

```bash
# From root
cd server && npm install
cd ../client && npm install
```

### 3. Run the Project

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

---

## 🔑 Default Roles

Register an account and select your role:
- **Admin** — Manage users, view all sessions & attendance
- **Faculty** — Create sessions, generate QR codes, view attendance
- **Student** — Mark attendance via QR, Face ID, or GPS

---

## 🚀 Features

| Feature | Details |
|---|---|
| Auth | JWT login/register, role-based access |
| QR Attendance | Dynamic QR per session, scanned by student |
| Face Recognition | face-api.js with TinyFaceDetector |
| GPS Verification | Browser geolocation + radius check |
| Admin Dashboard | User CRUD, charts, all records |
| Faculty Dashboard | Create sessions, view per-session attendance |
| Student Dashboard | Mark attendance, analytics charts |

---

## 🌐 API Endpoints

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/profile` | All |
| PUT | `/api/auth/face-descriptor` | Student |
| GET | `/api/sessions` | All |
| POST | `/api/sessions` | Faculty/Admin |
| PUT | `/api/sessions/:id/close` | Faculty/Admin |
| GET | `/api/sessions/:id/attendance` | Faculty/Admin |
| POST | `/api/attendance/mark` | Student |
| GET | `/api/attendance/my` | Student |
| GET | `/api/attendance/stats` | All |
| GET | `/api/attendance/all` | Admin/Faculty |
| GET | `/api/users` | Admin |
| PUT | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, face-api.js, html5-qrcode, qrcode.react
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, qrcode, uuid
- **Database:** MongoDB Atlas (`lbattend`)
