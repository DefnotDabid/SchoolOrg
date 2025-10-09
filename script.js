/* ========================================================== */
/* ClubHub - JS (Final Version)
 *
 * Key fixes:
 * 1. Dark Mode Icons: Correctly implemented logic to show/hide .sun-icon / .moon-icon.
 * 2. Payments: All logic for multiple payment methods removed (GCash-only flow retained).
/* ========================================================== */

/* ========================================================== */
/* App State, Quick Accounts & Dummy Database
/* ========================================================== */
const appState = { user: null };

const quickAccounts = {
  handler: { username: 'Admin', password: 'handler123', role: 'Admin' },
  leader: { username: 'ClubLeader', password: 'leader123', role: 'Leader' },
};

const database = {
  users: [
    { id: 1, email: "admin@example.com", password: "123", role: "Admin", clubs: [] },
    { id: 2, email: "ClubLeadrer@example.com", password: "123", role: "Leader", clubs: [1], adminOf: 1 },
    { id: 3, email: "mary@example.com", password: "123", role: "Member", clubs: [1, 2] },
    { id: 4, email: "john@example.com", password: "123", role: "Member", clubs: [] }
  ],
  clubs: [
    {
      id: 1,
      name: "Robotics Club",
      image: "https://mir-s3-cdn-cf.behance.net/project_modules/hd/bb908f12412471.56268abbb66ed.png",
      description: "Building the future, one robot at a time. The Robotics Club offers hands-on experience in engineering, programming, and design, culminating in exciting competitions.",
      members: [2,4],
      adminId: 2,
      announcements: [
        { date: "2025-10-20", text: "New meeting this Friday at 4 PM in Lab C." },
        { date: "2025-10-18", text: "Mandatory practice session this Saturday at 10 AM." }
      ],
      events: [ { title: "Robotics Competition", date: "2025-11-15", description: "Our annual competition. All are welcome!", clubId: 1 } ]
    },
    {
      id: 2,
      name: "Art Guild",
      image: "https://i0.wp.com/www.palmerlibrary.org/wp-content/uploads/2024/06/Art-Club.png?fit=1191%2C1073&ssl=1",
      description: "A community for creative expression and artistic exploration. The Art Guild hosts workshops, gallery visits, and showcases for artists of all skill levels.",
      members: [3,4],
      adminId: 3,
      announcements: [
        { date: "2025-10-18", text: "Portfolio review session next Tuesday." },
        { date: "2025-10-15", text: "Guest artist lecture on Friday." }
      ],
      events: [ { title: "Art Exhibit", date: "2025-11-20", description: "Showcasing the work of our talented members.", clubId: 2 } ]
    },
    {
      id: 3,
      name: "Photography Club",
      image: "https://i.pinimg.com/1200x/14/23/73/142373755470d869b67c30eb1e9dbdc5.jpg",
      description: "Capturing moments and mastering the art of light and shadow. The Photography Club organizes photo walks, editing workshops, and exhibitions.",
      members: [],
      adminId: null,
      announcements: [],
      events: []
    }
  ],
  generalAnnouncements: [ { date: "2025-10-25", text: "Welcome to ClubHub! Explore and join your favorite organizations." } ],
  generalEvents: [ { title: "Student Orientation", date: "2025-10-26", description: "Orientation for all new members.", clubId: null } ]
};

/* ========================================================== */
/* DOM Helpers - safe listeners / getEl
/* ========================================================== */
function $(id) { return document.getElementById(id); }
function safeAddListener(elOrId, evt, handler) {
  const el = (typeof elOrId === 'string') ? $(elOrId) : elOrId;
  if (el) el.addEventListener(evt, handler);
}

/* ========================================================== */
/* Initialization
/* ========================================================== */
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
  // restore session if present
  const stored = localStorage.getItem('clubhub_user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id && typeof parsed.id === 'number') {
        const full = database.users.find(u => u.id === parsed.id);
        appState.user = full || parsed;
      } else {
        // synthetic quick account (string id like "qa_handler")
        appState.user = parsed;
      }
    } catch (e) {
      localStorage.removeItem('clubhub_user');
    }
  }

  initTheme();
  renderClubs();
  initCalendar();
  setupEventListeners();
  
  // Initialize browser navigation before rendering app
  initBrowserNavigation();
  renderApp();
});

