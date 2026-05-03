# Attendance Management System

A full-stack MERN application with **Face Recognition**, **GPS Verification**, and **QR Code** attendance marking — built for real-world classroom use.

---

## Features

| Feature | Description |
|---|---|
| 🎭 Face Recognition | face-api.js biometric verification on every attendance mark |
| 📍 GPS Verification | Haversine formula, 100 m classroom radius check |
| 🔲 QR Code | Cryptographically signed, auto-expires every 60 seconds |
| 👨‍💼 Role-based Access | Admin · Faculty · Student with JWT authentication |
| 📊 Analytics Dashboard | Attendance %, below-75% alerts, bar & pie charts |
| 📁 CSV Student Upload | Bulk-add students via CSV; credentials auto-generated |
| 📋 Attendance Requests | Students submit requests; faculty/admin approve or reject |
| ☁️ MongoDB Atlas Ready | Works with local MongoDB or Atlas cloud cluster |

---

## Tech Stack

**Frontend**
- React 18 (Vite)
- Tailwind CSS
- Axios
- face-api.js
- Recharts
- react-hot-toast

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- multer + csv-parser
- qrcode

**Database**
- MongoDB (local) or MongoDB Atlas (cloud)

---

## Project Structure

```
├── client/                 # React Vite frontend
│   └── src/
│       ├── api/            # Axios instance
│       ├── components/     # Layout, FaceCapture, QRScanner, etc.
│       ├── context/        # AuthContext
│       └── pages/
│           ├── admin/      # Dashboard, Students, Faculty, Sessions, Analytics
│           ├── faculty/    # Dashboard, Analytics
│           └── student/    # Dashboard, MarkAttendance, History, Requests
│
└── server/                 # Express backend
    └── src/
        ├── controllers/    # auth, admin, faculty, attendance, session, face
        ├── middleware/     # JWT auth, multer upload
        ├── models/         # User, Session, Attendance, AttendanceRequest
        ├── routes/         # All API routes
        └── utils/          # GPS (Haversine), admin seeder
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas cluster

---

## Setup & Run

### 1. Clone the repository

```bash
git clone https://github.com/Arth0504/attendance-system.git
cd attendance-system
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000

# Local MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/attendance_db

# OR MongoDB Atlas
# MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/attendance_db?retryWrites=true&w=majority

JWT_SECRET=your_long_random_secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=Admin@123
QR_SECRET=your_qr_secret
```

### 3. Install dependencies & start backend

```bash
# inside server/
npm install
npm run dev
```

Server starts on **http://localhost:5000**

### 4. Install dependencies & start frontend

```bash
cd ../client
npm install
npm run dev
```

Frontend starts on **http://localhost:5173**

---

## Default Login

| Role | Identifier | Password |
|---|---|---|
| Admin | `admin@attendance.com` | `Admin@123` |
| Student | Roll No (e.g. `CS001`) | Roll No (e.g. `CS001`) |
| Faculty | Email set by admin | Password set by admin |

> Admin credentials are seeded automatically on first server start from `.env`.

---

## CSV Format for Student Upload

```csv
name,email,rollNo
John Doe,john@example.com,CS001
Jane Smith,jane@example.com,CS002
```

Each student's username and initial password are set to their `rollNo`.

---

## Attendance Flow (Student)

1. **Scan QR** — faculty generates a 60-second QR code for the session
2. **GPS Check** — student must be within 100 m of the classroom
3. **Face Verify** — biometric match against registered face descriptor
4. **Submit** — all three checks must pass to mark Present

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login (all roles) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/face/register` | Register face descriptor |
| POST | `/api/face/verify` | Verify face during attendance |
| POST | `/api/admin/upload-students` | Bulk CSV student upload |
| POST | `/api/sessions` | Create session (faculty/admin) |
| POST | `/api/sessions/:id/qr` | Generate QR for session |
| POST | `/api/attendance/mark` | Mark attendance |
| GET | `/api/admin/analytics` | Full analytics |
| GET | `/health` | Server health check |

---

## Deployment

### Backend → Render

1. Push to GitHub
2. New Web Service → Root Dir: `server`
3. Build: `npm install` · Start: `npm start`
4. Add all env vars from `.env` in the Render dashboard
5. Set `ALLOWED_ORIGINS` to your frontend URL

### Frontend → Vercel

1. New Project → Root Dir: `client`
2. Add env var: `VITE_API_URL=https://your-render-app.onrender.com`
3. Deploy — Vercel auto-detects Vite

---

## License

MIT
