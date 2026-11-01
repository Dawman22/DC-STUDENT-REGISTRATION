
const $ = id => document.getElementById(id);

let students = [];
let events = [];
let nextId = 1;
let editingId = null;
let currentFilter = "All";

// DOM activity logger
function log(type, message) {
  events.unshift({
    type,
    message,
    time: new Date().toLocaleTimeString()
  });

  $("eventCount").textContent = events.length;
  renderLogs();
}

// Render activity logs
function renderLogs() {
  const list = $("logList");
  list.innerHTML = "";

  const filtered = events.filter(e =>
    currentFilter === "All" || e.type === currentFilter
  );

  if (!filtered.length) {
    list.textContent = "No activity to display.";
    list.className = "empty";
    return;
  }

  list.className = "log-list";

  filtered.forEach(event => {
    const row = document.createElement("div");
    row.className = "log-item";

    [event.time, event.type, event.message].forEach((value, i) => {
      const span = document.createElement("span");
      span.textContent = value;
      if (i === 0) span.className = "log-time";
      if (i === 1) span.className = "log-type";
      row.appendChild(span);
    });

    list.appendChild(row);
  });
}

// Validation helpers
function error(id, message) {
  $(id).textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".error").forEach(el => {
    el.textContent = "";
  });

  document.querySelectorAll(".invalid").forEach(el => {
    el.classList.remove("invalid");
  });
}

function validateForm() {
  clearErrors();

  let valid = true;

  const name = $("name").value.trim();
  const email = $("email").value.trim();
  const phone = $("phone").value.trim();
  const password = $("password").value;
  const confirm = $("confirmPassword").value;
  const course = $("course").value;
  const gender = document.querySelector(
    'input[name="gender"]:checked'
  );

  function fail(field, errorId, message) {
    $(field).classList.add("invalid");
    error(errorId, message);
    valid = false;
  }

  if (name.length < 2) {
    fail("name", "nameError", "Enter a valid full name.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("email", "emailError", "Enter a valid email address.");
  }

  if (!/^\d{10}$/.test(phone)) {
    fail("phone", "phoneError", "Enter exactly 10 digits.");
  }

  if (!course) {
    fail("course", "courseError", "Select a course.");
  }

  if (password.length < 6) {
    fail("password", "passwordError", "Minimum 6 characters required.");
  }

  if (!confirm || password !== confirm) {
    fail("confirmPassword", "confirmError", "Passwords do not match.");
  }

  if (!gender) {
    error("genderError", "Please select gender identity.");
    valid = false;
  }

  if (!$("consent").checked) {
    error("consentError", "Please confirm your information.");
    valid = false;
  }

  return valid;
}

// Password strength indicator
function passwordStrength() {
  const password = $("password").value;
  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = [
    "Password strength",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very strong"
  ];

  $("strengthBar").style.width = score * 20 + "%";
  $("strengthText").textContent = labels[score];

  $("strengthBar").style.background =
    score < 2 ? "#d64e62" :
    score < 4 ? "#d7a23d" : "#2da77b";
}

$("password").addEventListener("input", () => {
  passwordStrength();
  log("Event", "Password strength updated.");
});

// Show or hide password
$("showPassword").addEventListener("click", () => {
  const input = $("password");
  const show = input.type === "password";

  input.setAttribute("type", show ? "text" : "password");
  $("showPassword").textContent = show ? "Hide" : "Show";

  log("Mutate", "Password visibility changed using setAttribute().");
});

// Character counter
$("ambition").addEventListener("input", () => {
  $("charCount").textContent =
    $("ambition").value.length + " / 150";
});

// Collect skills
function getSkills() {
  return Array.from(
    document.querySelectorAll('input[name="skills"]:checked')
  ).map(input => input.value);
}

// Update dashboard counters
function updateStats() {
  $("total").textContent = students.length;
  $("active").textContent =
    students.filter(s => s.active).length;

  $("recordCount").textContent = students.length;
}

// Render student records
function renderStudents() {
  const table = $("studentTable");
  table.innerHTML = "";

  const search = $("search").value.toLowerCase();

  const filtered = students.filter(s =>
    [s.name, s.email, s.phone, s.course]
      .join(" ")
      .toLowerCase()
      .includes(search)
  );

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.className = "empty";
    cell.textContent = students.length
      ? "No matching student records."
      : "No student records yet.";

    row.appendChild(cell);
    table.appendChild(row);

    updateStats();
    return;
  }

  filtered.forEach(student => {
    const row = document.createElement("tr");

    function cell(content, className = "") {
      const td = document.createElement("td");
      td.textContent = content;
      td.className = className;
      return td;
    }

    row.appendChild(cell(
      "ST-" + String(student.id).padStart(3, "0")
    ));

    const studentCell = document.createElement("td");
    const name = document.createElement("strong");
    name.textContent = student.name;

    const email = document.createElement("small");
    email.textContent = student.email;
    email.style.display = "block";

    studentCell.append(name, email);
    row.appendChild(studentCell);

    row.appendChild(cell(student.phone));
    row.appendChild(cell(student.course));

    const skillsCell = document.createElement("td");

    student.skills.forEach(skill => {
      const tag = document.createElement("span");
      tag.className = "skill-tag";
      tag.textContent = skill;
      skillsCell.appendChild(tag);
    });

    if (!student.skills.length) {
      skillsCell.textContent = "—";
    }

    row.appendChild(skillsCell);

    const statusCell = document.createElement("td");
    const status = document.createElement("button");

    status.className = student.active ? "status" : "status off";
    status.textContent = student.active ? "Active" : "Inactive";
    status.dataset.action = "status";
    status.dataset.id = student.id;

    statusCell.appendChild(status);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");

    const edit = document.createElement("button");
    edit.className = "action";
    edit.textContent = "Edit";
    edit.dataset.action = "edit";
    edit.dataset.id = student.id;

    const remove = document.createElement("button");
    remove.className = "action delete";
    remove.textContent = "Delete";
    remove.dataset.action = "delete";
    remove.dataset.id = student.id;

    actionCell.append(edit, remove);
    row.appendChild(actionCell);

    table.appendChild(row);
  });

  updateStats();
  log("Create", "Student table rendered using createElement() and appendChild().");
}

