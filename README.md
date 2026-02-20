# AI-Powered Course Feedback Collection System

Full-stack project for collecting course feedback, managing courses/users, and viewing analytics.

## Tech Stack
- Backend: Flask + SQLite
- Frontend: React
- Database: SQLite (`backend/feedback.db`)

## Project Structure
```text
.
├─ backend/
│  ├─ app.py
│  ├─ requirements.txt
│  ├─ feedback.db
│  ├─ view_database.py
│  ├─ list_users.py
│  ├─ restore_admin.py
│  └─ activate_admin.py
└─ frontend/
   ├─ package.json
   └─ src/
```

## Prerequisites
- Python 3.10+
- Node.js 18+ and npm

## Backend Setup
From project root:

```powershell
cd backend
python -m venv env
.\env\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs on: `http://localhost:5000`

Notes:
- On first run, `app.py` initializes and seeds `feedback.db`.
- If your venv already exists, only run:

```powershell
cd backend
.\env\Scripts\activate
python app.py
```

## Frontend Setup
Open a new terminal from project root:

```powershell
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

`frontend/package.json` includes:
- `"proxy": "http://localhost:5000"`

## Default Seed Credentials
- Admin: `admin` / `admin123`
- Teacher: `prof_smith` / `teacher123`
- Student: `student1` / `student123`

If admin is missing/inactive:

```powershell
cd backend
python restore_admin.py
python activate_admin.py
```

## View Database Values
Use the inspection script:

```powershell
cd backend
python view_database.py
```

Useful options:

```powershell
python view_database.py --table users
python view_database.py --limit 5
python view_database.py --table feedback_answers --limit 50
```

## Common Dev Commands
- Backend start: `python backend\app.py`
- Frontend start: `npm --prefix frontend start`
- Frontend test: `npm --prefix frontend test`
- Frontend build: `npm --prefix frontend run build`

