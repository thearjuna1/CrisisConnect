/* ============================================================
   CrisisConnect — single-file SPA
   Talks to a Spring Boot backend at /api (same origin).
   ============================================================ */

const API_BASE = '/api';

/* ---------- Auth / token helpers ---------- */

function getToken() { return localStorage.getItem('cc_token'); }
function setToken(t) { localStorage.setItem('cc_token', t); }
function clearToken() { localStorage.removeItem('cc_token'); }

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (e) {
    return null;
  }
}

function currentUser() {
  const token = getToken();
  if (!token) return null;
  const claims = decodeToken(token);
  if (!claims) return null;
  if (claims.exp && Date.now() >= claims.exp * 1000) { clearToken(); return null; }
  return { email: claims.sub, id: claims.id, role: claims.role };
}

function isLoggedIn() { return !!currentUser(); }
function isAdmin() { const u = currentUser(); return !!u && u.role === 'ADMIN'; }

function logout() {
  clearToken();
  navigate('#/');
  render();
}

/* ---------- API wrapper ---------- */

async function apiFetch(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));

  if (!res.ok) {
    let message = 'Request failed (' + res.status + ')';
    try {
      const body = await res.json();
      message = body.message || message;
    } catch (e) { /* no json body */ }
    if (res.status === 401 || res.status === 403) {
      message = res.status === 401
        ? 'Your session has expired. Please log in again.'
        : "You don't have permission to do that.";
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ---------- Small utils ---------- */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
         ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 3200);
}

const CATEGORIES = ['FLOOD', 'LANDSLIDE', 'FOREST_FIRE', 'POTHOLE', 'BROKEN_STREET_LIGHT', 'FALLEN_TREE', 'BUILDING_DAMAGE'];
const STATUSES = ['PENDING', 'VERIFIED', 'RESOLVED', 'REJECTED'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];

