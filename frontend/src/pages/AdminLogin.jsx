import { useState } from 'react';
import './AdminLogin.css';

const CREDS_KEY = 'admin_credentials';

function getStoredCredentials() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { username: 'admin', password: 'admin' };
}

function AdminLogin({ onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'change'

  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Change password form
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpMsg, setCpMsg] = useState({ text: '', type: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    const creds = getStoredCredentials();
    if (username.trim() === creds.username && password === creds.password) {
      sessionStorage.setItem('admin_authed', '1');
      onLoginSuccess();
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const creds = getStoredCredentials();
    if (cpOldPassword !== creds.password) {
      setCpMsg({ text: 'Current password is incorrect.', type: 'error' });
      return;
    }
    if (cpNewPassword.length < 4) {
      setCpMsg({ text: 'New password must be at least 4 characters.', type: 'error' });
      return;
    }
    if (cpNewPassword !== cpConfirm) {
      setCpMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    localStorage.setItem(CREDS_KEY, JSON.stringify({ username: creds.username, password: cpNewPassword }));
    setCpOldPassword('');
    setCpNewPassword('');
    setCpConfirm('');
    setCpMsg({ text: 'Password changed successfully.', type: 'success' });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🔐</div>
        <h2>Admin Access</h2>

        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setLoginError(''); }}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${tab === 'change' ? 'active' : ''}`}
            onClick={() => { setTab('change'); setCpMsg({ text: '', type: '' }); }}
          >
            Change Password
          </button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            {loginError && <p className="login-error">{loginError}</p>}
            <div className="login-field">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setLoginError(''); }}
                autoComplete="username"
                required
              />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="login-submit-btn">Sign In</button>
          </form>
        )}

        {tab === 'change' && (
          <form onSubmit={handleChangePassword} className="login-form">
            {cpMsg.text && (
              <p className={`login-msg ${cpMsg.type}`}>{cpMsg.text}</p>
            )}
            <div className="login-field">
              <label>Current Password</label>
              <input
                type="password"
                value={cpOldPassword}
                onChange={e => { setCpOldPassword(e.target.value); setCpMsg({ text: '', type: '' }); }}
                required
              />
            </div>
            <div className="login-field">
              <label>New Password</label>
              <input
                type="password"
                value={cpNewPassword}
                onChange={e => { setCpNewPassword(e.target.value); setCpMsg({ text: '', type: '' }); }}
                required
              />
            </div>
            <div className="login-field">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={cpConfirm}
                onChange={e => { setCpConfirm(e.target.value); setCpMsg({ text: '', type: '' }); }}
                required
              />
            </div>
            <button type="submit" className="login-submit-btn">Update Password</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
