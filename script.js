
document.addEventListener('DOMContentLoaded', () => {
  const departmentSelect = document.querySelector('#department-filter');
  const navLinks = document.querySelectorAll('.nav-link');

  // Handle section switching
  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const sectionId = event.target.dataset.section;

      // Hide all sections and show the selected one
      document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
      });
      document.getElementById(`${sectionId}-section`).style.display = 'block';
    });
  });

  // Fetch departments from the API
  fetch('http://localhost:3000/api/departments')
    .then(response => response.json())
    .then(departments => {
      // Populate the dropdown
      departments.forEach(department => {
        const option = document.createElement('option');
        option.value = department;
        option.textContent = department;
        departmentSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error fetching departments:', error);
    });

  // Add event listener to the search button
  document.querySelector('.search-btn').addEventListener('click', fetchCourses);
});




function fetchCourses() {
  const department = document.getElementById('department-filter').value;
  const courseCode = document.getElementById('course-code-filter').value;
  const courseTitle = document.getElementById('course-title-filter').value;

  const departmentEncoded = encodeURIComponent(department);
  const courseCodeEncoded = encodeURIComponent(courseCode);
  const courseTitleEncoded = encodeURIComponent(courseTitle);

  const url = `http://localhost:3000/api/courses?department_id=${departmentEncoded}&courseCode=${courseCodeEncoded}&courseTitle=${courseTitleEncoded}`;

  console.log("Fetching URL:", url);

  fetch(url)
    .then(response => {
      console.log("Response Status:", response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    })
    .then(courses => {
      console.log("Fetched Courses:", courses);
      const resultsSection = document.querySelector('.results');
      resultsSection.innerHTML = ''; // Clear previous results

      // courses.forEach(course => {
      //   const courseCard = document.createElement('div');
      //   courseCard.classList.add('result-card');
      //   courseCard.innerHTML = `
      //       <h4>${course.course_code} | ${course.course_title}</h4>
      //       <p><strong>Instructor:</strong> ${course.instructor_name || 'TBA'}</p>
      //       <p><strong>Credits:</strong> ${course.credits}</p>
      //       <p><strong>Session:</strong> ${course.session}</p>
      //       <button class="enroll_button" onclick="enroll('${course.course_code}')">Request Enroll</button>
      //     `;
      //   resultsSection.appendChild(courseCard);
      // });
      courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.classList.add('result-card');
        courseCard.innerHTML = `
            <h4 onclick="viewEnrollments('${course.course_code}')">${course.course_code} | ${course.course_title}</h4>
            <p><strong>Instructor:</strong> ${course.instructor_name || 'TBA'}</p>
            <p><strong>Credits:</strong> ${course.credits}</p>
            <p><strong>Session:</strong> ${course.session}</p>
            <button class="enroll_button" onclick="enroll('${course.course_code}', '${course.sec_id}')">Request Enroll</button>
        `;
        resultsSection.appendChild(courseCard);
      });
    })
    .catch(err => {
      console.error('Error fetching courses:', err);
    });
}

// Hardcoded current student ID
const CURRENT_STUDENT_ID = '2022CVB1005';
function enroll(courseCode) {
  const payload = {
    student_id: CURRENT_STUDENT_ID,
    course_code: courseCode,
  };

  fetch('http://localhost:3000/api/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        const enrollButton = document.querySelector(`button[data-course="${courseCode}"]`);
        if (enrollButton) {
          enrollButton.style.display = 'none';
        }
      } else if (data.error) {
        alert(`Error: ${data.error}`);
      }
    })
    .catch(err => {
      console.error('Error submitting enrollment request:', err);
      alert('Network error. Please try again.');
    });
}

// function enroll(courseCode) {
//   const payload = {
//     student_id: CURRENT_STUDENT_ID,
//     course_code: courseCode,
//   };

//   fetch('http://localhost:3000/api/enroll', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(payload),
//   })
//     .then(response => response.json())
//     .then(data => {
//       if (data.message) {
//         alert(data.message);

//         // Hide the "Enroll" button
//         const enrollButton = document.querySelector(`button[data-course="${courseCode}"]`);
//         if (enrollButton) {
//           enrollButton.style.display = 'none';
//         }
//       } else if (data.error) {
//         alert(`Error: ${data.error}`);
//       }
//     })
//     .catch(err => {
//       console.error('Error submitting enrollment request:', err);
//     });
// }


// Fetch and display enrollments for a course
function viewEnrollments(courseCode) {
  fetch(`http://localhost:3000/api/enrollments?course_code=${courseCode}`)
    .then(response => response.json())
    .then(enrollments => {
      const resultsSection = document.querySelector('.results');
      resultsSection.innerHTML = ''; // Clear previous results

      const enrollmentsTable = document.createElement('table');
      enrollmentsTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Enrollment ID</th>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Section</th>
                        <th>Semester</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Request Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${enrollments
          .map(e => `
                            <tr>
                                <td>${e.enrollment_id}</td>
                                <td>${e.student_id}</td>
                                <td>${e.student_name}</td>
                                <td>${e.sec_id}</td>
                                <td>${e.semester}</td>
                                <td>${e.year}</td>
                                <td>${e.status}</td>
                                <td>${new Date(e.request_date).toLocaleString()}</td>
                            </tr>
                        `)
          .join('')}
                </tbody>
            `;

      resultsSection.appendChild(enrollmentsTable);
    })
    .catch(err => {
      console.error('Error fetching enrollments:', err);
    });
}

function updateProfile() {
  const nameInput = document.getElementById('update-name').value;
  const emailInput = document.getElementById('update-email').value;

  // Update profile information
  if (nameInput) document.getElementById('profile-name').textContent = nameInput;
  if (emailInput) document.getElementById('profile-email').textContent = emailInput;

  // Clear input fields
  document.getElementById('update-name').value = '';
  document.getElementById('update-email').value = '';

  alert('Profile updated successfully!');
}
