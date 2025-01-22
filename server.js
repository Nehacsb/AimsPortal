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

//search pupose Fetch Filtered Courses:
app.get('/api/courses', (req, res) => {
    const { department_id, courseCode, courseTitle } = req.query;

    // Get the department ID based on the department name if department_name is provided
    const departmentName = department_id;  // department_id is actually the department name now
    let departmentId = null;

    // Get the department_id if department_name is provided
    const departmentQuery = `SELECT department_id FROM departments WHERE department_name = ?`;

    db.query(departmentQuery, [departmentName], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        departmentId = results[0].department_id; // Get department_id
        
        // Now build the query to filter courses by department_id
        const query = `
          SELECT * FROM courses
          WHERE (department_id = ? OR ? IS NULL)
            AND (course_code LIKE ? OR ? IS NULL)
            AND (course_title LIKE ? OR ? IS NULL)
        `;

        const params = [
            departmentId, departmentId, `%${courseCode}%`, courseCode, `%${courseTitle}%`, courseTitle
        ];

        // Execute the query
        db.query(query, params, (err, courses) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(courses);
        });
    });
});




//enroll request
app.post('/api/enroll', (req, res) => {
    const { courseId, studentId } = req.body;
    const query = `INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, 'Pending Approval')`;

    db.query(query, [studentId, courseId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Enrollment request submitted!' });
    });
});
// Fetch Enrolled Courses:
app.get('/api/enrolled-courses', (req, res) => {
    const { studentId } = req.query;
    const query = `
      SELECT c.course_code AS code, c.course_title AS title, e.status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
    `;

    db.query(query, [studentId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});