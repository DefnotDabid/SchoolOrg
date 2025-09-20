/* ========================================================== */
/* 💻 App State and Dummy Database */
/* ========================================================== */

const appState = {
    user: null,
};

const database = {
    users: [
        { id: 1, email: "creator@example.com", password: "123", role: "Creator", clubs: [] },
        { id: 2, email: "admin@example.com", password: "123", role: "Admin", clubs: [1], adminOf: 1 },
        { id: 3, email: "member@example.com", password: "123", role: "Member", clubs: [2] },
        { id: 4, email: "mary@example.com", password: "123", role: "Member", clubs: [1, 2] },
        { id: 5, email: "john@example.com", password: "123", role: "Member", clubs: [] }
    ],
    clubs: [
        {
            id: 1,
            name: "Robotics Club",
            image: "assets/robotics.jpg",
            description: "Building the future, one robot at a time. The Robotics Club offers hands-on experience in engineering, programming, and design, culminating in exciting competitions.",
            members: [2, 4], // User IDs
            adminId: 2, // User ID of the admin
            announcements: [
                { date: "2025-10-20", text: "New meeting this Friday at 4 PM in Lab C." },
                { date: "2025-10-18", text: "Mandatory practice session this Saturday at 10 AM." },
            ],
            events: [
                { title: "Robotics Competition", date: "2025-11-15", description: "Our annual competition. All are welcome!", clubId: 1 },
            ],
        },
        {
            id: 2,
            name: "Art Guild",
            image: "assets/art.jpg",
            description: "A community for creative expression and artistic exploration. The Art Guild hosts workshops, gallery visits, and showcases for artists of all skill levels.",
            members: [3, 4],
            adminId: 3, // User ID of the admin
            announcements: [
                { date: "2025-10-18", text: "Portfolio review session next Tuesday." },
                { date: "2025-10-15", text: "Guest artist lecture on Friday." },
            ],
            events: [
                { title: "Art Exhibit", date: "2025-11-20", description: "Showcasing the work of our talented members.", clubId: 2 },
            ],
        },
        {
            id: 3,
            name: "Photography Club",
            image: "assets/photography.jpg",
            description: "Capturing moments and mastering the art of light and shadow. The Photography Club organizes photo walks, editing workshops, and exhibitions.",
            members: [],
            adminId: null, // No admin yet
            announcements: [],
            events: [],
        },
    ],
    generalAnnouncements: [
        { date: "2025-10-25", text: "Welcome to ClubHub! Explore and join your favorite organizations." },
    ],
    generalEvents: [
        { title: "Student Orientation", date: "2025-10-26", description: "Orientation for all new members.", clubId: null },
    ],
};

/* ========================================================== */
/* 🚀 Application Initialization */
/* ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const storedUser = localStorage.getItem("clubhub_user");
    if (storedUser) {
        appState.user = JSON.parse(storedUser);
        const fullUser = database.users.find(u => u.id === appState.user.id);
        if (fullUser) {
            appState.user = fullUser;
        } else {
            localStorage.removeItem("clubhub_user");
            appState.user = null;
        }
        renderApp();
    } else {
        showPage("login-page");
    }

    setupEventListeners();
    renderClubs();
    initTheme();
    initCalendar();
});

/* ========================================================== */
/* 🔐 Authentication and Session Management */
/* ========================================================== */

function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    const user = database.users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert("Invalid email or password!");
        return;
    }

    appState.user = user;
    localStorage.setItem("clubhub_user", JSON.stringify(user));

    renderApp();
}

function logout() {
    localStorage.removeItem("clubhub_user");
    appState.user = null;
    showPage("login-page");
}

/* ========================================================== */
/* 🌐 Routing and Page Rendering */
/* ========================================================== */

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(pageId).classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderApp() {
    if (!appState.user) {
        showPage("login-page");
        document.querySelectorAll(".nav-link").forEach(link => link.classList.add("hidden"));
        return;
    }

    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("hidden"));

    if (appState.user.role === "Creator") {
        renderCreatorDashboard();
        showPage("creator-dashboard");
    } else if (appState.user.role === "Admin") {
        renderAdminDashboard();
        showPage("admin-dashboard");
    } else {
        renderMemberDashboard();
        showPage("member-dashboard");
    }
}