/* ========================================================== */
/* Authentication & Session Management
/* ========================================================== */
function login() {
  const emailInput = $('login-email');
  const userInput = $('username'); // optional
  const passwordInput = $('login-password') || $('password');

  const identifier = (emailInput && emailInput.value) ? emailInput.value.trim() : (userInput && userInput.value ? userInput.value.trim() : '');
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!identifier || !password) { alert('Please enter both username/email and password.'); return; }

  // If identifier contains @, treat as email and check database users
  if (identifier.includes('@')) {
    const user = database.users.find(u => u.email.toLowerCase() === identifier.toLowerCase() && u.password === password);
    if (!user) { alert('Invalid email or password'); return; }
    appState.user = user;
    try { localStorage.setItem('clubhub_user', JSON.stringify({ id: user.id })); } catch(e){}
    renderApp();
    return;
  }

  // Otherwise treat as username: check quickAccounts first
  const qa = Object.values(quickAccounts).find(a => a.username === identifier && a.password === password);
  if (qa) {
    const synthetic = { id: `qa_${qa.username}`, email: `${qa.username}@local`, role: qa.role, clubs: [] };
    appState.user = synthetic;
    try { localStorage.setItem('clubhub_user', JSON.stringify(synthetic)); } catch(e){}
    renderApp();
    return;
  }

  // fallback: maybe user entered email's local-part as username: try match by prefix of emails
  const maybe = database.users.find(u => u.email.split('@')[0] === identifier && u.password === password);
  if (maybe) {
    appState.user = maybe;
    try { localStorage.setItem('clubhub_user', JSON.stringify({ id: maybe.id })); } catch(e){}
    renderApp();
    return;
  }

  alert('Invalid credentials');
}

function logout() {
  localStorage.removeItem('clubhub_user');
  appState.user = null;
  renderApp();
}

/* ========================================================== */
/* Routing / Page helpers
/* ========================================================== */
function showPage(id, addToHistory = true) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const el = $(id);
  if (el) el.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Add to history if requested
  if (addToHistory) {
    pushToHistory(id);
  }
  
  // Update browser history for proper back/forward button support
  if (addToHistory) {
    const state = { pageId: id, timestamp: Date.now() };
    window.history.pushState(state, '', `#${id}`);
  }
}

function renderApp() {
  // hide nav links
  document.querySelectorAll('.nav-link').forEach(link => link.classList.add('hidden'));

  if (!appState.user) {
    // not logged in -> show login page and hide nav
    showPage('login-page');
    return;
  }

  // Logged in: show nav links
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('hidden'));

  // populate any user role display
  const roleDisplay = $('userRole');
  if (roleDisplay) roleDisplay.textContent = appState.user.role || 'Member';

  // render profile data (so profile page and nav show correct info)
  renderProfile();

  // route to role-based dashboard
  if (appState.user.role === 'Creator') {
    renderCreatorDashboard(); 
    showPage('admin-dashboard'); // Note: Assuming 'admin-dashboard' is used for Creator/Admin roles
  } else if (appState.user.role === 'Admin') {
    renderAdminDashboard(); 
    showPage('ClubLeader-dashboard'); // Note: Assuming 'ClubLeader-dashboard' is the Admin view
  } else {
    renderMemberDashboard(); 
    showPage('member-dashboard');
  }
}

/* ========================================================== */
/* Dashboards & Renderers (Creator / Admin / Member)
   (unchanged function bodies except defensive DOM checks)
   ========================================================== */
function renderCreatorDashboard() {
  const totalClubs = database.clubs.length;
  const totalMembers = database.users.length;
  if ($('total-clubs-count')) $('total-clubs-count').textContent = totalClubs;
  if ($('total-members-count')) $('total-members-count').textContent = totalMembers;
}

function renderAdminDashboard() {
  const adminClub = database.clubs.find(c => c.adminId === appState.user.id);
  const announcementsList = $('admin-announcements-list');
  if (announcementsList) {
    announcementsList.innerHTML = '';
    database.generalAnnouncements.forEach(ann => { const li = document.createElement('li'); li.textContent = `[General] ${ann.text}`; announcementsList.appendChild(li); });
    if (adminClub) {
      $('admin-club-name') && ($('admin-club-name').textContent = `My Club: ${adminClub.name}`);
      $('admin-club-members') && ($('admin-club-members').textContent = adminClub.members.length);
      $('admin-club-events') && ($('admin-club-events').textContent = adminClub.events.length);
      adminClub.announcements.forEach(ann => { const li = document.createElement('li'); li.textContent = `[${adminClub.name}] ${ann.text}`; announcementsList.appendChild(li); });
    } else {
      $('admin-club-name') && ($('admin-club-name').textContent = 'You are not an admin of any club.');
      $('admin-club-members') && ($('admin-club-members').textContent = 'N/A');
      $('admin-club-events') && ($('admin-club-events').textContent = 'N/A');
      if (database.generalAnnouncements.length === 0) announcementsList.innerHTML = '<li>No recent announcements.</li>';
    }
  }
}

