"""
AI-Powered Course Feedback Collection System - Flask Backend
"""
import os
import json
import math
import re
import sqlite3
import hashlib
import hmac
import base64
import time
import uuid
from datetime import datetime, timedelta
from functools import wraps
from collections import Counter

from flask import Flask, request, jsonify, g
from flask.json.provider import DefaultJSONProvider

# ─── App Setup ───────────────────────────────────────────────────────────────

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'feedback.db')

# Allow CORS manually (no flask-cors available)
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        from flask import Response
        r = Response()
        r.headers['Access-Control-Allow-Origin'] = '*'
        r.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        r.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return r

# ─── Database ─────────────────────────────────────────────────────────────────

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = sqlite3.connect(app.config['DATABASE'])
    db.row_factory = sqlite3.Row
    cursor = db.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            full_name TEXT,
            department TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            code TEXT UNIQUE NOT NULL,
            teacher_id TEXT,
            semester TEXT,
            year INTEGER,
            department TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (teacher_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS enrollments (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, course_id),
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );

        CREATE TABLE IF NOT EXISTS course_materials (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            url TEXT,
            file_data TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );

        CREATE TABLE IF NOT EXISTS feedback_forms (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            is_anonymous INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deadline TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );

        CREATE TABLE IF NOT EXISTS feedback_questions (
            id TEXT PRIMARY KEY,
            form_id TEXT NOT NULL,
            question_text TEXT NOT NULL,
            question_type TEXT NOT NULL,
            options TEXT,
            is_required INTEGER DEFAULT 1,
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY (form_id) REFERENCES feedback_forms(id)
        );

        CREATE TABLE IF NOT EXISTS feedback_responses (
            id TEXT PRIMARY KEY,
            form_id TEXT NOT NULL,
            student_id TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_anonymous INTEGER DEFAULT 0,
            FOREIGN KEY (form_id) REFERENCES feedback_forms(id)
        );

        CREATE TABLE IF NOT EXISTS feedback_answers (
            id TEXT PRIMARY KEY,
            response_id TEXT NOT NULL,
            question_id TEXT NOT NULL,
            answer_text TEXT,
            answer_value REAL,
            FOREIGN KEY (response_id) REFERENCES feedback_responses(id),
            FOREIGN KEY (question_id) REFERENCES feedback_questions(id)
        );

        CREATE TABLE IF NOT EXISTS ai_analytics (
            id TEXT PRIMARY KEY,
            course_id TEXT,
            teacher_id TEXT,
            analysis_type TEXT NOT NULL,
            result_data TEXT NOT NULL,
            analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            semester TEXT,
            year INTEGER
        );
    ''')
    db.commit()

    # Seed initial data
    _seed_data(db)
    db.close()

def _seed_data(db):
    cursor = db.cursor()
    
    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        return

    users = [
        (str(uuid.uuid4()), 'admin', 'admin@university.edu', _hash_pw('admin123'), 'admin', 'System Administrator', 'Administration'),
        (str(uuid.uuid4()), 'prof_smith', 'smith@university.edu', _hash_pw('teacher123'), 'teacher', 'Dr. John Smith', 'Computer Science'),
        (str(uuid.uuid4()), 'prof_jones', 'jones@university.edu', _hash_pw('teacher123'), 'teacher', 'Prof. Sarah Jones', 'Mathematics'),
        (str(uuid.uuid4()), 'student1', 'alice@student.edu', _hash_pw('student123'), 'student', 'Alice Johnson', 'Computer Science'),
        (str(uuid.uuid4()), 'student2', 'bob@student.edu', _hash_pw('student123'), 'student', 'Bob Williams', 'Computer Science'),
    ]
    
    cursor.executemany(
        "INSERT INTO users (id, username, email, password_hash, role, full_name, department) VALUES (?,?,?,?,?,?,?)",
        users
    )
    db.commit()
    
    # Get user IDs
    cursor.execute("SELECT id, username FROM users")
    user_map = {row['username']: row['id'] for row in cursor.fetchall()}
    
    courses = [
        (str(uuid.uuid4()), 'Introduction to Machine Learning', 'Learn ML fundamentals', 'CS501', user_map['prof_smith'], 'Fall', 2024, 'Computer Science'),
        (str(uuid.uuid4()), 'Data Structures & Algorithms', 'Advanced DS concepts', 'CS302', user_map['prof_smith'], 'Fall', 2024, 'Computer Science'),
        (str(uuid.uuid4()), 'Calculus III', 'Multivariable calculus', 'MATH301', user_map['prof_jones'], 'Fall', 2024, 'Mathematics'),
    ]
    
    cursor.executemany(
        "INSERT INTO courses (id, title, description, code, teacher_id, semester, year, department) VALUES (?,?,?,?,?,?,?,?)",
        courses
    )
    db.commit()
    
    # Get course IDs
    cursor.execute("SELECT id, code FROM courses")
    course_map = {row['code']: row['id'] for row in cursor.fetchall()}
    
    # Enroll students
    enrollments = [
        (str(uuid.uuid4()), user_map['student1'], course_map['CS501']),
        (str(uuid.uuid4()), user_map['student1'], course_map['CS302']),
        (str(uuid.uuid4()), user_map['student2'], course_map['CS501']),
        (str(uuid.uuid4()), user_map['student2'], course_map['MATH301']),
    ]
    cursor.executemany("INSERT INTO enrollments (id, student_id, course_id) VALUES (?,?,?)", enrollments)
    
    # Sample materials
    materials = [
        (str(uuid.uuid4()), course_map['CS501'], 'Introduction to ML - Lecture 1', 'video', 'https://www.youtube.com/embed/ukzFI9rgwfU', None, 'Overview of machine learning concepts'),
        (str(uuid.uuid4()), course_map['CS501'], 'ML Fundamentals PDF', 'document', None, None, 'Core ML concepts document'),
        (str(uuid.uuid4()), course_map['CS302'], 'Data Structures Overview', 'video', 'https://www.youtube.com/embed/RBSGKlAvoiM', None, 'Introduction to data structures'),
    ]
    cursor.executemany("INSERT INTO course_materials (id, course_id, title, type, url, file_data, description) VALUES (?,?,?,?,?,?,?)", materials)
    
    # Sample feedback form
    form_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO feedback_forms (id, course_id, title, description, is_anonymous, created_by) VALUES (?,?,?,?,?,?)",
        (form_id, course_map['CS501'], 'Mid-Semester Feedback', 'Please share your experience with this course', 0, user_map['prof_smith'])
    )
    
    questions = [
        (str(uuid.uuid4()), form_id, 'How would you rate the overall course quality?', 'rating', None, 1, 0),
        (str(uuid.uuid4()), form_id, 'How engaging are the lectures?', 'scale', json.dumps({'min': 1, 'max': 10, 'labels': ['Not engaging', 'Very engaging']}), 1, 1),
        (str(uuid.uuid4()), form_id, 'Is the course material well-organized?', 'yes_no', None, 1, 2),
        (str(uuid.uuid4()), form_id, 'What is the most valuable aspect of this course?', 'multiple_choice', json.dumps(['Practical assignments', 'Theoretical knowledge', 'Teaching style', 'Course materials']), 0, 3),
        (str(uuid.uuid4()), form_id, 'Please provide any additional comments or suggestions:', 'text', None, 0, 4),
    ]
    cursor.executemany("INSERT INTO feedback_questions (id, form_id, question_text, question_type, options, is_required, order_index) VALUES (?,?,?,?,?,?,?)", questions)
    
    # Sample feedback responses with text for AI analysis
    sample_texts = [
        "The course is excellent! Professor Smith explains concepts very clearly and the assignments are challenging but fair.",
        "Good course overall but sometimes the pace is too fast. More examples would be helpful.",
        "The teaching is okay but I think the course could benefit from more practical examples.",
        "Absolutely love this course! The professor is amazing and very helpful during office hours.",
        "The course material is outdated. Needs more modern examples and better organization.",
    ]
    
    for i, text in enumerate(sample_texts):
        resp_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO feedback_responses (id, form_id, student_id, is_anonymous) VALUES (?,?,?,?)",
            (resp_id, form_id, user_map['student1'] if i % 2 == 0 else user_map['student2'], i % 2)
        )
        # Add text answer
        q_text_id = questions[4][0]
        cursor.execute(
            "INSERT INTO feedback_answers (id, response_id, question_id, answer_text) VALUES (?,?,?,?)",
            (str(uuid.uuid4()), resp_id, q_text_id, text)
        )
        # Add rating
        q_rating_id = questions[0][0]
        cursor.execute(
            "INSERT INTO feedback_answers (id, response_id, question_id, answer_value) VALUES (?,?,?,?)",
            (str(uuid.uuid4()), resp_id, q_rating_id, [5, 3, 3, 5, 2][i])
        )
    
    db.commit()

def _hash_pw(password):
    return hashlib.sha256(password.encode()).hexdigest()

def _check_pw(password, hashed):
    return hashlib.sha256(password.encode()).hexdigest() == hashed

# ─── JWT ──────────────────────────────────────────────────────────────────────

def _b64url_encode(data):
    if isinstance(data, str):
        data = data.encode()
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def _b64url_decode(data):
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

def create_token(user_id, role, username):
    header = _b64url_encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}))
    payload = _b64url_encode(json.dumps({
        'sub': user_id,
        'role': role,
        'username': username,
        'exp': int(time.time()) + 86400 * 7  # 7 days
    }))
    signature = hmac.new(
        app.config['SECRET_KEY'].encode(),
        f"{header}.{payload}".encode(),
        hashlib.sha256
    ).digest()
    return f"{header}.{payload}.{_b64url_encode(signature)}"

def verify_token(token):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        expected_sig = hmac.new(
            app.config['SECRET_KEY'].encode(),
            f"{header}.{payload}".encode(),
            hashlib.sha256
        ).digest()
        if not hmac.compare_digest(_b64url_decode(sig), expected_sig):
            return None
        data = json.loads(_b64url_decode(payload))
        if data.get('exp', 0) < time.time():
            return None
        return data
    except Exception:
        return None

def require_auth(roles=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth = request.headers.get('Authorization', '')
            if not auth.startswith('Bearer '):
                return jsonify({'error': 'Unauthorized'}), 401
            data = verify_token(auth[7:])
            if not data:
                return jsonify({'error': 'Invalid token'}), 401
            if roles and data.get('role') not in roles:
                return jsonify({'error': 'Forbidden'}), 403
            g.user_id = data['sub']
            g.role = data['role']
            g.username = data['username']
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ─── AI Analysis ─────────────────────────────────────────────────────────────

# Simple sentiment analysis using word lists (no external libraries needed)
POSITIVE_WORDS = set([
    'excellent', 'amazing', 'great', 'good', 'outstanding', 'wonderful', 'fantastic',
    'helpful', 'clear', 'engaging', 'interesting', 'love', 'enjoy', 'best', 'perfect',
    'awesome', 'brilliant', 'superb', 'exceptional', 'valuable', 'effective', 'well',
    'easy', 'understand', 'helpful', 'organized', 'informative', 'inspiring', 'motivating'
])

NEGATIVE_WORDS = set([
    'bad', 'poor', 'terrible', 'boring', 'confusing', 'difficult', 'hard', 'slow',
    'outdated', 'unclear', 'disorganized', 'disappointing', 'frustrating', 'waste',
    'worst', 'awful', 'useless', 'irrelevant', 'incomplete', 'missing', 'lack',
    'improvement', 'needs', 'better', 'problem', 'issue', 'fail', 'weak', 'inadequate'
])

def analyze_sentiment(text):
    if not text:
        return {'label': 'neutral', 'score': 0.0, 'confidence': 0.5}
    
    words = re.findall(r'\b\w+\b', text.lower())
    pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)
    total = len(words) or 1
    
    pos_ratio = pos_count / total
    neg_ratio = neg_count / total
    
    score = pos_ratio - neg_ratio
    
    if score > 0.05:
        label = 'positive'
        confidence = min(0.5 + score * 5, 0.99)
    elif score < -0.05:
        label = 'negative'
        confidence = min(0.5 + abs(score) * 5, 0.99)
    else:
        label = 'neutral'
        confidence = 0.6
    
    return {'label': label, 'score': round(score, 3), 'confidence': round(confidence, 3)}

def extract_keywords(texts, top_n=10):
    if not texts:
        return []
    
    STOPWORDS = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                     'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
                     'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                     'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
                     'these', 'those', 'it', 'its', 'very', 'quite', 'more', 'also', 'i',
                     'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'their'])
    
    all_words = []
    for text in texts:
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        all_words.extend([w for w in words if w not in STOPWORDS])
    
    counter = Counter(all_words)
    return [{'keyword': w, 'count': c} for w, c in counter.most_common(top_n)]

def generate_summary(texts, sentiments):
    if not texts:
        return "No feedback available for analysis."
    
    total = len(texts)
    pos = sum(1 for s in sentiments if s['label'] == 'positive')
    neg = sum(1 for s in sentiments if s['label'] == 'negative')
    neutral = total - pos - neg
    
    pos_pct = round(pos/total*100)
    neg_pct = round(neg/total*100)
    
    keywords = extract_keywords(texts, 5)
    kw_str = ', '.join([k['keyword'] for k in keywords[:5]]) if keywords else 'general feedback'
    
    if pos_pct >= 60:
        overall = "predominantly positive"
    elif neg_pct >= 40:
        overall = "showing areas for improvement"
    else:
        overall = "mixed"
    
    summary = (
        f"Based on {total} feedback submission(s), student sentiment is {overall}. "
        f"{pos_pct}% positive, {neg_pct}% negative, {100-pos_pct-neg_pct}% neutral. "
        f"Key themes include: {kw_str}. "
    )
    
    if neg_pct >= 30:
        summary += "Students have expressed concerns that warrant attention. "
    if pos_pct >= 70:
        summary += "The course is highly appreciated by students. "
    
    return summary

def calculate_performance_score(ratings, sentiments):
    if not ratings and not sentiments:
        return 0.0
    
    rating_score = 0.0
    if ratings:
        avg_rating = sum(ratings) / len(ratings)
        rating_score = (avg_rating / 5.0) * 100
    
    sentiment_score = 0.0
    if sentiments:
        pos = sum(1 for s in sentiments if s['label'] == 'positive')
        neg = sum(1 for s in sentiments if s['label'] == 'negative')
        total = len(sentiments)
        sentiment_score = ((pos - neg * 0.5) / total) * 100
        sentiment_score = max(0, min(100, sentiment_score + 50))
    
    if ratings and sentiments:
        final = rating_score * 0.6 + sentiment_score * 0.4
    elif ratings:
        final = rating_score
    else:
        final = sentiment_score
    
    return round(final, 1)

def generate_suggestions(keywords, sentiments, avg_rating):
    suggestions = []
    neg_keywords = {'confusing', 'slow', 'outdated', 'unclear', 'disorganized', 'boring', 'difficult'}
    
    found_neg_kw = [k['keyword'] for k in keywords if k['keyword'] in neg_keywords]
    
    neg_ratio = sum(1 for s in sentiments if s['label'] == 'negative') / max(len(sentiments), 1)
    
    if avg_rating < 3.0 or neg_ratio > 0.4:
        suggestions.append({
            'priority': 'high',
            'category': 'Overall Quality',
            'suggestion': 'Consider conducting a comprehensive course review and gathering more detailed feedback through office hours.'
        })
    
    if 'confusing' in found_neg_kw or 'unclear' in found_neg_kw:
        suggestions.append({
            'priority': 'high',
            'category': 'Content Clarity',
            'suggestion': 'Restructure complex topics with clearer explanations, more examples, and visual aids.'
        })
    
    if 'slow' in found_neg_kw:
        suggestions.append({
            'priority': 'medium',
            'category': 'Course Pace',
            'suggestion': 'Review the course pacing. Consider adding checkpoint quizzes to ensure student understanding before advancing.'
        })
    
    if 'outdated' in found_neg_kw:
        suggestions.append({
            'priority': 'medium',
            'category': 'Content Currency',
            'suggestion': 'Update course materials with current industry examples and recent research findings.'
        })
    
    if 'boring' in found_neg_kw:
        suggestions.append({
            'priority': 'medium',
            'category': 'Engagement',
            'suggestion': 'Incorporate more interactive elements: case studies, group discussions, and real-world projects.'
        })
    
    if avg_rating >= 4.0 and neg_ratio < 0.2:
        suggestions.append({
            'priority': 'low',
            'category': 'Excellence Maintenance',
            'suggestion': 'Continue the current teaching approach. Consider documenting best practices to share with colleagues.'
        })
    
    if not suggestions:
        suggestions.append({
            'priority': 'low',
            'category': 'General Improvement',
            'suggestion': 'Continue gathering feedback regularly and maintain communication channels with students.'
        })
    
    return suggestions

# ─── Routes: Auth ─────────────────────────────────────────────────────────────

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE username=? AND is_active=1", (username,)
    ).fetchone()
    
    if not user or not _check_pw(password, user['password_hash']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = create_token(user['id'], user['role'], user['username'])
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'full_name': user['full_name'],
            'department': user['department']
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    required = ['username', 'email', 'password', 'full_name']
    if not all(data.get(f) for f in required):
        return jsonify({'error': 'All fields required'}), 400
    
    db = get_db()
    existing = db.execute(
        "SELECT id FROM users WHERE username=? OR email=?",
        (data['username'], data['email'])
    ).fetchone()
    
    if existing:
        return jsonify({'error': 'Username or email already exists'}), 409
    
    user_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO users (id, username, email, password_hash, role, full_name, department) VALUES (?,?,?,?,?,?,?)",
        (user_id, data['username'], data['email'], _hash_pw(data['password']),
         'student', data['full_name'], data.get('department', ''))
    )
    db.commit()
    
    token = create_token(user_id, 'student', data['username'])
    return jsonify({
        'token': token,
        'user': {
            'id': user_id,
            'username': data['username'],
            'email': data['email'],
            'role': 'student',
            'full_name': data['full_name']
        }
    }), 201

@app.route('/api/auth/me', methods=['GET'])
@require_auth()
def get_me():
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id=?", (g.user_id,)).fetchone()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
        'full_name': user['full_name'],
        'department': user['department']
    })

# ─── Routes: Courses ──────────────────────────────────────────────────────────

@app.route('/api/courses', methods=['GET'])
@require_auth()
def get_courses():
    db = get_db()
    if g.role == 'student':
        courses = db.execute('''
            SELECT c.*, u.full_name as teacher_name,
                   (SELECT COUNT(*) FROM enrollments WHERE course_id=c.id) as enrolled_count,
                   (SELECT COUNT(*) FROM enrollments WHERE course_id=c.id AND student_id=?) as is_enrolled
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.is_active=1
            ORDER BY c.created_at DESC
        ''', (g.user_id,)).fetchall()
    elif g.role == 'teacher':
        courses = db.execute('''
            SELECT c.*, u.full_name as teacher_name,
                   (SELECT COUNT(*) FROM enrollments WHERE course_id=c.id) as enrolled_count,
                   0 as is_enrolled
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.teacher_id=? AND c.is_active=1
            ORDER BY c.created_at DESC
        ''', (g.user_id,)).fetchall()
    else:  # admin
        courses = db.execute('''
            SELECT c.*, u.full_name as teacher_name,
                   (SELECT COUNT(*) FROM enrollments WHERE course_id=c.id) as enrolled_count,
                   0 as is_enrolled
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY c.created_at DESC
        ''').fetchall()
    
    return jsonify([dict(c) for c in courses])

@app.route('/api/courses', methods=['POST'])
@require_auth(['teacher', 'admin'])
def create_course():
    data = request.json or {}
    if not data.get('title') or not data.get('code'):
        return jsonify({'error': 'Title and code required'}), 400
    
    db = get_db()
    course_id = str(uuid.uuid4())
    teacher_id = data.get('teacher_id') if g.role == 'admin' else g.user_id
    
    try:
        db.execute(
            "INSERT INTO courses (id, title, description, code, teacher_id, semester, year, department) VALUES (?,?,?,?,?,?,?,?)",
            (course_id, data['title'], data.get('description'), data['code'],
             teacher_id, data.get('semester', 'Fall'), data.get('year', 2024),
             data.get('department', ''))
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Course code already exists'}), 409
    
    return jsonify({'id': course_id, 'message': 'Course created'}), 201

@app.route('/api/courses/<course_id>', methods=['GET'])
@require_auth()
def get_course(course_id):
    db = get_db()
    course = db.execute('''
        SELECT c.*, u.full_name as teacher_name, u.email as teacher_email
        FROM courses c LEFT JOIN users u ON c.teacher_id=u.id
        WHERE c.id=?
    ''', (course_id,)).fetchone()
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    materials = db.execute(
        "SELECT * FROM course_materials WHERE course_id=? ORDER BY created_at",
        (course_id,)
    ).fetchall()
    
    forms = db.execute(
        "SELECT * FROM feedback_forms WHERE course_id=? AND is_active=1",
        (course_id,)
    ).fetchall()
    
    result = dict(course)
    result['materials'] = [dict(m) for m in materials]
    result['feedback_forms'] = [dict(f) for f in forms]
    return jsonify(result)

@app.route('/api/courses/<course_id>', methods=['PUT'])
@require_auth(['teacher', 'admin'])
def update_course(course_id):
    data = request.json or {}
    db = get_db()
    
    course = db.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    if not course:
        return jsonify({'error': 'Not found'}), 404
    if g.role == 'teacher' and course['teacher_id'] != g.user_id:
        return jsonify({'error': 'Forbidden'}), 403
    
    db.execute(
        "UPDATE courses SET title=?, description=?, semester=?, year=?, department=? WHERE id=?",
        (data.get('title', course['title']), data.get('description', course['description']),
         data.get('semester', course['semester']), data.get('year', course['year']),
         data.get('department', course['department']), course_id)
    )
    db.commit()
    return jsonify({'message': 'Updated'})

@app.route('/api/courses/<course_id>', methods=['DELETE'])
@require_auth(['admin'])
def delete_course(course_id):
    db = get_db()
    db.execute("UPDATE courses SET is_active=0 WHERE id=?", (course_id,))
    db.commit()
    return jsonify({'message': 'Deleted'})

@app.route('/api/courses/<course_id>/enroll', methods=['POST'])
@require_auth(['student'])
def enroll(course_id):
    db = get_db()
    try:
        db.execute(
            "INSERT INTO enrollments (id, student_id, course_id) VALUES (?,?,?)",
            (str(uuid.uuid4()), g.user_id, course_id)
        )
        db.commit()
        return jsonify({'message': 'Enrolled successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Already enrolled'}), 409

# ─── Routes: Materials ────────────────────────────────────────────────────────

@app.route('/api/courses/<course_id>/materials', methods=['POST'])
@require_auth(['teacher', 'admin'])
def add_material(course_id):
    data = request.json or {}
    db = get_db()
    
    mat_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO course_materials (id, course_id, title, type, url, description) VALUES (?,?,?,?,?,?)",
        (mat_id, course_id, data.get('title'), data.get('type', 'document'),
         data.get('url'), data.get('description'))
    )
    db.commit()
    return jsonify({'id': mat_id, 'message': 'Material added'}), 201

@app.route('/api/materials/<material_id>', methods=['DELETE'])
@require_auth(['teacher', 'admin'])
def delete_material(material_id):
    db = get_db()
    db.execute("DELETE FROM course_materials WHERE id=?", (material_id,))
    db.commit()
    return jsonify({'message': 'Deleted'})

# ─── Routes: Feedback Forms ───────────────────────────────────────────────────

@app.route('/api/courses/<course_id>/forms', methods=['POST'])
@require_auth(['teacher', 'admin'])
def create_form(course_id):
    data = request.json or {}
    db = get_db()
    
    form_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO feedback_forms (id, course_id, title, description, is_anonymous, created_by) VALUES (?,?,?,?,?,?)",
        (form_id, course_id, data.get('title', 'Feedback Form'),
         data.get('description'), data.get('is_anonymous', 0), g.user_id)
    )
    
    for i, q in enumerate(data.get('questions', [])):
        q_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO feedback_questions (id, form_id, question_text, question_type, options, is_required, order_index) VALUES (?,?,?,?,?,?,?)",
            (q_id, form_id, q['text'], q['type'],
             json.dumps(q['options']) if q.get('options') else None,
             q.get('required', 1), i)
        )
    
    db.commit()
    return jsonify({'id': form_id, 'message': 'Form created'}), 201

@app.route('/api/forms/<form_id>', methods=['GET'])
@require_auth()
def get_form(form_id):
    db = get_db()
    form = db.execute("SELECT * FROM feedback_forms WHERE id=?", (form_id,)).fetchone()
    if not form:
        return jsonify({'error': 'Not found'}), 404
    
    questions = db.execute(
        "SELECT * FROM feedback_questions WHERE form_id=? ORDER BY order_index",
        (form_id,)
    ).fetchall()
    
    result = dict(form)
    result['questions'] = []
    for q in questions:
        qd = dict(q)
        if qd.get('options'):
            qd['options'] = json.loads(qd['options'])
        result['questions'].append(qd)
    
    return jsonify(result)

@app.route('/api/forms/<form_id>/submit', methods=['POST'])
@require_auth(['student'])
def submit_feedback(form_id):
    data = request.json or {}
    db = get_db()
    
    form = db.execute("SELECT * FROM feedback_forms WHERE id=? AND is_active=1", (form_id,)).fetchone()
    if not form:
        return jsonify({'error': 'Form not found or inactive'}), 404
    
    resp_id = str(uuid.uuid4())
    is_anonymous = data.get('is_anonymous', form['is_anonymous'])
    student_id = None if is_anonymous else g.user_id
    
    db.execute(
        "INSERT INTO feedback_responses (id, form_id, student_id, is_anonymous) VALUES (?,?,?,?)",
        (resp_id, form_id, student_id, is_anonymous)
    )
    
    for ans in data.get('answers', []):
        db.execute(
            "INSERT INTO feedback_answers (id, response_id, question_id, answer_text, answer_value) VALUES (?,?,?,?,?)",
            (str(uuid.uuid4()), resp_id, ans['question_id'],
             ans.get('text'), ans.get('value'))
        )
    
    db.commit()
    return jsonify({'message': 'Feedback submitted successfully', 'id': resp_id}), 201

# ─── Routes: Analytics ────────────────────────────────────────────────────────

@app.route('/api/courses/<course_id>/analytics', methods=['GET'])
@require_auth(['teacher', 'admin'])
def get_course_analytics(course_id):
    db = get_db()
    
    course = db.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    if not course:
        return jsonify({'error': 'Not found'}), 404
    
    if g.role == 'teacher' and course['teacher_id'] != g.user_id:
        return jsonify({'error': 'Forbidden'}), 403
    
    # Get all text feedback
    text_answers = db.execute('''
        SELECT fa.answer_text, fa.answer_value, fq.question_type
        FROM feedback_answers fa
        JOIN feedback_responses fr ON fa.response_id = fr.id
        JOIN feedback_questions fq ON fa.question_id = fq.id
        JOIN feedback_forms ff ON fr.form_id = ff.id
        WHERE ff.course_id = ? AND fa.answer_text IS NOT NULL
    ''', (course_id,)).fetchall()
    
    rating_answers = db.execute('''
        SELECT fa.answer_value
        FROM feedback_answers fa
        JOIN feedback_responses fr ON fa.response_id = fr.id
        JOIN feedback_questions fq ON fa.question_id = fq.id
        JOIN feedback_forms ff ON fr.form_id = ff.id
        WHERE ff.course_id = ? AND fq.question_type='rating' AND fa.answer_value IS NOT NULL
    ''', (course_id,)).fetchall()
    
    enrolled_count = db.execute(
        "SELECT COUNT(*) as cnt FROM enrollments WHERE course_id=?", (course_id,)
    ).fetchone()['cnt']
    
    response_count = db.execute('''
        SELECT COUNT(DISTINCT fr.id) as cnt FROM feedback_responses fr
        JOIN feedback_forms ff ON fr.form_id=ff.id
        WHERE ff.course_id=?
    ''', (course_id,)).fetchone()['cnt']
    
    texts = [r['answer_text'] for r in text_answers if r['answer_text']]
    ratings = [r['answer_value'] for r in rating_answers if r['answer_value'] is not None]
    
    sentiments = [analyze_sentiment(t) for t in texts]
    keywords = extract_keywords(texts)
    summary = generate_summary(texts, sentiments)
    avg_rating = sum(ratings)/len(ratings) if ratings else 0
    performance_score = calculate_performance_score(ratings, sentiments)
    suggestions = generate_suggestions(keywords, sentiments, avg_rating)
    
    sentiment_dist = Counter(s['label'] for s in sentiments)
    
    return jsonify({
        'course_id': course_id,
        'enrolled_count': enrolled_count,
        'response_count': response_count,
        'avg_rating': round(avg_rating, 2),
        'performance_score': performance_score,
        'sentiment_distribution': {
            'positive': sentiment_dist.get('positive', 0),
            'neutral': sentiment_dist.get('neutral', 0),
            'negative': sentiment_dist.get('negative', 0)
        },
        'sentiments': sentiments,
        'keywords': keywords,
        'summary': summary,
        'suggestions': suggestions,
        'total_feedback': len(texts)
    })

@app.route('/api/teacher/analytics', methods=['GET'])
@require_auth(['teacher'])
def get_teacher_analytics():
    db = get_db()
    
    courses = db.execute(
        "SELECT * FROM courses WHERE teacher_id=? AND is_active=1", (g.user_id,)
    ).fetchall()
    
    overall_data = {
        'total_courses': len(courses),
        'total_students': 0,
        'total_feedback': 0,
        'avg_performance': 0,
        'courses_analytics': []
    }
    
    all_scores = []
    for course in courses:
        enrolled = db.execute(
            "SELECT COUNT(*) as cnt FROM enrollments WHERE course_id=?", (course['id'],)
        ).fetchone()['cnt']
        
        texts = db.execute('''
            SELECT fa.answer_text FROM feedback_answers fa
            JOIN feedback_responses fr ON fa.response_id=fr.id
            JOIN feedback_forms ff ON fr.form_id=ff.id
            WHERE ff.course_id=? AND fa.answer_text IS NOT NULL
        ''', (course['id'],)).fetchall()
        
        ratings = db.execute('''
            SELECT fa.answer_value FROM feedback_answers fa
            JOIN feedback_responses fr ON fa.response_id=fr.id
            JOIN feedback_questions fq ON fa.question_id=fq.id
            JOIN feedback_forms ff ON fr.form_id=ff.id
            WHERE ff.course_id=? AND fq.question_type='rating' AND fa.answer_value IS NOT NULL
        ''', (course['id'],)).fetchall()
        
        text_list = [r['answer_text'] for r in texts]
        rating_list = [r['answer_value'] for r in ratings]
        sentiments = [analyze_sentiment(t) for t in text_list]
        score = calculate_performance_score(rating_list, sentiments)
        
        all_scores.append(score)
        overall_data['total_students'] += enrolled
        overall_data['total_feedback'] += len(text_list)
        
        overall_data['courses_analytics'].append({
            'course_id': course['id'],
            'course_title': course['title'],
            'course_code': course['code'],
            'enrolled': enrolled,
            'feedback_count': len(text_list),
            'performance_score': score,
            'avg_rating': round(sum(rating_list)/len(rating_list), 2) if rating_list else 0
        })
    
    overall_data['avg_performance'] = round(sum(all_scores)/len(all_scores), 1) if all_scores else 0
    return jsonify(overall_data)

@app.route('/api/admin/dashboard', methods=['GET'])
@require_auth(['admin'])
def admin_dashboard():
    db = get_db()
    
    stats = {
        'total_users': db.execute("SELECT COUNT(*) as c FROM users WHERE is_active=1").fetchone()['c'],
        'total_students': db.execute("SELECT COUNT(*) as c FROM users WHERE role='student' AND is_active=1").fetchone()['c'],
        'total_teachers': db.execute("SELECT COUNT(*) as c FROM users WHERE role='teacher' AND is_active=1").fetchone()['c'],
        'total_courses': db.execute("SELECT COUNT(*) as c FROM courses WHERE is_active=1").fetchone()['c'],
        'total_feedback': db.execute("SELECT COUNT(*) as c FROM feedback_responses").fetchone()['c'],
        'total_enrollments': db.execute("SELECT COUNT(*) as c FROM enrollments").fetchone()['c'],
    }
    
    # Get all text feedback for system-wide sentiment
    all_texts = db.execute(
        "SELECT answer_text FROM feedback_answers WHERE answer_text IS NOT NULL"
    ).fetchall()
    texts = [r['answer_text'] for r in all_texts]
    sentiments = [analyze_sentiment(t) for t in texts]
    dist = Counter(s['label'] for s in sentiments)
    
    stats['sentiment_overview'] = {
        'positive': dist.get('positive', 0),
        'neutral': dist.get('neutral', 0),
        'negative': dist.get('negative', 0)
    }
    
    # Top performing courses
    top_courses = db.execute('''
        SELECT c.title, c.code, u.full_name as teacher,
               COUNT(DISTINCT e.student_id) as students,
               COUNT(DISTINCT fr.id) as feedback_count
        FROM courses c
        LEFT JOIN users u ON c.teacher_id=u.id
        LEFT JOIN enrollments e ON c.id=e.course_id
        LEFT JOIN feedback_forms ff ON c.id=ff.course_id
        LEFT JOIN feedback_responses fr ON ff.id=fr.form_id
        WHERE c.is_active=1
        GROUP BY c.id
        ORDER BY feedback_count DESC
        LIMIT 5
    ''').fetchall()
    stats['top_courses'] = [dict(c) for c in top_courses]
    
    return jsonify(stats)

# ─── Routes: Users (Admin) ────────────────────────────────────────────────────

@app.route('/api/admin/users', methods=['GET'])
@require_auth(['admin'])
def get_users():
    db = get_db()
    users = db.execute(
        "SELECT id, username, email, role, full_name, department, created_at, is_active FROM users ORDER BY created_at DESC"
    ).fetchall()
    return jsonify([dict(u) for u in users])

@app.route('/api/admin/users', methods=['POST'])
@require_auth(['admin'])
def create_user():
    data = request.json or {}
    db = get_db()
    user_id = str(uuid.uuid4())
    try:
        db.execute(
            "INSERT INTO users (id, username, email, password_hash, role, full_name, department) VALUES (?,?,?,?,?,?,?)",
            (user_id, data['username'], data['email'], _hash_pw(data.get('password', 'password123')),
             data.get('role', 'student'), data.get('full_name'), data.get('department'))
        )
        db.commit()
        return jsonify({'id': user_id, 'message': 'User created'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username/email already exists'}), 409

@app.route('/api/admin/users/<user_id>', methods=['PUT'])
@require_auth(['admin'])
def update_user(user_id):
    data = request.json or {}
    db = get_db()
    db.execute(
        "UPDATE users SET full_name=?, email=?, role=?, department=?, is_active=? WHERE id=?",
        (data.get('full_name'), data.get('email'), data.get('role'),
         data.get('department'), data.get('is_active', 1), user_id)
    )
    db.commit()
    return jsonify({'message': 'Updated'})

@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@require_auth(['admin'])
def delete_user(user_id):
    db = get_db()
    db.execute("UPDATE users SET is_active=0 WHERE id=?", (user_id,))
    db.commit()
    return jsonify({'message': 'Deactivated'})

@app.route('/api/teachers', methods=['GET'])
@require_auth(['admin', 'teacher'])
def get_teachers():
    db = get_db()
    teachers = db.execute(
        "SELECT id, username, full_name, email, department FROM users WHERE role='teacher' AND is_active=1"
    ).fetchall()
    return jsonify([dict(t) for t in teachers])

# ─── Routes: Trend Analysis ───────────────────────────────────────────────────

@app.route('/api/trends/<teacher_id>', methods=['GET'])
@require_auth(['teacher', 'admin'])
def get_trends(teacher_id):
    db = get_db()
    
    courses = db.execute(
        "SELECT * FROM courses WHERE teacher_id=?", (teacher_id,)
    ).fetchall()
    
    trends = []
    for course in courses:
        ratings = db.execute('''
            SELECT fa.answer_value, strftime('%Y', fr.submitted_at) as year,
                   ff.semester
            FROM feedback_answers fa
            JOIN feedback_responses fr ON fa.response_id=fr.id
            JOIN feedback_questions fq ON fa.question_id=fq.id
            JOIN feedback_forms ff ON fr.form_id=ff.id
            WHERE ff.course_id=? AND fq.question_type='rating' AND fa.answer_value IS NOT NULL
        ''', (course['id'],)).fetchall()
        
        by_semester = {}
        for r in ratings:
            key = f"{r['semester'] or 'Unknown'} {r['year'] or '2024'}"
            if key not in by_semester:
                by_semester[key] = []
            by_semester[key].append(r['answer_value'])
        
        trend_data = []
        for period, vals in sorted(by_semester.items()):
            trend_data.append({
                'period': period,
                'avg_rating': round(sum(vals)/len(vals), 2),
                'count': len(vals)
            })
        
        if trend_data:
            trends.append({
                'course': course['title'],
                'code': course['code'],
                'data': trend_data
            })
    
    return jsonify(trends)

# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000)