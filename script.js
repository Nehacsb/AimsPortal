document.addEventListener('DOMContentLoaded', () => {
  const departmentSelect = document.querySelector('#department-filter');
  const searchButton = document.querySelector('.search-btn');

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
  searchButton.addEventListener('click', fetchCourses);
});

// Fetch courses based on filters
function fetchCourses() {
  const department = document.getElementById('department-filter').value;
  const courseCode = document.getElementById('course-code-filter').value;
  const courseTitle = document.getElementById('course-title-filter').value;

  // URL encode the parameters
  const departmentEncoded = encodeURIComponent(department);
  const courseCodeEncoded = encodeURIComponent(courseCode);
  const courseTitleEncoded = encodeURIComponent(courseTitle);

  // Construct the full URL with the base URL (http://localhost:3000)
  const url = `http://localhost:3000/api/courses?department_id=${departmentEncoded}&courseCode=${courseCodeEncoded}&courseTitle=${courseTitleEncoded}`;

  console.log("Fetching URL:", url);  // Log the URL being used for the request

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

      courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.classList.add('result-card');
        courseCard.innerHTML = `
            <h4>${course.course_code} | ${course.course_title}</h4>
            <p><strong>Credits:</strong> ${course.credits}</p>
            <p><strong>Session:</strong> ${course.session}</p>
            <button class="enroll_button" onclick="enroll('${course.id}')">Request Enroll</button>
          `;
        resultsSection.appendChild(courseCard);
      });
    })
    .catch(err => {
      console.error('Error fetching courses:', err);
    });
}


// Send enrollment request
function enroll(courseId) {
  fetch('/api/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, studentId: '2022CSB1096' }) // Replace with actual student ID
  })
    .then(response => response.json())
    .then(data => {
      alert(data.message); // Show success message
      fetchEnrolledCourses(); // Refresh enrolled courses
    })
    .catch(err => console.error('Error enrolling:', err));
}

// // Fetch enrolled courses for the student
// function fetchEnrolledCourses() {
//   fetch('/api/enrolled-courses?studentId=2022CSB1096') // Replace with actual student ID
//     .then(response => response.json())
//     .then(courses => {
//       const enrolledCoursesDiv = document.getElementById('enrolled-courses');
//       enrolledCoursesDiv.innerHTML = ''; // Clear previous entries

//       courses.forEach(course => {
//         const courseDiv = document.createElement('div');
//         courseDiv.innerHTML = `
//           <h4>${course.code} | ${course.title}</h4>
//           <p><strong>Status:</strong> ${course.status}</p>
//         `;
//         enrolledCoursesDiv.appendChild(courseDiv);
//       });
//     })
//     .catch(err => console.error('Error fetching enrolled courses:', err));
// }