function renderMemberDashboard() {
  const memberClubsList = $('member-dashboard-clubs-list');
  const memberEventsList = $('member-events-list');
  const memberAnnouncementsList = $('member-announcements-list');
  if (memberClubsList) memberClubsList.innerHTML = '';
  if (memberEventsList) memberEventsList.innerHTML = '';
  if (memberAnnouncementsList) memberAnnouncementsList.innerHTML = '';

  database.generalAnnouncements.forEach(ann => {
    if (memberAnnouncementsList) { const li = document.createElement('li'); li.textContent = `[General]: ${ann.text}`; memberAnnouncementsList.appendChild(li); }
  });

  const allEvents = [...database.generalEvents];
  const userClubs = database.clubs.filter(club => appState.user.clubs && appState.user.clubs.includes(club.id));

  if (userClubs.length > 0) {
    userClubs.forEach(club => {
      if (memberClubsList) { const liClub = document.createElement('li'); liClub.textContent = club.name; memberClubsList.appendChild(liClub); }
      allEvents.push(...club.events);
      club.announcements.forEach(ann => { if (memberAnnouncementsList) { const liAnn = document.createElement('li'); liAnn.textContent = `${club.name}: ${ann.text}`; memberAnnouncementsList.appendChild(liAnn); } });
    });

    allEvents.sort((a,b) => new Date(a.date) - new Date(b.date));
    allEvents.forEach(event => {
      if (memberEventsList) {
        const liEvent = document.createElement('li');
        const eventOrigin = event.clubId ? (database.clubs.find(c => c.id === event.clubId) || {}).name : 'General';
        liEvent.textContent = `${event.title} (${eventOrigin}) - ${event.date}`;
        memberEventsList.appendChild(liEvent);
      }
    });
  } else {
    if (memberClubsList) memberClubsList.innerHTML = '<li>You are not a member of any clubs.</li>';
    if (memberEventsList) memberEventsList.innerHTML = '<li>No upcoming events.</li>';
    if (database.generalAnnouncements.length === 0 && memberAnnouncementsList) memberAnnouncementsList.innerHTML = '<li>No recent announcements.</li>';
  }
}

/* ========================================================== */
/* Profile and Clubs rendering
/* ========================================================== */
function renderProfile() {
  if (!appState.user) return;
  const user = appState.user;
  const adminClub = database.clubs.find(club => club.adminId === user.id);
  const roleText = (user.role === 'Admin' && adminClub) ? `Role: Admin (${adminClub.name})` : `Role: ${user.role}`;
  $('profile-name') && ($('profile-name').textContent = user.email ? user.email.split('@')[0] : (user.id || 'User'));
  $('profile-email') && ($('profile-email').textContent = user.email || '');
  $('profile-role') && ($('profile-role').textContent = roleText);

  const memberClubsList = $('member-clubs-list');
  if (memberClubsList) {
    memberClubsList.innerHTML = '';
    const userClubs = database.clubs.filter(club => user.clubs && user.clubs.includes(club.id));
    if (userClubs.length > 0) userClubs.forEach(club => { const li = document.createElement('li'); li.textContent = club.name; memberClubsList.appendChild(li); });
    else memberClubsList.innerHTML = '<li>You are not a member of any clubs.</li>';
  }
}

function renderClubs() {
  const clubsGrid = $('clubs-grid') || $('clubsGrid');
  if (!clubsGrid) return;
  clubsGrid.innerHTML = '';
  database.clubs.forEach(club => {
    const card = document.createElement('div');
    card.className = 'card club-card';
    const img = `<img src="${club.image}" alt="${club.name}" class="club-thumb" />`;
    card.innerHTML = `${img}<h3>${club.name}</h3><p>${club.description.substring(0,100)}...</p><button class="view-club-btn" data-id="${club.id}">View Details</button>`;
    clubsGrid.appendChild(card);
  });
}

/* ========================================================== */
/* Open / Join Club modal (fixed to remove hidden when opening)
   ========================================================== */