/* ========================================================== */
/* 📚 Dashboard-Specific Rendering */
/* ========================================================== */

function renderCreatorDashboard() {
    const totalClubs = database.clubs.length;
    const totalMembers = database.users.length;
    document.getElementById("total-clubs-count").textContent = totalClubs;
    document.getElementById("total-members-count").textContent = totalMembers;
}

function renderAdminDashboard() {
    const adminClub = database.clubs.find(club => club.adminId === appState.user.id);
    const announcementsList = document.getElementById("admin-announcements-list");
    announcementsList.innerHTML = "";

    database.generalAnnouncements.forEach(ann => {
        const li = document.createElement("li");
        li.textContent = `[General] ${ann.text}`;
        announcementsList.appendChild(li);
    });

    if (adminClub) {
        document.getElementById("admin-club-name").textContent = `My Club: ${adminClub.name}`;
        document.getElementById("admin-club-members").textContent = adminClub.members.length;
        document.getElementById("admin-club-events").textContent = adminClub.events.length;
        adminClub.announcements.forEach(ann => {
            const li = document.createElement("li");
            li.textContent = `[${adminClub.name}] ${ann.text}`;
            announcementsList.appendChild(li);
        });
    } else {
        document.getElementById("admin-club-name").textContent = "You are not an admin of any club.";
        document.getElementById("admin-club-members").textContent = "N/A";
        document.getElementById("admin-club-events").textContent = "N/A";
        if (database.generalAnnouncements.length === 0) {
            announcementsList.innerHTML = "<li>No recent announcements.</li>";
        }
    }
}

function renderMemberDashboard() {
    const memberClubsList = document.getElementById("member-dashboard-clubs-list");
    const memberEventsList = document.getElementById("member-events-list");
    const memberAnnouncementsList = document.getElementById("member-announcements-list");

    memberClubsList.innerHTML = "";
    memberEventsList.innerHTML = "";
    memberAnnouncementsList.innerHTML = "";

    database.generalAnnouncements.forEach(ann => {
        const liAnn = document.createElement("li");
        liAnn.textContent = `[General]: ${ann.text}`;
        memberAnnouncementsList.appendChild(liAnn);
    });

    const allEvents = [...database.generalEvents];
    const userClubs = database.clubs.filter(club => appState.user.clubs.includes(club.id));

    if (userClubs.length > 0) {
        userClubs.forEach(club => {
            const liClub = document.createElement("li");
            liClub.textContent = club.name;
            memberClubsList.appendChild(liClub);

            allEvents.push(...club.events);
            club.announcements.forEach(ann => {
                const liAnn = document.createElement("li");
                liAnn.textContent = `${club.name}: ${ann.text}`;
                memberAnnouncementsList.appendChild(liAnn);
            });
        });

        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        allEvents.forEach(event => {
            const liEvent = document.createElement("li");
            const eventOrigin = event.clubId ? database.clubs.find(c => c.id === event.clubId).name : 'General';
            liEvent.textContent = `${event.title} (${eventOrigin}) - ${event.date}`;
            memberEventsList.appendChild(liEvent);
        });

    } else {
        memberClubsList.innerHTML = "<li>You are not a member of any clubs.</li>";
        memberEventsList.innerHTML = "<li>No upcoming events.</li>";
        if (database.generalAnnouncements.length === 0) {
            memberAnnouncementsList.innerHTML = "<li>No recent announcements.</li>";
        }
    }
}

function renderProfile() {
    if (!appState.user) return;
    const user = appState.user;
    const adminClub = database.clubs.find(club => club.adminId === user.id);
    const roleText = user.role === 'Admin' && adminClub ? `Role: Admin (${adminClub.name})` : `Role: ${user.role}`;

    document.getElementById("profile-name").textContent = user.email.split("@")[0];
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-role").textContent = roleText;

    const memberClubsList = document.getElementById("member-clubs-list");
    memberClubsList.innerHTML = "";

    const userClubs = database.clubs.filter(club => user.clubs.includes(club.id));
    if (userClubs.length > 0) {
        userClubs.forEach(club => {
            const li = document.createElement("li");
            li.textContent = club.name;
            memberClubsList.appendChild(li);
        });
    } else {
        memberClubsList.innerHTML = "<li>You are not a member of any clubs.</li>";
    }
}

