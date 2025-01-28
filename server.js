const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Enable CORS if the frontend and backend are on different origins.

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// MySQL database connection configuration
const db = mysql.createConnection({
    host: 'localhost',      
    user: 'root',  // MySQL username
    password: 'xyz', //r MySQL password
    database: 'aims_db', 
});



// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        process.exit(1); // Exit if the connection fails
    }
    console.log('Connected to MySQL database');
});

// Route to get departments
app.get('/api/departments', (req, res) => {
    const query = 'SELECT DISTINCT department_name FROM departments';

    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Send only the department names as a list
        res.json(results.map(row => row.department_name));
    });
});



app.get('/api/courses', (req, res) => {
    const { department_id, courseCode, courseTitle } = req.query;

    const departmentName = department_id; // department_id is actually the department name now
    let departmentId = null;

    // Get the department_id if department_name is provided
    const departmentQuery = `SELECT department_id FROM departments WHERE department_name = ?`;

    db.query(departmentQuery, [departmentName], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        departmentId = results[0].department_id; // Get department_id

        // Query to fetch courses along with instructor names
        const query = `
          SELECT c.*, i.instructor_name
          FROM courses c
          LEFT JOIN teaches t ON c.course_code = t.course_code
          LEFT JOIN instructors i ON t.instructor_id = i.instructor_id
          WHERE (c.department_id = ? OR ? IS NULL)
            AND (c.course_code LIKE ? OR ? IS NULL)
            AND (c.course_title LIKE ? OR ? IS NULL)
        `;

        const params = [
            departmentId, departmentId, `%${courseCode}%`, courseCode, `%${courseTitle}%`, courseTitle
        ];

        db.query(query, params, (err, courses) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(courses);
        });
    });
});

// Constants for current session
// const CURRENT_SEMESTER = 'Fall';
// const CURRENT_YEAR = 2024;

app.post('/api/enroll', (req, res) => {
    const { student_id, course_code } = req.body;

    const CURRENT_SEMESTER = 'Winter';
    const CURRENT_YEAR = 2025;

    console.log('Request body:', req.body);

    const getSecIdQuery = `
        SELECT sec_id 
        FROM sections 
        WHERE course_code = ? AND semester = ? AND year = ?
    `;

    db.query(getSecIdQuery, [course_code, CURRENT_SEMESTER, CURRENT_YEAR], (err, results) => {
        if (err) {
            console.error('Error fetching sec_id:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            console.log('No section found for the course');
            return res.status(404).json({ error: 'No section found for the course in the current session' });
        }

        const sec_id = results[0].sec_id;
        console.log('sec_id:', sec_id);

        const insertEnrollmentQuery = `
            INSERT INTO enrollments (student_id, course_code, sec_id, semester, year, status)
            VALUES (?, ?, ?, ?, ?, 'Pending Approval')
        `;

        db.query(insertEnrollmentQuery, [student_id, course_code, sec_id, CURRENT_SEMESTER, CURRENT_YEAR], (err, result) => {
            if (err) {
                console.error('Error inserting enrollment:', err);
                if (err.code === 'ER_NO_REFERENCED_ROW') {
                    return res.status(400).json({ error: 'Invalid student_id or course_code' });
                } else if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Duplicate enrollment request' });
                }
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            console.log('Enrollment successful:', result);
            res.json({ message: 'Enrollment request submitted successfully!', enrollmentId: result.insertId });
        });
    });
});

  
// Endpoint to fetch enrollments for a course
app.get('/api/enrollments', (req, res) => {
    const { course_code } = req.query;

    const query = `
        SELECT e.enrollment_id, e.student_id, s.student_name, e.sec_id, e.semester, e.year, e.status, e.request_date
        FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        WHERE e.course_code = ?
    `;

    db.query(query, [course_code], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});