function humanize(enumVal) {
  return enumVal.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/* ============================================================
   Router
   ============================================================ */

const routes = {
  '#/': viewHome,
  '#/login': viewLogin,
  '#/register': viewRegister,
  '#/report': viewReport,
  '#/my-reports': viewMyReports,
  '#/admin': viewAdmin,
};

function navigate(hash) { window.location.hash = hash; }

function currentRoute() {
  const hash = window.location.hash || '#/';
  return routes[hash] ? hash : '#/';
}

async function render() {
  renderNav();
  const app = document.getElementById('app');
  const route = currentRoute();

  // Guard: report/my-reports require login
  if ((route === '#/report' || route === '#/my-reports') && !isLoggedIn()) {
    app.innerHTML = guardMessage('You need to log in to do that.', '#/login');
    return;
  }
  // Guard: admin requires ADMIN role
  if (route === '#/admin' && !isAdmin()) {
    app.innerHTML = guardMessage("This area is for admins only.", '#/');
    return;
  }

  app.innerHTML = '<div class="loading-state">Loading…</div>';
  try {
    await routes[route](app);
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>${escapeHtml(e.message)}</p></div>`;
  }
  loadEmergencyContacts(); // refresh footer regardless of view
}

function guardMessage(msg, redirectHash) {
  return `<div class="empty-state"><h3>${escapeHtml(msg)}</h3>
    <p><a class="btn btn-primary" href="${redirectHash}">Continue</a></p></div>`;
}

window.addEventListener('hashchange', render);

/* ============================================================
   Nav
   ============================================================ */

function renderNav() {
  const nav = document.getElementById('nav');
  const user = currentUser();
  const route = currentRoute();
  const active = h => h === route ? ' class="active"' : '';

  let links = `<a href="#/"${active('#/')}>Incidents</a>`;

  if (user) {
    links += `<a href="#/my-reports"${active('#/my-reports')}>My Reports</a>`;
    if (user.role === 'ADMIN') links += `<a href="#/admin"${active('#/admin')}>Admin</a>`;
    links += `<a href="#/report" class="btn-report">Report Incident</a>`;
    links += `<button class="link" onclick="logout()">Logout (${escapeHtml(user.email)})</button>`;
  } else {
    links += `<a href="#/login"${active('#/login')}>Login</a>`;
    links += `<a href="#/report" class="btn-report">Report Incident</a>`;
  }

  nav.innerHTML = links;
}

document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('open');
});

/* ============================================================
   View: Home (guest + citizen browse)
   ============================================================ */

async function viewHome(app) {
  const [alerts, incidents] = await Promise.all([
    apiFetch('/alerts').catch(() => []),
    apiFetch('/incidents').catch(() => []),
  ]);

  app.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Community reporting</span>
        <h1>Reported Incidents</h1>
        <div class="subtext">Browse hazards reported by citizens near you, verified by local admins.</div>
      </div>
    </div>

    <div id="alertsSection"></div>

    <div class="filter-bar">
      <label for="statusFilter">Status</label>
      <select id="statusFilter">
        <option value="">All</option>
        ${STATUSES.map(s => `<option value="${s}">${humanize(s)}</option>`).join('')}
      </select>
      <label for="categoryFilter">Category</label>
      <select id="categoryFilter">
        <option value="">All</option>
        ${CATEGORIES.map(c => `<option value="${c}">${humanize(c)}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" id="applyFilters">Apply</button>
      <button class="btn btn-outline btn-sm" id="clearFilters">Clear</button>
    </div>

    <div id="incidentsList" class="incident-list"></div>
  `;

  renderAlertBanners(alerts);
  renderIncidentList(document.getElementById('incidentsList'), incidents);

  document.getElementById('applyFilters').addEventListener('click', async () => {
    const status = document.getElementById('statusFilter').value;
    const category = document.getElementById('categoryFilter').value;
    let path = '/incidents';
    if (status) path = '/incidents/status/' + status;
    else if (category) path = '/incidents/category/' + category;

    const list = document.getElementById('incidentsList');
    list.innerHTML = '<div class="loading-state">Loading…</div>';
    try {
      const data = await apiFetch(path);
      renderIncidentList(list, data);
    } catch (e) {
      list.innerHTML = `<div class="empty-state"><p>${escapeHtml(e.message)}</p></div>`;
    }
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('statusFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('applyFilters').click();
  });
}

function renderAlertBanners(alerts) {
  const container = document.getElementById('alertsSection');
  if (!container) return;
  if (!alerts.length) { container.innerHTML = ''; return; }
  container.innerHTML = alerts.map(a => `
    <div class="alert-banner">
      <span class="icon">⚠️</span>
      <div>
        <strong>${escapeHtml(a.title)}</strong>
        <span class="area">· ${escapeHtml(a.area)} · ${humanize(a.severity)}</span>
        <p>${escapeHtml(a.description)}</p>
      </div>
    </div>
  `).join('');
}

function renderIncidentList(container, incidents, opts) {
  opts = opts || {};
  if (!incidents || !incidents.length) {
    container.innerHTML = `<div class="empty-state"><h3>No incidents found</h3><p>Nothing matches these filters yet.</p></div>`;
    return;
  }
  container.innerHTML = incidents.map(r => incidentCard(r, opts)).join('');

  if (opts.adminActions) {
    container.querySelectorAll('[data-verify]').forEach(btn =>
      btn.addEventListener('click', () => adminAction(btn.dataset.verify, 'verify')));
    container.querySelectorAll('[data-reject]').forEach(btn =>
      btn.addEventListener('click', () => adminAction(btn.dataset.reject, 'reject')));
    container.querySelectorAll('[data-resolve]').forEach(btn =>
      btn.addEventListener('click', () => adminAction(btn.dataset.resolve, 'resolve')));
  }
}

function statusLadder(status) {
  const order = ['PENDING', 'VERIFIED', 'RESOLVED'];
  if (status === 'REJECTED') {
    return `<div class="status-ladder rejected">
      <div class="dot done"></div><div class="bar done"></div><div class="dot current"></div>
    </div>`;
  }
  const idx = order.indexOf(status);
  return `<div class="status-ladder">
    ${order.map((s, i) => `
      <div class="step">
        <div class="dot ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}"></div>
        ${i < order.length - 1 ? `<div class="bar ${i < idx ? 'done' : ''}"></div>` : ''}
      </div>
    `).join('')}
  </div>`;
}

function incidentCard(r, opts) {
  opts = opts || {};
  return `
    <div class="incident-card">
      <div class="incident-top">
        <h3>${escapeHtml(r.title)}</h3>
        <div class="badge-row">
          ${r.priority ? `<span class="badge badge-${r.priority}">${r.priority}</span>` : ''}
          <span class="badge badge-${r.status}">${r.status}</span>
        </div>
      </div>
      <p class="incident-desc">${escapeHtml(r.description)}</p>
      ${r.aiSummary ? `
        <div class="incident-ai">
          <span class="ai-label">AI Summary</span>
          ${escapeHtml(r.aiSummary)}
          ${r.safetyAdvice ? `<br><span class="ai-label" style="margin-top:6px;">Safety Advice</span>${escapeHtml(r.safetyAdvice)}` : ''}
        </div>` : ''}
      ${statusLadder(r.status)}
      <div class="incident-meta">
        <span>📍 ${escapeHtml(r.address)} <span class="mono">(${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)})</span></span>
        <span>${formatDate(r.createdAt)}</span>
      </div>
      ${opts.adminActions ? `
        <div class="incident-actions">
          ${r.status !== 'VERIFIED' && r.status !== 'RESOLVED' ? `<button class="btn btn-success btn-sm" data-verify="${r.id}">Verify</button>` : ''}
          ${r.status !== 'REJECTED' ? `<button class="btn btn-danger btn-sm" data-reject="${r.id}">Reject</button>` : ''}
          ${r.status === 'VERIFIED' ? `<button class="btn btn-primary btn-sm" data-resolve="${r.id}">Mark Resolved</button>` : ''}
        </div>` : ''}
    </div>
  `;
}

/* ============================================================
   View: Login
   ============================================================ */

async function viewLogin(app) {
  app.innerHTML = `
    <div class="auth-shell card card-pad">
      <span class="eyebrow">Welcome back</span>
      <h1>Log in</h1>
      <div id="loginError"></div>
      <form id="loginForm" style="margin-top:18px;">
        <div class="form-group">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" required style="width:100%;">
        </div>
        <div class="form-group">
          <label for="loginPassword">Password</label>
          <input type="password" id="loginPassword" required style="width:100%;">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Log in</button>
      </form>
      <div class="form-switch">New here? <a href="#/register">Create an account</a></div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errBox = document.getElementById('loginError');
    errBox.innerHTML = '';

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      toast('Logged in successfully', 'success');
      navigate('#/');
      render();
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

/* ============================================================
   View: Register
   ============================================================ */

async function viewRegister(app) {
  app.innerHTML = `
    <div class="auth-shell card card-pad">
      <span class="eyebrow">Join CrisisConnect</span>
      <h1>Create account</h1>
      <div id="registerError"></div>
      <form id="registerForm" style="margin-top:18px;">
        <div class="form-group">
          <label for="regName">Full name</label>
          <input type="text" id="regName" required style="width:100%;">
        </div>
        <div class="form-group">
          <label for="regEmail">Email</label>
          <input type="email" id="regEmail" required style="width:100%;">
        </div>
        <div class="form-group">
          <label for="regPassword">Password</label>
          <input type="password" id="regPassword" required style="width:100%;">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create account</button>
      </form>
      <div class="form-switch">Already have an account? <a href="#/login">Log in</a></div>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errBox = document.getElementById('registerError');
    errBox.innerHTML = '';

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setToken(res.token);
      toast('Account created — welcome!', 'success');
      navigate('#/');
      render();
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

/* ============================================================
   View: Report Incident (with geolocation)
   ============================================================ */

let capturedLocation = null;

async function viewReport(app) {
  capturedLocation = null;

  app.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Citizen report</span>
        <h1>Report an Incident</h1>
        <div class="subtext">AI will classify priority and generate safety advice automatically once submitted.</div>
      </div>
    </div>

    <div class="card card-pad" style="max-width:640px;">
      <div id="reportError"></div>
      <form id="reportForm">
        <div class="form-group">
          <label for="rTitle">Title</label>
          <input type="text" id="rTitle" required style="width:100%;" placeholder="e.g. Flood near riverside colony">
        </div>
        <div class="form-group">
          <label for="rDescription">Description</label>
          <textarea id="rDescription" required placeholder="Describe what you're seeing — water levels, damage, blocked roads, etc."></textarea>
        </div>
        <div class="form-group">
          <label for="rCategory">Category</label>
          <select id="rCategory" required style="width:100%;">
            ${CATEGORIES.map(c => `<option value="${c}">${humanize(c)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="rAddress">Address</label>
          <input type="text" id="rAddress" required style="width:100%;" placeholder="Street / area / landmark">
        </div>
        <div class="form-group">
          <label for="rPhotoUrl">Photo URL <span class="hint">(optional)</span></label>
          <input type="text" id="rPhotoUrl" style="width:100%;" placeholder="https://...">
        </div>

        <div class="geo-box">
          <button type="button" class="btn btn-outline btn-sm" id="getLocationBtn">📍 Use My Current Location</button>
          <div class="geo-coords empty" id="geoCoords">No location captured yet</div>
        </div>

        <button type="submit" class="btn btn-primary btn-block" id="submitReportBtn">Submit Report</button>
      </form>
    </div>
  `;

  document.getElementById('getLocationBtn').addEventListener('click', () => {
    const coordsEl = document.getElementById('geoCoords');
    if (!navigator.geolocation) {
      coordsEl.textContent = 'Geolocation is not supported by this browser.';
      return;
    }
    coordsEl.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        capturedLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        coordsEl.classList.remove('empty');
        coordsEl.innerHTML = `Lat ${capturedLocation.lat.toFixed(6)}, Lng ${capturedLocation.lng.toFixed(6)} ✓`;
      },
      (err) => {
        coordsEl.textContent = 'Could not get location: ' + err.message;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('reportError');
    errBox.innerHTML = '';

    if (!capturedLocation) {
      errBox.innerHTML = `<div class="form-error">Please capture your location before submitting.</div>`;
      return;
    }

    const payload = {
      title: document.getElementById('rTitle').value.trim(),
      description: document.getElementById('rDescription').value.trim(),
      category: document.getElementById('rCategory').value,
      latitude: capturedLocation.lat,
      longitude: capturedLocation.lng,
      address: document.getElementById('rAddress').value.trim(),
      photoUrl: document.getElementById('rPhotoUrl').value.trim() || null,
    };

    const btn = document.getElementById('submitReportBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting — AI is analyzing…';

    try {
      await apiFetch('/incidents', { method: 'POST', body: JSON.stringify(payload) });
      toast('Incident reported successfully', 'success');
      navigate('#/my-reports');
      render();
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
      btn.disabled = false;
      btn.textContent = 'Submit Report';
    }
  });
}

/* ============================================================
   View: My Reports
   ============================================================ */

async function viewMyReports(app) {
  app.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Your history</span>
        <h1>My Reports</h1>
      </div>
    </div>
    <div id="myReportsList" class="incident-list"><div class="loading-state">Loading…</div></div>
  `;

  const list = document.getElementById('myReportsList');
  try {
    const reports = await apiFetch('/incidents/my-reports');
    renderIncidentList(list, reports);
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><p>${escapeHtml(e.message)}</p></div>`;
  }
}

/* ============================================================
   View: Admin console (tabs: Reports / Alerts / Analytics)
   ============================================================ */

let adminTab = 'reports';

async function viewAdmin(app) {
  app.innerHTML = `
    <div class="page-head">
      <div>
        <span class="eyebrow">Admin console</span>
        <h1>Manage CrisisConnect</h1>
      </div>
    </div>
    <div class="tabs">
      <button data-tab="reports" class="${adminTab === 'reports' ? 'active' : ''}">Reports</button>
      <button data-tab="alerts" class="${adminTab === 'alerts' ? 'active' : ''}">Public Alerts</button>
      <button data-tab="analytics" class="${adminTab === 'analytics' ? 'active' : ''}">Analytics</button>
    </div>
    <div id="adminTabContent"><div class="loading-state">Loading…</div></div>
  `;

  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      adminTab = btn.dataset.tab;
      viewAdmin(app);
    });
  });

  const content = document.getElementById('adminTabContent');
  if (adminTab === 'reports') await renderAdminReports(content);
  else if (adminTab === 'alerts') await renderAdminAlerts(content);
  else await renderAdminAnalytics(content);
}

async function renderAdminReports(container) {
  try {
    const reports = await apiFetch('/admin/reports');
    container.innerHTML = '<div class="incident-list" id="adminIncidentList"></div>';
    renderIncidentList(document.getElementById('adminIncidentList'), reports, { adminActions: true });
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>${escapeHtml(e.message)}</p></div>`;
  }
}

async function adminAction(id, action) {
  try {
    await apiFetch(`/admin/reports/${id}/${action}`, { method: 'PUT' });
    toast('Report ' + action + 'd', 'success');
    render();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function renderAdminAlerts(container) {
  const alerts = await apiFetch('/alerts').catch(() => []);

  container.innerHTML = `
    <div class="card card-pad" style="max-width:560px; margin-bottom:24px;">
      <h3 style="margin-bottom:14px;">Publish a new alert</h3>
      <div id="alertError"></div>
      <form id="alertForm">
        <div class="form-group">
          <label for="aTitle">Title</label>
          <input type="text" id="aTitle" required style="width:100%;" placeholder="e.g. Heavy Rain Warning">
        </div>
        <div class="form-group">
          <label for="aDescription">Description</label>
          <textarea id="aDescription" required></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="aArea">Area</label>
            <input type="text" id="aArea" required style="width:100%;">
          </div>
          <div class="form-group">
            <label for="aSeverity">Severity</label>
            <select id="aSeverity" style="width:100%;">
              ${SEVERITIES.map(s => `<option value="${s}">${humanize(s)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="aHours">Valid for (hours)</label>
          <input type="number" id="aHours" value="24" min="1" style="width:100%;">
        </div>
        <button type="submit" class="btn btn-primary">Publish Alert</button>
      </form>
    </div>

    <h3 style="margin-bottom:12px;">Active & recent alerts</h3>
    <div id="alertsAdminList"></div>
  `;

  renderAlertBanners.call(null, alerts);
  const listEl = document.getElementById('alertsAdminList');
  listEl.innerHTML = alerts.length
    ? alerts.map(a => `
        <div class="alert-banner">
          <span class="icon">📢</span>
          <div>
            <strong>${escapeHtml(a.title)}</strong>
            <span class="area">· ${escapeHtml(a.area)} · ${humanize(a.severity)} · expires ${formatDate(a.expiresAt)}</span>
            <p>${escapeHtml(a.description)}</p>
          </div>
        </div>`).join('')
    : `<div class="empty-state"><p>No active alerts.</p></div>`;

  document.getElementById('alertForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('alertError');
    errBox.innerHTML = '';
    const payload = {
      title: document.getElementById('aTitle').value.trim(),
      description: document.getElementById('aDescription').value.trim(),
      area: document.getElementById('aArea').value.trim(),
      severity: document.getElementById('aSeverity').value,
      validForHours: parseInt(document.getElementById('aHours').value, 10),
    };
    try {
      await apiFetch('/admin/alerts', { method: 'POST', body: JSON.stringify(payload) });
      toast('Alert published', 'success');
      viewAdmin(document.getElementById('app'));
    } catch (err) {
      errBox.innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

async function renderAdminAnalytics(container) {
  try {
    const a = await apiFetch('/admin/analytics');
    const maxCat = Math.max(1, ...Object.values(a.reportsByCategory || {}));

    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="value">${a.totalReports}</div><div class="label">Total</div></div>
        <div class="stat-card"><div class="value">${a.pendingReports}</div><div class="label">Pending</div></div>
        <div class="stat-card"><div class="value">${a.verifiedReports}</div><div class="label">Verified</div></div>
        <div class="stat-card"><div class="value">${a.resolvedReports}</div><div class="label">Resolved</div></div>
        <div class="stat-card"><div class="value">${a.rejectedReports}</div><div class="label">Rejected</div></div>
      </div>

      <div class="card card-pad" style="margin-bottom:20px;">
        <h3 style="margin-bottom:16px;">Reports by category</h3>
        ${Object.entries(a.reportsByCategory || {}).map(([cat, count]) => `
          <div class="bar-row">
            <div class="name">${humanize(cat)}</div>
            <div class="track"><div class="fill" style="width:${(count / maxCat) * 100}%;"></div></div>
            <div class="count">${count}</div>
          </div>
        `).join('')}
      </div>

      <div class="card card-pad">
        <h3 style="margin-bottom:16px;">Reports over time</h3>
        ${(a.reportsOverTime && a.reportsOverTime.length)
          ? a.reportsOverTime.map(d => `
              <div class="bar-row">
                <div class="name mono">${escapeHtml(d.date)}</div>
                <div class="track"><div class="fill" style="width:${Math.min(100, d.count * 12)}%;"></div></div>
                <div class="count">${d.count}</div>
              </div>`).join('')
          : `<p class="subtext">No time-series data yet.</p>`}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>${escapeHtml(e.message)}</p></div>`;
  }
}

/* ============================================================
   Emergency contacts footer
   ============================================================ */

async function loadEmergencyContacts() {
  const grid = document.getElementById('emergencyGrid');
  try {
    const contacts = await apiFetch('/emergency-contacts');
    grid.innerHTML = contacts.map(c => `
      <div class="emergency-item">
        <div class="service">${escapeHtml(c.service)}</div>
        <div class="number">${escapeHtml(c.number)}</div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = '<div class="emergency-skeleton">Unable to load emergency contacts.</div>';
  }
}

/* ============================================================
   Boot
   ============================================================ */

render();