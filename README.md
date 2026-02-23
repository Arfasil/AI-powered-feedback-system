# 🎓 EduPulse — AI-Powered Course Feedback Collection System

A full-stack course feedback system built with **Flask + React**, featuring:

- 🔐 JWT Authentication  
- 👥 3 Role-Based Dashboards (Student, Teacher, Admin)  
- 🤖 AI-Powered Feedback Analysis  
- 📊 Sentiment Analysis, Keyword Extraction, Performance Scoring & Trend Analysis  

---

## 🏗️ Project Architecture

```
feedback-system/
│
├── backend/                     # Flask + SQLAlchemy + AI Analysis
│   ├── app.py                   # Main Flask application
│   ├── feedback.db              # SQLite database (auto-created)
│   └── requirements.txt
│
├── frontend/                    # React (Create React App)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── context/AuthContext.js
│   │   ├── utils/api.js
│   │   ├── components/Layout.js
│   │   └── pages/
│   │       ├── LoginPage.js
│   │       ├── RegisterPage.js
│   │       ├── student/
│   │       ├── teacher/
│   │       └── admin/
│   └── package.json
│
├── start-backend.sh
└── README.md
```

---

## 🚀 Setup & Running

### 🔹 Backend (Flask)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate environment
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install flask flask-sqlalchemy flask-jwt-extended flask-cors flask-bcrypt \
textblob nltk scikit-learn numpy python-dotenv werkzeug

# Run server
python3 app.py
```

Backend runs at:  
👉 `http://localhost:5000`

---

### 🔹 Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm start

# Production build
npm run build
```

Frontend runs at:  
👉 `http://localhost:3000`

---

## 🔐 Demo Credentials

| Role     | Username      | Password     |
|----------|--------------|--------------|
| Admin    | admin        | admin123     |
| Teacher  | prof_smith   | teacher123   |
| Teacher  | prof_jones   | teacher123   |
| Student  | student1     | student123   |
| Student  | student2     | student123   |

---

## 🎯 Features by Role

### 👨‍🎓 Student
- Register/Login with JWT authentication  
- Browse and enroll in courses  
- Watch embedded course videos  
- Download/view course documents  
- Submit multi-type feedback  
- Toggle anonymous submission  

### 👨‍🏫 Teacher
- Create and manage courses  
- Upload videos and documents  
- Create custom feedback forms  
- View AI-powered analytics  
  - Sentiment analysis  
  - AI-generated summary  
  - Keyword extraction  
  - Performance score  
  - Improvement suggestions  

### ⚙️ Administrator
- Full user management (CRUD)  
- Course management with teacher assignment  
- System dashboard:
  - Total users  
  - Total courses  
  - Total feedback  
  - Global sentiment overview  
  - Top performing courses  

---

## 🤖 AI Features (Server-Side Only)

| Feature | Implementation |
|----------|---------------|
| Sentiment Analysis | Word-list based positive/negative scoring |
| Keyword Extraction | TF-style word frequency with stopword filtering |
| Auto Summary | Template-based NLP summary |
| Performance Score | 60% Ratings + 40% Sentiment |
| Improvement Suggestions | Rule-based keyword detection |
| Trend Analysis | Time-series rating tracking |

---

## 🗄️ Database Models

- users  
- courses  
- enrollments  
- course_materials  
- feedback_forms  
- feedback_questions  
- feedback_responses  
- feedback_answers  
- ai_analytics  

---

## 🛡️ Security

- Password hashing (SHA-256)  
- JWT authentication (HMAC-SHA256)  
- Role-based route protection  
- Token expiry (7 days)  
- Protected API endpoints  

---

## 🔌 API Endpoints

### 🔐 Authentication

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
```

### 📚 Courses

```
GET    /api/courses
POST   /api/courses
GET    /api/courses/:id
PUT    /api/courses/:id
DELETE /api/courses/:id
POST   /api/courses/:id/enroll
POST   /api/courses/:id/materials
```

### 📝 Feedback

```
POST   /api/courses/:id/forms
GET    /api/forms/:id
POST   /api/forms/:id/submit
```

### 📊 Analytics

```
GET    /api/courses/:id/analytics
GET    /api/teacher/analytics
GET    /api/admin/dashboard
GET    /api/trends/:teacherId
```

### ⚙️ Admin

```
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

---

## 🧠 Tech Stack

### Backend
- Flask  
- SQLAlchemy  
- Flask-JWT-Extended  
- SQLite  
- Scikit-learn  
- NLTK  

### Frontend
- React  
- React Router  
- Axios  

---

## 📈 Future Improvements

- Graph-based analytics dashboard  
- Advanced NLP model integration  
- Docker deployment  
- Cloud hosting  
- Notification system  

---