function openClubModal(clubId) {
  const club = database.clubs.find(c => c.id === parseInt(clubId));
  if (!club) return;
  const modal = $('club-modal');
  if (!modal) return;
  
  // Save current state to modal stack
  modalStack.push({
    type: 'club-modal',
    clubId: clubId,
    scrollPosition: window.scrollY
  });
  
  $('club-modal-title') && ($('club-modal-title').textContent = club.name);
  $('club-modal-image') && ($('club-modal-image').src = club.image);
  $('club-modal-description') && ($('club-modal-description').textContent = club.description);
  const announcementsList = $('club-modal-details');
  if (announcementsList) {
    announcementsList.innerHTML = '<h4>Announcements:</h4>';
    club.announcements.forEach(ann => { const p = document.createElement('p'); p.textContent = `${ann.date}: ${ann.text}`; announcementsList.appendChild(p); });
  }
  const joinBtn = $('join-club-modal');
  const isMember = appState.user && appState.user.clubs && appState.user.clubs.includes(club.id);
  if (joinBtn) {
    if (isMember) { joinBtn.textContent = 'Already a Member'; joinBtn.classList.add('gray'); joinBtn.disabled = true; joinBtn.onclick = null; }
    else { joinBtn.textContent = 'Join Club'; joinBtn.classList.remove('gray'); joinBtn.disabled = false; joinBtn.onclick = () => joinClub(club.id); }
  }
  // remove .hidden and add active so CSS shows modal
  modal.classList.remove('hidden');
  modal.classList.add('active');
}

