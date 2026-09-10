'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, login } = useAuth();
  const router = useRouter();

  // Sidebar & Modal states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form states
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  // Register form states
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regConsent, setRegConsent] = useState(false);

  // Common UI states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Handle URL param triggers for login/register safely on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('showLogin') === 'true') {
        setAuthMode('login');
        setIsAuthModalOpen(true);
      } else if (params.get('showRegister') === 'true') {
        setAuthMode('register');
        setIsAuthModalOpen(true);
      }
    }
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setLoginStep(1);
    setEmailOrPhone('');
    setPassword('');
    setRegFirstName('');
    setRegLastName('');
    setRegPhone('');
    setRegEmail('');
    setRegConsent(false);
    setError('');
    setSuccess('');
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    closeSidebar();
  };

  // Step 1 check in login modal
  const handleContinueLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }
    setLoginStep(2);
  };

  // Final login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrPhone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setSuccess('Login successful!');
      login(data.user);
      setTimeout(() => {
        closeAuthModal();
        // Redirect check
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          if (redirect) {
            router.push(redirect);
          } else {
            router.refresh();
          }
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Register submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setError('All fields are required.');
      return;
    }

    if (!regConsent) {
      setError('You must consent to the terms to proceed.');
      return;
    }

    setLoading(true);
    const fullName = `${regFirstName.trim()} ${regLastName.trim()}`;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: regEmail,
          phone: regPhone,
          role: 'tenant'
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Logging you in...');
      login(data.user);
      setTimeout(() => {
        closeAuthModal();
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Google SSO login bypass (logs in as the seeded user SOHEL)
  const handleGoogleSSO = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sheikhsohel691@gmail.com',
          password: 'password123'
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate Google demo');
      }

      setSuccess('Logged in via Google account successfully!');
      login(data.user);
      setTimeout(() => {
        closeAuthModal();
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError('Google single sign-on failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="navbar-header-exact">
        <div className="navbar-container-exact">

          {/* Nestaway Stylized Logo */}
          <Link href="/" className="navbar-logo">
            <span>S.R</span> Rental Services
          </Link>

          {/* Right Header Actions */}
          <div className="navbar-actions-right-exact">

            {/* List Your Property CTA Button */}
            {user && user.role === 'owner' ? (
              <Link href="/owner" className="btn-list-property-exact">
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => user ? router.push('/owner') : openAuthModal('login')}
                className="btn-list-property-exact"
              >
                List Your Property
              </button>
            )}

            {/* Menu Drawer Hamburger Button */}
            <button onClick={openSidebar} className="menu-toggle-btn-exact" aria-label="Toggle Navigation Drawer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="hamburger-svg">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

          </div>
        </div>
      </header>

      {/* Right Drawer Slide-out Sidebar */}
      <div className={`sidebar-drawer-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}>
        <div className="sidebar-drawer-container" onClick={(e) => e.stopPropagation()}>

          {/* Close Header */}
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="close-svg">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* If LOGGED IN Sidebar Content */}
          {user ? (
            <div className="sidebar-content-box">
              {/* User Identity Box */}
              <div className="sidebar-user-identity-card">
                <h4 className="user-identity-name">Hi {user.name.toUpperCase()},</h4>
                <div className="user-identity-meta">
                  <span className="user-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-icon-svg">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {user.email}
                  </span>
                  {user.phone && (
                    <span className="user-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-icon-svg">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Logged In Items Links */}
              <div className="sidebar-links-list">
                <Link href={user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/tenant'} onClick={closeSidebar} className="sidebar-link-item font-semibold">
                  Profile
                </Link>
                <Link href="/" onClick={closeSidebar} className="sidebar-link-item">
                  My Home
                </Link>
                <Link href={user.role === 'tenant' ? '/tenant' : '#'} onClick={closeSidebar} className="sidebar-link-item">
                  My Service Requests
                </Link>
                <Link href={user.role === 'tenant' ? '/tenant' : '#'} onClick={closeSidebar} className="sidebar-link-item">
                  My Payments
                </Link>
                <Link href="/listings" onClick={closeSidebar} className="sidebar-link-item">
                  My Wishlist
                </Link>
                <Link href="/listings" onClick={closeSidebar} className="sidebar-link-item">
                  Scheduled Visits
                </Link>

                <hr className="sidebar-divider" />

                <Link href="/listings" onClick={closeSidebar} className="sidebar-link-item">
                  Explore
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  About us
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  Work with us
                </Link>
                <Link href="/listings" onClick={closeSidebar} className="sidebar-link-item">
                  Refer & earn
                </Link>

                <hr className="sidebar-divider" />

                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  Tenancy policies
                </Link>
              </div>

              {/* Bottom Sticky Action */}
              <div className="sidebar-sticky-bottom">
                <button
                  onClick={() => { logout(); closeSidebar(); }}
                  className="sidebar-logout-btn-exact"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            /* If NOT LOGGED IN Sidebar Content */
            <div className="sidebar-content-box">
              <div className="sidebar-links-list" style={{ marginTop: '2rem' }}>
                <Link href="/listings" onClick={closeSidebar} className="sidebar-link-item">
                  Explore
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  About us
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  Work with us
                </Link>
                <Link href="/listings" onClick={closeSidebar} className="sidebar-link-item">
                  Refer & earn
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  Tenancy policies
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  Nestaway terms
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  Privacy policy
                </Link>
                <Link href="/contact" onClick={closeSidebar} className="sidebar-link-item">
                  FAQ
                </Link>
                <Link href="/owner" onClick={closeSidebar} className="sidebar-link-item">
                  For property owners
                </Link>
              </div>

              {/* Bottom Sticky Buttons */}
              <div className="sidebar-sticky-bottom dual-buttons">
                <button
                  onClick={() => openAuthModal('register')}
                  className="sidebar-bottom-pill-btn secondary"
                >
                  Create Account
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="sidebar-bottom-pill-btn primary"
                >
                  Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Split-Screen Interactive Authentication Modal */}
      {isAuthModalOpen && (
        <div className="modal-backdrop-exact" onClick={closeAuthModal}>
          <div className="modal-container-exact" onClick={(e) => e.stopPropagation()}>

            {/* Left Image Section */}
            <div className="modal-visual-column-exact" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&auto=format&fit=crop&q=80')` }}></div>

            {/* Right Form Section */}
            <div className="modal-form-column-exact">

              {/* Close X Button */}
              <button className="modal-close-btn-exact" onClick={closeAuthModal} aria-label="Close modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {error && <div className="auth-alert error">{error}</div>}
              {success && <div className="auth-alert success">{success}</div>}

              {/* LOGIN MODE FORM */}
              {authMode === 'login' && (
                <div className="auth-form-wrapper-exact">
                  <h3 className="auth-title-exact">Login to enjoy a customized and hassle-free experience.</h3>

                  <form onSubmit={loginStep === 1 ? handleContinueLogin : handleLoginSubmit} className="auth-fields-form">

                    {loginStep === 1 ? (
                      <div className="form-group-exact">
                        <input
                          type="text"
                          placeholder="Email id/ Phone number"
                          className="auth-input-exact"
                          value={emailOrPhone}
                          onChange={(e) => { setEmailOrPhone(e.target.value); setError(''); }}
                          required
                          disabled={loading}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="form-group-exact disabled-value-row">
                          <span className="entered-credential-label">{emailOrPhone}</span>
                          <button type="button" className="btn-change-credential" onClick={() => setLoginStep(1)}>Change</button>
                        </div>
                        <div className="form-group-exact">
                          <input
                            type="password"
                            placeholder="Enter your password"
                            className="auth-input-exact"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            required
                            autoFocus
                            disabled={loading}
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className={`auth-continue-btn-exact ${emailOrPhone.trim() ? 'active' : ''}`}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : loginStep === 1 ? 'Continue' : 'Login'}
                    </button>

                  </form>

                  <div className="auth-divider-row-exact">
                    <span className="divider-line"></span>
                    <span className="divider-text">Or</span>
                    <span className="divider-line"></span>
                  </div>

                  {/* Google SSO Login Button (Simulated login as Sohel) */}
                  <button onClick={handleGoogleSSO} className="google-sso-btn-exact" type="button" disabled={loading}>
                    <div className="google-sso-content">
                      <svg viewBox="0 0 24 24" className="google-icon-svg">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.7 0 3.24.69 4.36 1.81l3.07-3.07C19.3 2.94 15.97 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.79 0 9.89-3.97 9.89-9.89 0-.68-.06-1.34-.18-1.97H12.24z"></path>
                      </svg>
                      <div className="google-sso-labels">
                        <span className="sso-label-main">Sign in as Sohel</span>
                        <span className="sso-label-sub">sheikhsohel691@gmail.com</span>
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="google-chevron-down">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  <p className="auth-toggle-footer-text">
                    Don't have an account?{' '}
                    <button onClick={() => openAuthModal('register')} className="btn-toggle-mode">
                      Register now.
                    </button>
                  </p>
                </div>
              )}

              {/* REGISTER MODE FORM */}
              {authMode === 'register' && (
                <div className="auth-form-wrapper-exact">
                  <h3 className="auth-title-exact">Register and find your nest with ease!</h3>

                  <form onSubmit={handleRegisterSubmit} className="auth-fields-form">

                    <div className="auth-flex-row-exact">
                      <div className="form-group-exact flex-1">
                        <input
                          type="text"
                          placeholder="First Name"
                          className="auth-input-exact"
                          value={regFirstName}
                          onChange={(e) => { setRegFirstName(e.target.value); setError(''); }}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group-exact flex-1">
                        <input
                          type="text"
                          placeholder="Last Name"
                          className="auth-input-exact"
                          value={regLastName}
                          onChange={(e) => { setRegLastName(e.target.value); setError(''); }}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="auth-flex-row-exact">
                      <div className="form-group-exact flex-1">
                        <input
                          type="tel"
                          placeholder="Phone"
                          className="auth-input-exact"
                          value={regPhone}
                          onChange={(e) => { setRegPhone(e.target.value); setError(''); }}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group-exact flex-1">
                        <input
                          type="email"
                          placeholder="Email"
                          className="auth-input-exact"
                          value={regEmail}
                          onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Consent Checkbox */}
                    <div className="consent-checkbox-row-exact">
                      <label className="checkbox-container-exact">
                        <input
                          type="checkbox"
                          checked={regConsent}
                          onChange={(e) => { setRegConsent(e.target.checked); setError(''); }}
                          required
                          disabled={loading}
                        />
                        <span className="checkbox-checkmark-exact"></span>
                      </label>
                      <p className="consent-text-exact">
                        By Proceeding, You Consent To NestAway Technologies Using Your Provided Data To Process Your Property Inquiries, Facilitate Bookings Or Listings, And For Future Correspondence. You Can Review Our Full <Link href="/contact" className="consent-link">Privacy Policy</Link> .
                      </p>
                    </div>

                    <button
                      type="submit"
                      className={`auth-continue-btn-exact ${(regFirstName && regLastName && regEmail && regPhone && regConsent) ? 'active' : ''}`}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Continue'}
                    </button>

                  </form>

                  <div className="auth-divider-row-exact">
                    <span className="divider-line"></span>
                    <span className="divider-text">Or</span>
                    <span className="divider-line"></span>
                  </div>

                  {/* Google SSO Login Button (Simulated login as Sohel) */}
                  <button onClick={handleGoogleSSO} className="google-sso-btn-exact" type="button" disabled={loading}>
                    <div className="google-sso-content">
                      <svg viewBox="0 0 24 24" className="google-icon-svg">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.7 0 3.24.69 4.36 1.81l3.07-3.07C19.3 2.94 15.97 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.79 0 9.89-3.97 9.89-9.89 0-.68-.06-1.34-.18-1.97H12.24z"></path>
                      </svg>
                      <div className="google-sso-labels">
                        <span className="sso-label-main">Sign in as Sohel</span>
                        <span className="sso-label-sub">sheikhsohel691@gmail.com</span>
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="google-chevron-down">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  <p className="auth-toggle-footer-text">
                    Already have an account?{' '}
                    <button onClick={() => openAuthModal('login')} className="btn-toggle-mode">
                      Login.
                    </button>
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