function renderClubs() {
    const clubsGrid = document.getElementById("clubs-grid");
    clubsGrid.innerHTML = "";

    database.clubs.forEach(club => {
        const card = document.createElement("div");
        card.className = "card club-card";
        card.innerHTML = `
        <img src="${club.image}" alt="${club.name}">
        <h3>${club.name}</h3>
        <p>${club.description.substring(0, 100)}...</p>
        <button class="view-club-btn" data-id="${club.id}">View Details</button>
      `;
        clubsGrid.appendChild(card);
    });
}

function openClubModal(clubId) {
    const club = database.clubs.find(c => c.id === parseInt(clubId));
    if (!club) return;

    const modal = document.getElementById("club-modal");
    document.getElementById("club-modal-title").textContent = club.name;
    document.getElementById("club-modal-image").src = club.image;
    document.getElementById("club-modal-description").textContent = club.description;

    const announcementsList = document.getElementById("club-modal-details");
    announcementsList.innerHTML = "<h4>Announcements:</h4>";
    club.announcements.forEach(ann => {
        const p = document.createElement("p");
        p.textContent = `${ann.date}: ${ann.text}`;
        announcementsList.appendChild(p);
    });

    const joinBtn = document.getElementById("join-club-modal");
    const isMember = appState.user && appState.user.clubs.includes(club.id);

    if (isMember) {
        joinBtn.textContent = "Already a Member";
        joinBtn.classList.add("gray");
        joinBtn.disabled = true;
    } else {
        joinBtn.textContent = "Join Club";
        joinBtn.classList.remove("gray");
        joinBtn.disabled = false;
        joinBtn.onclick = () => joinClub(club.id);
    }

    modal.classList.add("active");
}

function joinClub(clubId) {
    if (!appState.user) {
        alert("Please log in to join a club.");
        return;
    }
    const club = database.clubs.find(c => c.id === clubId);
    if (!club) return;

    if (appState.user.clubs.includes(clubId)) {
        alert(`You are already a member of the ${club.name}!`);
    } else {
        appState.user.clubs.push(clubId);
        club.members.push(appState.user.id);
        localStorage.setItem("clubhub_user", JSON.stringify(appState.user));
        alert(`Successfully joined the ${club.name}!`);
        document.getElementById("club-modal").classList.remove("active");
        renderProfile();
        renderMemberDashboard();
    }
}

/* ========================================================== */
/* 🆕 Creator Announcements */
/* ========================================================== */

function showAnnouncementModal() {
    document.getElementById("announcement-modal").classList.add("active");
}

function postAnnouncement() {
    const announcementText = document.getElementById("announcement-text").value;
    if (!announcementText) {
        alert("Please write an announcement.");
        return;
    }

    const newAnnouncement = {
        date: new Date().toISOString().split('T')[0],
        text: announcementText
    };

    database.generalAnnouncements.unshift(newAnnouncement);

    document.getElementById("announcement-text").value = "";
    document.getElementById("announcement-modal").classList.remove("active");

    renderApp();
    alert("Announcement posted successfully!");
}

/* ========================================================== */
/* 🆕 Creator Member Management */
/* ========================================================== */
function showManageMembersModal() {
    const modal = document.getElementById("manage-members-modal");
    modal.classList.add("active");
    renderMemberManagementLists();
}