function closeModalById(modalId) {
  const modal = $(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  modal.classList.add('hidden');
  
  // Restore previous state from modal stack
  if (modalStack.length > 0) {
    const previousState = modalStack.pop();
    if (previousState) {
      // You could restore specific modal state here if needed
      window.scrollTo(0, previousState.scrollPosition);
    }
  }
}

function joinClub(clubId) {
  if (!appState.user) { alert('Please log in to join a club.'); return; }
  const club = database.clubs.find(c => c.id === clubId);
  if (!club) return;
  if (!appState.user.clubs) appState.user.clubs = [];
  if (appState.user.clubs.includes(clubId)) { alert(`You are already a member of the ${club.name}!`); return; }
  appState.user.clubs.push(clubId);
  club.members.push(appState.user.id || appState.user.email || appState.user);
  try { localStorage.setItem('clubhub_user', JSON.stringify(appState.user)); } catch(e) {}
  alert(`Successfully joined the ${club.name}!`);
  closeModalById('club-modal');
  renderProfile(); renderMemberDashboard();
}

/* ========================================================== */
/* Creator: Announcements & Member Management
   (mostly unchanged; modals use .hidden/.active now)
   ========================================================== */
function showAnnouncementModal() {
  const modal = $('announcement-modal');
  if (!modal) return;
  modal.classList.remove('hidden'); modal.classList.add('active');
}

function postAnnouncement() {
  const announcementTextEl = $('announcement-text');
  const announcementText = announcementTextEl ? announcementTextEl.value.trim() : '';
  if (!announcementText) { alert('Please write an announcement.'); return; }
  const newAnnouncement = { date: new Date().toISOString().split('T')[0], text: announcementText };
  database.generalAnnouncements.unshift(newAnnouncement);
  if (announcementTextEl) announcementTextEl.value = '';
  closeModalById('announcement-modal');
  renderApp(); alert('Announcement posted successfully!');
}

function showManageMembersModal() {
  const modal = $('manage-members-modal');
  if (!modal) return;
  modal.classList.remove('hidden'); modal.classList.add('active');
  renderMemberManagementLists();
}

function renderMemberManagementLists() {
  const managementListContainer = $('member-management-list');
  if (!managementListContainer) return;
  managementListContainer.innerHTML = '';
  database.clubs.forEach(club => {
    const clubDiv = document.createElement('div'); clubDiv.classList.add('club-management-section');
    clubDiv.innerHTML = `<h4>${club.name}</h4>`;
    const ul = document.createElement('ul');
    club.members.forEach(memberId => {
      const memberUser = database.users.find(u => u.id === memberId) || { email: memberId };
      const li = document.createElement('li');
      li.innerHTML = `<span>${memberUser.email}</span> <button class="remove-member-btn" data-club-id="${club.id}" data-member-id="${memberUser.id || memberUser.email}">Remove</button> <button class="assign-admin-btn" data-club-id="${club.id}" data-member-id="${memberUser.id || memberUser.email}">Assign as Admin</button>`;
      ul.appendChild(li);
    });
    clubDiv.appendChild(ul);
    managementListContainer.appendChild(clubDiv);
  });

  const unassignedUsers = database.users.filter(user => user.clubs.length === 0 && user.role !== 'Creator');
  const newMemberSelect = $('new-member-select');
  const targetClubSelect = $('target-club-select');
  if (newMemberSelect) newMemberSelect.innerHTML = unassignedUsers.map(user => `<option value="${user.id}">${user.email}</option>`).join('');
  if (targetClubSelect) targetClubSelect.innerHTML = database.clubs.map(club => `<option value="${club.id}">${club.name}</option>`).join('');
}

function handleMemberAction(event) {
  if (event.target.classList.contains('remove-member-btn')) {
    const clubId = parseInt(event.target.dataset.clubId);
    const memberId = isNaN(parseInt(event.target.dataset.memberId)) ? event.target.dataset.memberId : parseInt(event.target.dataset.memberId);
    removeMember(clubId, memberId);
  } else if (event.target.classList.contains('assign-admin-btn')) {
    const clubId = parseInt(event.target.dataset.clubId);
    const memberId = isNaN(parseInt(event.target.dataset.memberId)) ? event.target.dataset.memberId : parseInt(event.target.dataset.memberId);
    assignAdmin(clubId, memberId);
  }
}

function removeMember(clubId, memberId) {
  const club = database.clubs.find(c => c.id === clubId);
  const user = database.users.find(u => u.id === memberId);
  if (club && user) {
    const userClubIdx = user.clubs.indexOf(clubId);
    if (userClubIdx > -1) user.clubs.splice(userClubIdx, 1);
    const memberIndex = club.members.indexOf(memberId);
    if (memberIndex > -1) club.members.splice(memberIndex, 1);
    if (club.adminId === memberId) club.adminId = null;
    user.role = 'Member';
    alert(`User ${user.email} removed from ${club.name}.`);
    renderMemberManagementLists(); renderApp();
  }
}

function assignAdmin(clubId, memberId) {
  const club = database.clubs.find(c => c.id === clubId);
  const user = database.users.find(u => u.id === memberId);
  if (club && user) {
    const currentAdmin = database.users.find(u => u.id === club.adminId);
    if (currentAdmin) currentAdmin.role = 'Member';
    club.adminId = user.id; user.role = 'Admin';
    alert(`User ${user.email} is now the admin of ${club.name}.`);
    renderMemberManagementLists(); renderApp();
  }
}

function addMemberFromSelect() {
  const newMemberSelect = $('new-member-select');
  const targetClubSelect = $('target-club-select');
  if (!newMemberSelect || !targetClubSelect) return;
  const userId = parseInt(newMemberSelect.value);
  const clubId = parseInt(targetClubSelect.value);
  const user = database.users.find(u => u.id === userId);
  const club = database.clubs.find(c => c.id === clubId);
  if (user && club) {
    user.clubs.push(clubId); club.members.push(userId);
    alert(`User ${user.email} added to ${club.name}.`); renderMemberManagementLists(); renderApp();
  }
}

/* ========================================================== */
/* Calendar functions
/* ========================================================== */
function initCalendar() { renderCalendar(currentMonth, currentYear); }

function renderCalendar(month = currentMonth, year = currentYear) {
  const calendarBody = $('calendar-body');
  const monthYearSpan = $('month-year');
  if (!calendarBody || !monthYearSpan) return;
  calendarBody.innerHTML = '';
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = 32 - new Date(year, month, 32).getDate();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthYearSpan.textContent = `${monthNames[month]} ${year}`;
  const allEvents = [...database.generalEvents];
  database.clubs.forEach(c => allEvents.push(...c.events));
  let date = 1;
  for (let i = 0; i < 6; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement('td');
      if (i === 0 && j < firstDay) { row.appendChild(cell); continue; }
      if (date > daysInMonth) { row.appendChild(cell); continue; }
      cell.textContent = date;
      const currentDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
      if (date === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) cell.classList.add('today');
      const dayEvents = allEvents.filter(event => event.date === currentDate);
      if (dayEvents.length > 0) {
        const eventIcon = document.createElement('span');
        eventIcon.textContent = ' •';
        eventIcon.title = dayEvents.map(e => e.title).join('\n');
        cell.appendChild(eventIcon);
      }
      row.appendChild(cell);
      date++;
    }
    calendarBody.appendChild(row);
  }
}