// Registration and editing
$("studentForm").addEventListener("submit", event => {
  event.preventDefault();

  log("Event", "Form submission intercepted using preventDefault().");

  if (!validateForm()) {
    $("feedback").textContent = "Please correct the errors above.";
    $("feedback").style.color = "#d64e62";
    return;
  }

  const student = {
    name: $("name").value.trim(),
    email: $("email").value.trim(),
    phone: $("phone").value.trim(),
    course: $("course").value,
    password: $("password").value,
    gender: document.querySelector(
      'input[name="gender"]:checked'
    ).value,
    skills: getSkills(),
    ambition: $("ambition").value.trim(),
    active: true
  };

  if (editingId !== null) {
    const index = students.findIndex(s => s.id === editingId);

    if (index !== -1) {
      students[index] = {
        ...students[index],
        ...student
      };
    }

    log("Mutate", "Student record updated.");
    $("feedback").textContent = "Student updated successfully.";
    editingId = null;

  } else {
    student.id = nextId++;
    students.push(student);

    log("Create", "New student registered successfully.");
    $("feedback").textContent = "Student registered successfully.";
  }

  $("feedback").style.color = "#18855f";

  $("submitBtn").textContent = "Register student →";

  renderStudents();
  resetForm();
});

// Reset form
function resetForm() {
  $("studentForm").reset();
  clearErrors();

  $("charCount").textContent = "0 / 150";
  $("strengthBar").style.width = "0";
  $("strengthText").textContent = "Password strength";
  $("showPassword").textContent = "Show";
  $("password").type = "password";
}

// Sample information
$("sampleBtn").addEventListener("click", () => {
  $("name").value = "Alex Johnson";
  $("email").value = "alex.johnson@university.edu";
  $("phone").value = "9876543210";
  $("course").value = "BCA";
  $("password").value = "Nova@2026";
  $("confirmPassword").value = "Nova@2026";

  document.querySelector(
    'input[name="gender"][value="Male"]'
  ).checked = true;

  document.querySelectorAll('input[name="skills"]').forEach(input => {
    input.checked = [
      "HTML5 & DOM",
      "Modern CSS",
      "JavaScript ES6+"
    ].includes(input.value);
  });

  $("ambition").value =
    "I want to build useful applications and improve my programming skills.";

  $("consent").checked = true;

  $("charCount").textContent =
    $("ambition").value.length + " / 150";

  passwordStrength();
  log("Mutate", "Sample student details populated.");
});

// Search records
$("search").addEventListener("input", () => {
  log("Query", "Student records filtered using search.");
  renderStudents();
});

// Edit, delete and status controls
$("studentTable").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = Number(button.dataset.id);
  const student = students.find(s => s.id === id);

  if (!student) return;

  if (button.dataset.action === "status") {
    student.active = !student.active;

    log("Mutate", "Student status changed.");
    renderStudents();
  }

  if (button.dataset.action === "delete") {
    if (!confirm("Delete " + student.name + "'s record?")) return;

    students = students.filter(s => s.id !== id);

    log("Mutate", "Student record removed from the DOM.");
    renderStudents();
  }

  if (button.dataset.action === "edit") {
    editingId = id;

    $("name").value = student.name;
    $("email").value = student.email;
    $("phone").value = student.phone;
    $("course").value = student.course;
    $("password").value = student.password;
    $("confirmPassword").value = student.password;
    $("ambition").value = student.ambition;
    $("consent").checked = true;

    document.querySelectorAll('input[name="gender"]').forEach(input => {
      input.checked = input.value === student.gender;
    });

    document.querySelectorAll('input[name="skills"]').forEach(input => {
      input.checked = student.skills.includes(input.value);
    });

    $("charCount").textContent =
      student.ambition.length + " / 150";

    passwordStrength();

    $("submitBtn").textContent = "Save changes →";

    log("Query", "Student information loaded for editing.");

    $("registration").scrollIntoView({
      behavior: "smooth"
    });
  }
});

// Filter DOM activity
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    renderLogs();
  });
});

// Clear activity
$("clearLog").addEventListener("click", () => {
  events = [];
  $("eventCount").textContent = "0";
  renderLogs();
});

// Theme switch
$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const dark = document.body.classList.contains("dark");

  $("themeBtn").textContent = dark ? "☀ Light mode" : "☾ Dark mode";

  log("Mutate", "Theme changed using classList.toggle().");
});

// Reset handling
$("studentForm").addEventListener("reset", () => {
  setTimeout(() => {
    clearErrors();
    $("charCount").textContent = "0 / 150";
    $("strengthBar").style.width = "0";
    $("strengthText").textContent = "Password strength";
    $("showPassword").textContent = "Show";
    $("password").type = "password";
    $("feedback").textContent = "";
  }, 0);

  editingId = null;
  $("submitBtn").textContent = "Register student →";

  log("Event", "Registration form reset.");
});

// Initial application setup
updateStats();
renderStudents();
log("Query", "Application initialized using getElementById().");
