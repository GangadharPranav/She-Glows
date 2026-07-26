/* ==========================================================================
   She Glows - Authentication & Session Security Module
   SHA-256 password hashing via Web Crypto API
   Session tokens via crypto.getRandomValues()
   Auto-logout on 30 min inactivity
   ========================================================================== */

const SheGlowsAuth = (() => {
  const CREDS_KEY   = 'sheglows_admin_creds';
  const SESSION_KEY = 'sheglows_session';
  const TIMEOUT_MS  = 30 * 60 * 1000;            // 30 min inactivity timeout
  const MAX_ATTEMPTS_KEY = 'sheglows_login_attempts';
  const LOCKOUT_KEY = 'sheglows_lockout_until';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000;         // 5 min lockout

  let _activityTimer = null;

  /* ── Crypto helpers ── */

  async function _sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function _generateToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  function _generateSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Rate limiting ── */

  function _getAttempts() {
    return parseInt(sessionStorage.getItem(MAX_ATTEMPTS_KEY) || '0', 10);
  }

  function _incrementAttempts() {
    const current = _getAttempts() + 1;
    sessionStorage.setItem(MAX_ATTEMPTS_KEY, String(current));
    return current;
  }

  function _resetAttempts() {
    sessionStorage.removeItem(MAX_ATTEMPTS_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
  }

  function _isLockedOut() {
    const until = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
    if (until && Date.now() < until) {
      return Math.ceil((until - Date.now()) / 1000);    // seconds remaining
    }
    if (until && Date.now() >= until) {
      _resetAttempts();
    }
    return 0;
  }

  function _lockOut() {
    sessionStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION));
  }

  /* ── Credential management ── */

  function isFirstTimeSetup() {
    return !localStorage.getItem(CREDS_KEY);
  }

  async function setupCredentials(username, password) {
    if (!username || !password) return { ok: false, msg: 'Username and password are required.' };
    if (password.length < 8) return { ok: false, msg: 'Password must be at least 8 characters.' };

    const salt = _generateSalt();
    const hash = await _sha256(salt + password);

    const creds = {
      username: username.toLowerCase().trim(),
      hash,
      salt,
      createdAt: Date.now()
    };

    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    return { ok: true, msg: 'Admin credentials created.' };
  }

  async function ensureDefaultCredentials() {
    if (!localStorage.getItem(CREDS_KEY)) {
      await setupCredentials('Suji@123', 'Suji@123');
    }
  }

  /* ── Login / Logout ── */

  async function login(username, password) {
    await ensureDefaultCredentials();

    // Check lockout
    const lockSecs = _isLockedOut();
    if (lockSecs > 0) {
      return { ok: false, msg: `Too many failed attempts. Try again in ${lockSecs}s.` };
    }

    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return { ok: false, msg: 'No admin account configured.' };

    let creds;
    try { creds = JSON.parse(raw); } catch { return { ok: false, msg: 'Credential store corrupted.' }; }

    const hash = await _sha256(creds.salt + password);

    if (username.toLowerCase().trim() !== creds.username || hash !== creds.hash) {
      const attempts = _incrementAttempts();
      if (attempts >= MAX_ATTEMPTS) {
        _lockOut();
        return { ok: false, msg: `Account locked for 5 minutes after ${MAX_ATTEMPTS} failed attempts.` };
      }
      return { ok: false, msg: `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempts remaining.` };
    }

    // Successful login
    _resetAttempts();

    const token = _generateToken();
    const session = {
      token,
      username: creds.username,
      loginAt: Date.now(),
      expiresAt: Date.now() + TIMEOUT_MS
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    _startActivityTimer();
    return { ok: true, msg: 'Login successful.', token };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    _clearActivityTimer();
  }

  /* ── Session checks ── */

  function isAuthenticated() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        logout();
        return false;
      }
      return true;
    } catch {
      logout();
      return false;
    }
  }

  function getSession() {
    if (!isAuthenticated()) return null;
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  }

  function refreshSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const session = JSON.parse(raw);
      session.expiresAt = Date.now() + TIMEOUT_MS;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* ignore */ }
  }

  /* ── Inactivity auto-logout ── */

  function _startActivityTimer() {
    _clearActivityTimer();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => { refreshSession(); };
    events.forEach(e => document.addEventListener(e, handler, { passive: true }));
    _activityTimer = setInterval(() => {
      if (!isAuthenticated()) {
        _clearActivityTimer();
        events.forEach(e => document.removeEventListener(e, handler));
        // Redirect to login if currently on admin page
        if (window.location.pathname.includes('/admin/')) {
          window.location.href = 'login.html?expired=1';
        }
      }
    }, 60000);   // check every 60s
  }

  function _clearActivityTimer() {
    if (_activityTimer) {
      clearInterval(_activityTimer);
      _activityTimer = null;
    }
  }

  /* ── Guard — redirect if not authed ── */

  function guardAdminPage() {
    if (!isAuthenticated()) {
      window.location.href = 'login.html?redirect=dashboard.html';
      return false;
    }
    _startActivityTimer();
    return true;
  }

  /* ── Change password ── */

  async function changePassword(currentPassword, newPassword) {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return { ok: false, msg: 'No admin account.' };
    const creds = JSON.parse(raw);
    const currentHash = await _sha256(creds.salt + currentPassword);
    if (currentHash !== creds.hash) return { ok: false, msg: 'Current password is incorrect.' };
    if (newPassword.length < 8) return { ok: false, msg: 'New password must be at least 8 characters.' };

    const newSalt = _generateSalt();
    const newHash = await _sha256(newSalt + newPassword);
    creds.salt = newSalt;
    creds.hash = newHash;
    creds.updatedAt = Date.now();
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    return { ok: true, msg: 'Password updated. Please login again.' };
  }

  return {
    isFirstTimeSetup,
    setupCredentials,
    ensureDefaultCredentials,
    login,
    logout,
    isAuthenticated,
    getSession,
    guardAdminPage,
    changePassword
  };
})();

// Ensure default credentials exist
SheGlowsAuth.ensureDefaultCredentials();
