# AI-Powered Course Feedback Collection System

This is a full-stack web application designed to collect and analyze course feedback using AI. It provides a platform for students to give feedback, for teachers to view analytics and for administrators to manage the system.

## About The Project

This project is built with a React frontend and a Flask backend. It uses a SQLite database to store data. The AI component provides sentiment analysis and keyword extraction on the feedback submitted by students.

### Features:
*   **Role-based access control:** with three roles: `student`, `teacher`, and `admin`.
*   **Authentication:** using JWT.
*   **Course Management:** Admins and Teachers can create, update, and delete courses.
*   **Feedback System:** Students can submit feedback for courses.
*   **AI Analytics:** Teachers can view AI-powered analytics of the feedback, including sentiment analysis and keyword extraction.
*   **Admin Dashboard:** Admins have a dashboard to manage users and courses.

## Built With

This project is built with the following technologies:

### Frontend
*   [React](https://reactjs.org/)
*   [Axios](https://axios-http.com/)
*   [React Router](https://reactrouter.com/)

### Backend
*   [Flask](https://flask.palletsprojects.com/)
*   [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
*   [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
*   [Flask-CORS](https://flask-cors.readthedocs.io/)
*   [Flask-Bcrypt](https://flask-bcrypt.readthedocs.io/)
*   [scikit-learn](https://scikit-learn.org/stable/)
*   [NLTK](https://www.nltk.org/)
*   [TextBlob](https://textblob.readthedocs.io/)

### Database
*   [SQLite](https://www.sqlite.org/index.html)

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

You need to have Node.js and Python installed on your machine.

*   npm
    ```sh
    npm install npm@latest -g
    ```
*   python
    ```sh
    # Make sure you have python installed
    python --version
    ```

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username_/Project-Name.git
    ```
2.  Install NPM packages for frontend
    ```sh
    cd frontend
    npm install
    ```
3.  Install python packages for backend
    ```sh
    cd backend
    pip install -r requirements.txt
    ```

## Usage

### Running the application

1.  **Backend**
    ```sh
    cd backend
    flask run
    ```
    The backend will be running on `http://127.0.0.1:5000`

2.  **Frontend**
    ```sh
    cd frontend
    npm start
    ```
    The frontend will be running on `http://localhost:3000`

Now you can open your browser and navigate to `http://localhost:3000` to use the application.

## Folder Structure

The project is organized into two main folders: `frontend` and `backend`.

```
.
├── backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── feedback.db         # SQLite database
│   └── ...
└── frontend
    ├── src
    │   ├── App.js          # Main React component
    │   ├── index.js        # Entry point for React
    │   ├── pages           # Different pages of the application
    │   ├── components      # Reusable components
    │   └── ...
    ├── package.json        # Node.js dependencies
    └── ...
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
