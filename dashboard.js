// ===== EduPanel - Student Management Dashboard =====
(function () {
  'use strict';

  const STORAGE_KEY = 'edupanel:students:v1';
  const THEME_KEY = 'edupanel:theme';

  const COURSES = [
    { name: 'BCA', duration: '3 Years', icon: '💻' },
    { name: 'B.Tech', duration: '4 Years', icon: '⚙️' },
    { name: 'MCA', duration: '2 Years', icon: '🖥️' },
    { name: 'MBA', duration: '2 Years', icon: '📊' },
    { name: 'B.Sc', duration: '3 Years', icon: '🔬' },
    { name: 'M.Tech', duration: '2 Years', icon: '🛠️' },
  ];

  const SEED = [
    { id: 1, name: 'Rahul Sharma', course: 'BCA', attendance: 92, status: 'Active' },
    { id: 2, name: 'Priya Verma', course: 'B.Tech', attendance: 85, status: 'Active' },
    { id: 3, name: 'Aman Gupta', course: 'MCA', attendance: 97, status: 'Active' },
    { id: 4, name: 'Sneha Iyer', course: 'MBA', attendance: 74, status: 'Active' },
    { id: 5, name: 'Vikram Singh', course: 'B.Sc', attendance: 60, status: 'Inactive' },
  ];

  // ===== State =====
  let students = load();
  let editingId = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
        return [...SEED];
      }
      return JSON.parse(raw);
    } catch { return [...SEED]; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); }
  function nextId() { return students.length ? Math.max(...students.map(s => s.id)) + 1 : 1; }
  const initials = n => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

  // ===== Elements =====
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  // ===== Theme =====
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $('#themeToggle').textContent = t === 'dark' ? '☀️' : '🌙';
    const sw = $('#darkModeSwitch'); if (sw) sw.checked = t === 'dark';
  }
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next); applyTheme(next);
  });

  // ===== Navigation =====
  const PAGE_TITLES = {
    dashboard: 'Dashboard', students: 'Students', courses: 'Courses',
    attendance: 'Attendance', settings: 'Settings'
  };
  function go(page) {
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $('#page-' + page);
    if (target) target.classList.add('active');
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    $('#pageTitle').textContent = PAGE_TITLES[page] || 'Dashboard';
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'attendance') animateAttendance();
    if (page === 'courses') renderCourses();
  }
  $$('.nav-item[data-page]').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
  $$('[data-page-link]').forEach(b => b.addEventListener('click', () => go(b.dataset.pageLink)));
  $('#logoutBtn').addEventListener('click', () => toast('Logged out (demo only)', 'warning'));

  // ===== Sidebar (mobile) =====
  function openSidebar() { $('#sidebar').classList.add('open'); $('#sidebarBackdrop').classList.add('show'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebarBackdrop').classList.remove('show'); }
  $('#hamburger').addEventListener('click', () => {
    $('#sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
  });
  $('#sidebarBackdrop').addEventListener('click', closeSidebar);

  // ===== Render =====
  function renderAll() {
    renderStats();
    renderStudents();
    renderRecent();
    renderAttendance();
    renderCourses();
  }

  function renderStats() {
    $('#statStudents').textContent = students.length;
    $('#statCourses').textContent = COURSES.length;
    const avg = students.length
      ? Math.round(students.reduce((s, x) => s + Number(x.attendance || 0), 0) / students.length)
      : 0;
    $('#statAttendance').textContent = avg + '%';
    $('#statActive').textContent = students.filter(s => s.status === 'Active').length;
  }

  function renderStudents(filter = '') {
    const tbody = $('#studentsTbody');
    const q = filter.trim().toLowerCase();
    const list = students.filter(s =>
      !q || s.name.toLowerCase().includes(q) || s.course.toLowerCase().includes(q)
    );
    tbody.innerHTML = '';
    $('#emptyStudents').hidden = list.length > 0;
    list.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${String(s.id).padStart(3, '0')}</td>
        <td>
          <div class="cell-name">
            <div class="avatar">${initials(s.name)}</div>
            <span>${escapeHtml(s.name)}</span>
          </div>
        </td>
        <td>${escapeHtml(s.course)}</td>
        <td>
          <div class="bar-row">
            <div class="bar"><span style="width:${s.attendance}%"></span></div>
            <span>${s.attendance}%</span>
          </div>
        </td>
        <td><span class="status-pill ${s.status}">${s.status}</span></td>
        <td>
          <div class="actions">
            <button class="btn-icon edit" data-edit="${s.id}" title="Edit">✏️</button>
            <button class="btn-icon delete" data-del="${s.id}" title="Delete">🗑️</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-edit]').forEach(b =>
      b.addEventListener('click', () => openModal(Number(b.dataset.edit))));
    tbody.querySelectorAll('[data-del]').forEach(b =>
      b.addEventListener('click', () => removeStudent(Number(b.dataset.del))));
  }

  function renderRecent() {
    const wrap = $('#recentList');
    const recent = [...students].slice(-5).reverse();
    wrap.innerHTML = recent.length ? '' :
      '<p class="muted">No students yet — add one to get started.</p>';
    recent.forEach(s => {
      const div = document.createElement('div');
      div.className = 'recent-item';
      div.innerHTML = `
        <div class="avatar">${initials(s.name)}</div>
        <div>
          <strong>${escapeHtml(s.name)}</strong><br/>
          <small>${escapeHtml(s.course)} · ${s.attendance}% attendance</small>
        </div>
        <span class="status-pill ${s.status}">${s.status}</span>`;
      wrap.appendChild(div);
    });
  }

  function renderAttendance() {
    const wrap = $('#attendanceList');
    $('#attendanceCount').textContent = students.length + ' students';
    wrap.innerHTML = '';
    if (!students.length) {
      wrap.innerHTML = '<p class="muted">No attendance records yet.</p>'; return;
    }
    students.forEach(s => {
      const div = document.createElement('div');
      div.className = 'attendance-item';
      div.innerHTML = `
        <div class="avatar">${initials(s.name)}</div>
        <div class="att-info">
          <strong>${escapeHtml(s.name)}</strong>
          <small>${escapeHtml(s.course)}</small>
          <div class="att-bar"><span data-pct="${s.attendance}"></span></div>
        </div>
        <div class="att-pct">${s.attendance}%</div>`;
      wrap.appendChild(div);
    });
  }

  function animateAttendance() {
    requestAnimationFrame(() => {
      $$('#attendanceList .att-bar > span').forEach(el => {
        el.style.width = (el.dataset.pct || 0) + '%';
      });
    });
  }

  function renderCourses() {
    const grid = $('#coursesGrid');
    grid.innerHTML = '';
    COURSES.forEach((c, i) => {
      const count = students.filter(s => s.course === c.name).length;
      const card = document.createElement('div');
      card.className = 'course-card fade-in';
      card.style.animationDelay = (i * 0.06) + 's';
      card.innerHTML = `
        <div class="course-emoji">${c.icon}</div>
        <h3>${c.name}</h3>
        <p class="duration">Duration · ${c.duration}</p>
        <div class="course-meta">
          <div><strong>${count}</strong><br/><small>Students</small></div>
          <button class="btn-link">View →</button>
        </div>`;
      grid.appendChild(card);
    });
  }

  // ===== Search =====
  $('#studentSearch').addEventListener('input', e => renderStudents(e.target.value));
  $('#globalSearch').addEventListener('input', e => {
    const v = e.target.value;
    if (v) { go('students'); $('#studentSearch').value = v; renderStudents(v); }
  });

  // ===== Modal =====
  const modal = $('#studentModal');
  function openModal(id = null) {
    editingId = id;
    $('#modalTitle').textContent = id ? 'Edit Student' : 'Add Student';
    const f = $('#studentForm'); f.reset();
    clearErrors();
    if (id) {
      const s = students.find(x => x.id === id);
      if (s) {
        $('#studentId').value = s.id;
        $('#fName').value = s.name;
        $('#fCourse').value = s.course;
        $('#fAttendance').value = s.attendance;
        $('#fStatus').value = s.status;
      }
    }
    modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); }
  $('#addStudentBtn').addEventListener('click', () => openModal());
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function clearErrors() { $$('#studentForm .error').forEach(e => e.textContent = ''); }
  function setError(field, msg) {
    const el = document.querySelector(`#studentForm .error[data-for="${field}"]`);
    if (el) el.textContent = msg;
  }

  $('#studentForm').addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();
    const name = $('#fName').value.trim();
    const course = $('#fCourse').value;
    const att = Number($('#fAttendance').value);
    const status = $('#fStatus').value;
    let ok = true;
    if (!name) { setError('fName', 'Name is required'); ok = false; }
    if (!course) { setError('fCourse', 'Please choose a course'); ok = false; }
    if (Number.isNaN(att) || att < 0 || att > 100) { setError('fAttendance', 'Enter 0–100'); ok = false; }
    if (!ok) return;

    if (editingId) {
      students = students.map(s => s.id === editingId ? { ...s, name, course, attendance: att, status } : s);
      toast('Student updated successfully', 'success');
    } else {
      students.push({ id: nextId(), name, course, attendance: att, status });
      toast('Student added successfully', 'success');
    }
    save(); renderAll(); closeModal();
  });

  function removeStudent(id) {
    const s = students.find(x => x.id === id); if (!s) return;
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    students = students.filter(x => x.id !== id);
    save(); renderAll();
    toast('Student deleted', 'danger');
  }

  // ===== Toast =====
  function toast(msg, type = 'success') {
    const stack = $('#toastStack');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<span>${type === 'success' ? '✅' : type === 'danger' ? '🗑️' : 'ℹ️'}</span><span>${escapeHtml(msg)}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 250); }, 2600);
  }

  // ===== Settings switches =====
  $('#darkModeSwitch').addEventListener('change', e => {
    const t = e.target.checked ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, t); applyTheme(t);
  });
  $('#notifBtn').addEventListener('click', () => toast('No new notifications', 'success'));
  $('#notifSwitch').addEventListener('change', e =>
    toast('Notifications ' + (e.target.checked ? 'enabled' : 'disabled'), 'success'));
  $('#langSelect').addEventListener('change', e => toast('Language: ' + e.target.value, 'success'));

  // ===== Scroll-to-top =====
  const scrollBtn = $('#scrollTop');
  document.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('show', window.scrollY > 300);
  });
  scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ===== Helpers =====
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ===== Boot =====
  window.addEventListener('load', () => {
    renderAll();
    setTimeout(() => {
      const loader = $('#loader');
      loader.classList.add('hide');
      $('#app').hidden = false;
      setTimeout(() => loader.remove(), 400);
      animateAttendance();
    }, 600);
  });
})();