function renderMemberManagementLists() {
    const managementListContainer = document.getElementById("member-management-list");
    managementListContainer.innerHTML = '';
    
    // Render list of members in each club with remove/assign buttons
    database.clubs.forEach(club => {
        const clubDiv = document.createElement('div');
        clubDiv.classList.add('club-management-section');
        clubDiv.innerHTML = `<h4>${club.name}</h4>`;
        
        const ul = document.createElement('ul');
        club.members.forEach(memberId => {
            const memberUser = database.users.find(u => u.id === memberId);
            if (memberUser) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${memberUser.email}</span>
                    <button class="remove-member-btn" data-club-id="${club.id}" data-member-id="${memberUser.id}">Remove</button>
                    <button class="assign-admin-btn" data-club-id="${club.id}" data-member-id="${memberUser.id}">Assign as Admin</button>
                `;
                ul.appendChild(li);
            }
        });
        clubDiv.appendChild(ul);
        managementListContainer.appendChild(clubDiv);
    });

    // Render list of users who are not in any club, with add buttons
    const unassignedUsers = database.users.filter(user => user.clubs.length === 0 && user.role !== 'Creator');
    const newMemberSelect = document.getElementById('new-member-select');
    const targetClubSelect = document.getElementById('target-club-select');

    newMemberSelect.innerHTML = unassignedUsers.map(user => `<option value="${user.id}">${user.email}</option>`).join('');
    targetClubSelect.innerHTML = database.clubs.map(club => `<option value="${club.id}">${club.name}</option>`).join('');
}

function handleMemberAction(event) {
    if (event.target.classList.contains('remove-member-btn')) {
        const clubId = parseInt(event.target.dataset.clubId);
        const memberId = parseInt(event.target.dataset.memberId);
        removeMember(clubId, memberId);
    } else if (event.target.classList.contains('assign-admin-btn')) {
        const clubId = parseInt(event.target.dataset.clubId);
        const memberId = parseInt(event.target.dataset.memberId);
        assignAdmin(clubId, memberId);
    }
}

function removeMember(clubId, memberId) {
    const club = database.clubs.find(c => c.id === clubId);
    const user = database.users.find(u => u.id === memberId);

    if (club && user) {
        const clubIndex = user.clubs.indexOf(clubId);
        if (clubIndex > -1) {
            user.clubs.splice(clubIndex, 1);
        }
        const memberIndex = club.members.indexOf(memberId);
        if (memberIndex > -1) {
            club.members.splice(memberIndex, 1);
        }
        if (club.adminId === memberId) {
            club.adminId = null;
        }
        user.role = 'Member';
        alert(`User ${user.email} removed from ${club.name}.`);
        renderMemberManagementLists();
        renderApp();
    }
}

function assignAdmin(clubId, memberId) {
    const club = database.clubs.find(c => c.id === clubId);
    const user = database.users.find(u => u.id === memberId);
    
    if (club && user) {
        const currentAdmin = database.users.find(u => u.id === club.adminId);
        if (currentAdmin) {
            currentAdmin.role = 'Member';
        }
        club.adminId = user.id;
        user.role = 'Admin';
        
        alert(`User ${user.email} is now the admin of ${club.name}.`);
        renderMemberManagementLists();
        renderApp();
    }
}

function addMemberFromSelect() {
    const userId = parseInt(document.getElementById('new-member-select').value);
    const clubId = parseInt(document.getElementById('target-club-select').value);

    const user = database.users.find(u => u.id === userId);
    const club = database.clubs.find(c => c.id === clubId);

    if (user && club) {
        user.clubs.push(clubId);
        club.members.push(userId);
        alert(`User ${user.email} added to ${club.name}.`);
        renderMemberManagementLists();
        renderApp();
    }
}

/* ========================================================== */
/* 📅 Calendar Functionality */
/* ========================================================== */

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function initCalendar() {
    renderCalendar(currentMonth, currentYear);
}

function renderCalendar(month, year) {
    const calendarBody = document.getElementById("calendar-body");
    const monthYearSpan = document.getElementById("month-year");
    calendarBody.innerHTML = "";

    const firstDay = (new Date(year, month)).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    monthYearSpan.textContent = `${monthNames[month]} ${year}`;

    const allEvents = [...database.generalEvents];
    database.clubs.forEach(club => {
        allEvents.push(...club.events);
    });

    let date = 1;
    for (let i = 0; i < 6; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                let cell = document.createElement("td");
                row.appendChild(cell);
            } else if (date > daysInMonth) {
                break;
            } else {
                let cell = document.createElement("td");
                cell.textContent = date;
                const currentDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                
                if (date === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) {
                    cell.classList.add("today");
                }

                const dayEvents = allEvents.filter(event => event.date === currentDate);
                if (dayEvents.length > 0) {
                    const eventIcon = document.createElement("span");
                    eventIcon.textContent = " •";
                    eventIcon.style.color = "var(--green)";
                    eventIcon.title = dayEvents.map(e => e.title).join('\n');
                    cell.appendChild(eventIcon);
                }

                row.appendChild(cell);
                date++;
            }
        }
        calendarBody.appendChild(row);
    }
}

/* ========================================================== */
/* 🆕 Creator Event Submission */
/* ========================================================== */
function showEventModal() {
    const clubSelect = document.getElementById("event-club-select");
    clubSelect.innerHTML = "<option value='general'>General</option>";
    database.clubs.forEach(club => {
        const option = document.createElement("option");
        option.value = club.id;
        option.textContent = club.name;
        clubSelect.appendChild(option);
    });
    document.getElementById("event-modal").classList.add("active");
}

function postEvent() {
    const eventTitle = document.getElementById("event-title").value;
    const eventDate = document.getElementById("event-date").value;
    const eventDescription = document.getElementById("event-description").value;
    const eventClubId = document.getElementById("event-club-select").value;

    if (!eventTitle || !eventDate || !eventDescription) {
        alert("Please fill in all event details.");
        return;
    }

    const newEvent = {
        title: eventTitle,
        date: eventDate,
        description: eventDescription,
        clubId: eventClubId === 'general' ? null : parseInt(eventClubId),
    };

    if (newEvent.clubId === null) {
        database.generalEvents.push(newEvent);
    } else {
        const club = database.clubs.find(c => c.id === newEvent.clubId);
        if (club) {
            club.events.push(newEvent);
        }
    }

    document.getElementById("event-modal").classList.remove("active");
    document.getElementById("event-form").reset();
    renderApp();
    renderCalendar(currentMonth, currentYear);
    alert("Event posted successfully!");
}

/* ========================================================== */
/* 🌙 Dark Mode Functionality */
/* ========================================================== */
function initTheme() {
    const body = document.body;
    const themeToggleBtn = document.getElementById("theme-toggle-btn");

    const saveThemePreference = (theme) => {
        localStorage.setItem("clubhub_theme", theme);
    };

    const applyTheme = (theme) => {
        if (theme === "light") {
            body.classList.add("light-mode");
            document.querySelector('.light-mode-icon').classList.remove('hidden');
            document.querySelector('.dark-mode-icon').classList.add('hidden');
        } else {
            body.classList.remove("light-mode");
            document.querySelector('.light-mode-icon').classList.add('hidden');
            document.querySelector('.dark-mode-icon').classList.remove('hidden');
        }
    };

    const savedTheme = localStorage.getItem("clubhub_theme") || "dark";
    applyTheme(savedTheme);
}

/* ========================================================== */
/* 💸 Payment Functionality */
/* ========================================================== */

function setupPaymentFields() {
    const paymentMethodSelect = document.getElementById("payment-method");
    const cardFields = document.getElementById("card-fields");
    const gcashFields = document.getElementById("gcash-fields");
    const paypalFields = document.getElementById("paypal-fields");
    const paymayaFields = document.getElementById("paymaya-fields");

    paymentMethodSelect.addEventListener("change", function () {
        const method = this.value;
        cardFields.classList.toggle("hidden", method !== "card");
        gcashFields.classList.toggle("hidden", method !== "gcash");
        paypalFields.classList.toggle("hidden", method !== "paypal");
        paymayaFields.classList.toggle("hidden", method !== "paymaya");
    });
}

function processPayment() {
    const method = document.getElementById("payment-method").value;
    const amount = document.getElementById("payment-amount").value;

    if (method === "card") {
        const cardNumber = document.getElementById("card-number").value;
        const expiryDate = document.getElementById("expiry-date").value;
        const cvv = document.getElementById("cvv").value;
        if (!cardNumber || !expiryDate || !cvv) {
            alert("Please fill in all card details.");
            return;
        }
    } else if (method === "gcash") {
        const gcashNumber = document.getElementById("gcash-number").value;
        if (!gcashNumber) {
            alert("Please enter your GCash number.");
            return;
        }
    } else if (method === "paypal") {
        const paypalEmail = document.getElementById("paypal-email").value;
        if (!paypalEmail) {
            alert("Please enter your PayPal email.");
            return;
        }
    } else if (method === "paymaya") {
        const paymayaNumber = document.getElementById("paymaya-number").value;
        if (!paymayaNumber) {
            alert("Please enter your PayMaya number.");
            return;
        }
    }

    alert(`Payment of $${amount} via ${method.toUpperCase()} successful!`);
    renderApp();
}

/* ========================================================== */
/* 🧩 Centralized Event Listeners */
/* ========================================================== */

function setupEventListeners() {
    // Navigation and Logout
    document.getElementById("login-btn").addEventListener("click", login);
    document.getElementById("dashboard-btn").addEventListener("click", renderApp);
    document.getElementById("mobile-dashboard-btn").addEventListener("click", renderApp);
    document.querySelectorAll(".logout-btn").forEach(btn => btn.addEventListener("click", logout));
    document.getElementById("clubs-btn").addEventListener("click", () => showPage("clubs"));
    document.getElementById("mobile-clubs-btn").addEventListener("click", () => showPage("clubs"));
    document.getElementById("profile-btn").addEventListener("click", () => {
        renderProfile();
        showPage("profile");
    });
    document.getElementById("mobile-profile-btn").addEventListener("click", () => {
        renderProfile();
        showPage("profile");
    });

    // Mobile menu toggle
    document.getElementById("mobile-menu-btn").addEventListener("click", () => {
        document.getElementById("mobile-menu").classList.toggle("active");
    });

    // View clubs buttons
    document.getElementById("creator-view-clubs").addEventListener("click", () => showPage("clubs"));
    document.getElementById("member-view-clubs").addEventListener("click", () => showPage("clubs"));

    // Club modal
    document.addEventListener("click", (event) => {
        if (event.target.classList.contains("view-club-btn")) {
            openClubModal(event.target.dataset.id);
        }
    });
    document.getElementById("close-club-modal").addEventListener("click", () => {
        document.getElementById("club-modal").classList.remove("active");
    });

    // Payment buttons
    document.getElementById("payment-btn").addEventListener("click", () => showPage("payment-page"));
    document.getElementById("process-payment-btn").addEventListener("click", processPayment);
    document.getElementById("cancel-payment-btn").addEventListener("click", () => showPage("member-dashboard"));
    setupPaymentFields();

    // Announcements & Events
    document.getElementById("post-announcement-btn").addEventListener("click", showAnnouncementModal);
    document.getElementById("submit-announcement-btn").addEventListener("click", postAnnouncement);
    document.getElementById("close-announcement-modal").addEventListener("click", () => {
        document.getElementById("announcement-modal").classList.remove("active");
    });
    document.getElementById("open-calendar").addEventListener("click", () => {
        showPage("calendar-page");
        renderCalendar(currentMonth, currentYear);
    });
    document.getElementById("prev-month").addEventListener("click", () => {
        currentYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
        currentMonth = (currentMonth === 0) ? 11 : currentMonth + 1;
        renderCalendar(currentMonth, currentYear);
    });
    document.getElementById("next-month").addEventListener("click", () => {
        currentYear = (currentMonth === 11) ? currentYear + 1 : currentYear;
        currentMonth = (currentMonth === 11) ? 0 : currentMonth + 1;
        renderCalendar(currentMonth, currentYear);
    });

    // Creator-specific management
    document.getElementById("creator-manage-members-btn").addEventListener("click", showManageMembersModal);
    document.getElementById("close-manage-members-modal").addEventListener("click", () => {
        document.getElementById("manage-members-modal").classList.remove("active");
    });
    // Dynamically created buttons need a listener on a parent container
    document.getElementById("member-management-list").addEventListener("click", handleMemberAction);
    document.getElementById("manage-members-modal").addEventListener("click", function(event) {
        if (event.target.id === 'add-member-btn') {
            addMemberFromSelect();
        }
    });
}