/* ========================================================== */
/* Creator Event Submission
/* ========================================================== */
function showEventModal() {
  const modal = $('event-modal');
  if (!modal) return;
  // populate club select (including general)
  const eventClubSelect = $('event-club-select');
  if (eventClubSelect) {
    eventClubSelect.innerHTML = `<option value="general">General</option>` + database.clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  modal.classList.remove('hidden'); modal.classList.add('active');
}

function postEvent() {
  const eventTitle = $('event-title') ? $('event-title').value.trim() : '';
  const eventDate = $('event-date') ? $('event-date').value.trim() : '';
  const eventDescription = $('event-description') ? $('event-description').value.trim() : '';
  const eventClubSelect = $('event-club-select');
  const eventClubId = eventClubSelect ? eventClubSelect.value : 'general';
  if (!eventTitle || !eventDate || !eventDescription) { alert('Please fill in all event details.'); return; }
  const newEvent = { title: eventTitle, date: eventDate, description: eventDescription, clubId: eventClubId === 'general' ? null : parseInt(eventClubId) };
  if (newEvent.clubId === null) database.generalEvents.push(newEvent); else { const club = database.clubs.find(c => c.id === newEvent.clubId); if (club) club.events.push(newEvent); }
  closeModalById('event-modal');
  $('event-form') && $('event-form').reset();
  renderApp(); renderCalendar(currentMonth, currentYear); alert('Event posted successfully!');
}

/* ========================================================== */
/* Theme (dark/light) - FIXED
/* ========================================================== */
// ===== THEME (Dark/Light) =====
function initTheme() {
  const saved = localStorage.getItem('clubhub_theme') || 'dark';
  if (saved === 'light') document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
  updateThemeIcons(saved);
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const newTheme = isLight ? 'light' : 'dark';
  localStorage.setItem('clubhub_theme', newTheme);
  updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
    const moon = document.querySelector('.moon-icon');
    const sun = document.querySelector('.sun-icon');
    const toggleBtn = document.getElementById('mode-toggle');

    if (!moon || !sun || !toggleBtn) return;

    if (theme === 'light') {
        // Light mode is active: Show the MOON (user clicks to switch to dark)
        moon.style.display = 'inline';
        sun.style.display = 'none';
        toggleBtn.setAttribute('aria-label', 'Toggle Dark Mode');
    } else {
        // Dark mode is active: Show the SUN (user clicks to switch to light)
        moon.style.display = 'none';
        sun.style.display = 'inline';
        toggleBtn.setAttribute('aria-label', 'Toggle Light Mode');
    }
}


/* ========================================================== */
/* Payments (simple stub - GCASH ONLY)
/* ========================================================== */
// Note: setupPaymentFields() was removed in a previous step.

function processPayment() {
  const amountEl = $('payment-amount');
  const amount = amountEl ? amountEl.value : '';
  
  if (!amount || amount === '0.00') { 
    alert('Invalid payment amount.'); 
    return; 
  }
  
  // Since it's GCash QR, the user confirms they paid after scanning.
  alert(`Confirming payment of $${amount} via GCASH. Please await verification.`);
  showPage('member-dashboard'); // Redirect after confirmation
}

/* ========================================================== */
/* Centralized Event Listeners (defensive)
   - attaches to unique header IDs, mobile toggle, login form and delegates
   ========================================================== */
function setupEventListeners() {
  // Initialize browser navigation
  initBrowserNavigation();
  
  // Login - form submit
  const loginForm = $('login-form');
  if (loginForm) loginForm.addEventListener('submit', (ev) => { ev.preventDefault(); login(); });

  // login button (secondary)
  safeAddListener('login-btn', 'click', (e) => { e.preventDefault && e.preventDefault(); login(); });

  // header nav actions
  safeAddListener('dashboard-btn', 'click', () => renderApp());
  safeAddListener('clubs-btn', 'click', () => { renderClubs(); showPage('clubs'); });
  safeAddListener('profile-btn', 'click', () => { renderProfile(); showPage('profile'); });

  // login-hub buttons (unique IDs)
  safeAddListener('login-goto-dashboard', 'click', () => renderApp());
  safeAddListener('login-view-clubs', 'click', () => { renderClubs(); showPage('clubs'); });
  safeAddListener('login-view-profile', 'click', () => { renderProfile(); showPage('profile'); });

  // mobile nav copies
  safeAddListener('mobile-dashboard-btn', 'click', () => { renderApp(); toggleMobileMenu(false); });
  safeAddListener('mobile-clubs-btn', 'click', () => { renderClubs(); showPage('clubs'); toggleMobileMenu(false); });
  safeAddListener('mobile-profile-btn', 'click', () => { renderProfile(); showPage('profile'); toggleMobileMenu(false); });

  // mobile menu toggle
  safeAddListener('mobile-menu-btn', 'click', () => {
    const mobileMenu = $('mobile-menu');
    if (!mobileMenu) return;
    const expanded = mobileMenu.classList.contains('hidden') ? 'true' : 'false';
    toggleMobileMenu(mobileMenu.classList.contains('hidden'));
  });

  function toggleMobileMenu(open) {
    const mobileMenu = $('mobile-menu-nav');
    const mobileBtn = $('mobile-menu-btn');
    if (!mobileMenu || !mobileBtn) return;
    if (open) {
      mobileMenu.classList.remove('hidden');
      mobileMenu.setAttribute('aria-hidden', 'false');
      mobileBtn.setAttribute('aria-expanded', 'true');
    } else {
      mobileMenu.classList.add('hidden');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileBtn.setAttribute('aria-expanded', 'false');
    }
  }

  // theme toggle
  safeAddListener('theme-toggle-btn', 'click', () => toggleTheme());

  // logout: attach to ALL elements with class .logout-btn (defensive)
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault && e.preventDefault(); logout(); });
  });

  // club view buttons
  safeAddListener('creator-view-clubs', 'click', () => { renderClubs(); showPage('clubs'); });
  safeAddListener('member-view-clubs', 'click', () => { renderClubs(); showPage('clubs'); });

  // Add back button functionality to modals
  safeAddListener('close-club-modal', 'click', () => { 
    closeModalById('club-modal'); 
    // Restore scroll position if needed
    restoreScrollPosition();
  });
  
  safeAddListener('close-announcement-modal', 'click', () => { 
    closeModalById('announcement-modal'); 
    restoreScrollPosition();
  });
  
  safeAddListener('close-manage-members-modal', 'click', () => { 
    closeModalById('manage-members-modal'); 
    restoreScrollPosition();
  });
  
  safeAddListener('cancel-club-btn', 'click', () => { 
    closeModalById('add-club-modal'); 
    restoreScrollPosition();
  });

  // delegation for a bunch of in-page clicks (view club, modal buttons, calendar nav, member management)
  document.addEventListener('click', (event) => {
    const target = event.target;

    // view club tiles
    if (target.classList && target.classList.contains('view-club-btn')) {
      openClubModal(target.dataset.id);
      return;
    }

    // modal close (IDs)
    if (target.id === 'close-club-modal') closeModalById('club-modal');
    if (target.id === 'close-announcement-modal') closeModalById('announcement-modal');
    if (target.id === 'close-manage-members-modal') closeModalById('manage-members-modal');

    // announcement modal
    if (target.id === 'post-announcement-btn') showAnnouncementModal();
    if (target.id === 'submit-announcement-btn') postAnnouncement();

    // calendar open
    if (target.id === 'open-calendar') { showPage('calendar-page'); renderCalendar(currentMonth, currentYear); }

    // calendar navigation (use robust month/year updates)
    if (target.id === 'prev-month') {
      if (currentMonth === 0) { currentMonth = 11; currentYear -= 1; } else { currentMonth -= 1; }
      renderCalendar(currentMonth, currentYear);
    }
    if (target.id === 'next-month') {
      if (currentMonth === 11) { currentMonth = 0; currentYear += 1; } else { currentMonth += 1; }
      renderCalendar(currentMonth, currentYear);
    }

    // member management buttons (delegated)
    if (target && target.classList && (target.classList.contains('remove-member-btn') || target.classList.contains('assign-admin-btn'))) {
      handleMemberAction({ target });
    }

    if (target && target.id === 'add-member-btn') addMemberFromSelect();

    // payments page navigation
    if (target && target.id === 'payment-btn') showPage('payment-page');
    if (target && target.id === 'process-payment-btn') processPayment();
    if (target && target.id === 'cancel-payment-btn') showPage('member-dashboard');

    // manage-members modal
    if (target && target.id === 'creator-manage-members-btn') showManageMembersModal();

    // event modal controls
    if (target && target.id === 'create-club-btn') showAddClubModal();
    if (target && target.id === 'create-event-btn') showEventModal();
    if (target && target.id === 'post-event-btn') postEvent();
    if (target && target.id === 'cancel-event-btn') closeModalById('event-modal');
    
    // add club modal controls
    if (target && target.id === 'submit-club-btn') createNewClub();
    if (target && target.id === 'cancel-club-btn') closeModalById('add-club-modal');
  });

  // event form submit
  const eventForm = $('event-form'); if (eventForm) eventForm.addEventListener('submit', (ev) => { ev.preventDefault(); postEvent(); });

  // member management list click
  const mList = $('member-management-list'); if (mList) mList.addEventListener('click', handleMemberAction);
  
  // add club form submit
  const addClubForm = $('add-club-form'); if (addClubForm) addClubForm.addEventListener('submit', (ev) => { ev.preventDefault(); createNewClub(); });
}

