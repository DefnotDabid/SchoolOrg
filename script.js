// ====== Demo Accounts ======
const users = [
  { email: "jom.com", password: "1234", role: "Creator" },
  { email: "dave.com", password: "1234", role: "Admin" },
  { email: "jam.com", password: "1234", role: "Member" },
];

// ====== LOGIN HANDLER ======
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password!");
    return;
  }

  // Save session
  localStorage.setItem("clubhub_user", JSON.stringify(user));

  // Hide login
  document.getElementById("login-page").classList.add("hidden");

  // Show the right dashboard
  if (user.role === "Creator") {
    document.getElementById("creator-dashboard").classList.remove("hidden");
  } else if (user.role === "Admin") {
    document.getElementById("admin-dashboard").classList.remove("hidden");
  } else {
    document.getElementById("member-dashboard").classList.remove("hidden");
  }

  renderProfile(user);
});

// ====== LOGOUT ======
function logout() {
  localStorage.removeItem("clubhub_user");
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById("login-page").classList.remove("hidden");
}

// ====== PROFILE RENDER ======
function renderProfile(user) {
  document.getElementById("profile-name").textContent = user.email.split("@")[0];
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-role").textContent = `Role: ${user.role}`;
}

// ====== NAVIGATION ======
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}

document.getElementById("dashboard-btn").addEventListener("click", () => {
  const user = JSON.parse(localStorage.getItem("clubhub_user"));
  if (!user) return;
  if (user.role === "Creator") showPage("creator-dashboard");
  else if (user.role === "Admin") showPage("admin-dashboard");
  else showPage("member-dashboard");
});
document.getElementById("clubs-btn").addEventListener("click", () => showPage("clubs"));
document.getElementById("profile-btn").addEventListener("click", () => {
  const user = JSON.parse(localStorage.getItem("clubhub_user"));
  if (user) renderProfile(user);
  showPage("profile");
});

// ====== CLUBS + EVENTS (from your old code) ======
// Keep your initDB(), renderClubs(), openClubModal(), renderAnnouncements(), etc. here