/* ========================================================== */
/* Scroll Position Restoration
/* ========================================================== */
const scrollPositions = new Map();

function saveScrollPosition(pageId) {
  scrollPositions.set(pageId, window.scrollY);
}

function restoreScrollPosition() {
  const currentPage = pageHistory[currentPageIndex];
  if (currentPage && scrollPositions.has(currentPage)) {
    window.scrollTo(0, scrollPositions.get(currentPage));
  }
}

// Update showPage to save scroll positions
const originalShowPage = showPage;
showPage = function(id, addToHistory = true) {
  // Save current page's scroll position before navigating
  if (currentPageIndex >= 0) {
    const currentPage = pageHistory[currentPageIndex];
    if (currentPage) {
      saveScrollPosition(currentPage);
    }
  }
  
  originalShowPage(id, addToHistory);
};

/* ========================================================== */
/* Modal State Restoration
/* ========================================================== */
let modalStack = [];

// The openClubModal function is already updated above.

// The closeModalById function is already updated above.

/* ========================================================== */
/* Keyboard Shortcuts for Navigation
/* ========================================================== */
document.addEventListener('keydown', (event) => {
  // Alt + Left Arrow for back navigation
  if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault();
    navigateBack();
  }
  
  // Alt + Right Arrow for forward navigation
  if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault();
    navigateForward();
  }
  
  // Escape key to close modals
  if (event.key === 'Escape') {
    const openModals = document.querySelectorAll('.modal.active');
    if (openModals.length > 0) {
      closeModalById(openModals[0].id);
    }
  }
});

/* ========================================================== */
/* History Management & Page Restoration (restored below renderApp)
/* ========================================================== */
const pageHistory = [];
let currentPageIndex = -1;

function pushToHistory(pageId) {
  // Remove any future pages if we're navigating back and then forward
  if (currentPageIndex < pageHistory.length - 1) {
    pageHistory.splice(currentPageIndex + 1);
  }
  
  // Add new page to history
  pageHistory.push(pageId);
  currentPageIndex = pageHistory.length - 1;
  
  // Limit history size to prevent memory issues
  if (pageHistory.length > 50) {
    pageHistory.shift();
    currentPageIndex--;
  }
}

function navigateBack() {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    const previousPage = pageHistory[currentPageIndex];
    showPage(previousPage, false); // false means don't add to history
    return true;
  }
  return false;
}

function navigateForward() {
  if (currentPageIndex < pageHistory.length - 1) {
    currentPageIndex++;
    const nextPage = pageHistory[currentPageIndex];
    showPage(nextPage, false);
    return true;
  }
  return false;
}

/* ========================================================== */
/* Browser Back/Forward Button Support
/* ========================================================== */
function initBrowserNavigation() {
  // Handle browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.pageId) {
      showPage(event.state.pageId, false);
    } else {
      // Fallback: try to navigate using our internal history
      const hash = window.location.hash.substring(1);
      if (hash && $(hash)) {
        showPage(hash, false);
      }
    }
  });
  
  // Handle page load with hash
  window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    if (hash && $(hash)) {
      showPage(hash, true);
    }
  });
}

/* ========================================================== */
/* Done - helper: print test credentials to console for convenience
/* ========================================================== */
console.info('Test quick accounts: handler/handler123 (Creator), leader/leader123 (Admin), member/member123 (Member)');
console.info('Database emails: creator@example.com / 123, admin@example.com / 123, member@example.com / 123');
