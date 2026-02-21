import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';
  const isCashier = user?.role === 'CASHIER';

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          ☰
        </button>
        <NavLink to="/" className={styles.logo}>
          Aaharam Coupon
        </NavLink>
        <div className={styles.user}>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.userRole}>{user?.role}</span>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
        {isCashier ? (
          // Cashier only sees Dining Form
          <NavLink to="/dining" onClick={() => setMenuOpen(false)}>
            Dining form
          </NavLink>
        ) : (
          // Admin and Client see all relevant menu items
          <>
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/campaigns" onClick={() => setMenuOpen(false)}>
              Campaigns
            </NavLink>
            {(isAdmin || isClient) && (
              <NavLink to="/coupons" onClick={() => setMenuOpen(false)}>
                Coupons
              </NavLink>
            )}
            <NavLink to="/dining" onClick={() => setMenuOpen(false)}>
              Dining form
            </NavLink>
            <NavLink to="/redeem" onClick={() => setMenuOpen(false)}>
              Redeem
            </NavLink>
            {(isAdmin || isClient) && (
              <NavLink to="/redemptions" onClick={() => setMenuOpen(false)}>
                Redemptions
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/clients" onClick={() => setMenuOpen(false)}>
                Clients
              </NavLink>
            )}
            {(isAdmin || isClient) && (
              <NavLink to="/users" onClick={() => setMenuOpen(false)}>
                Users
              </NavLink>
            )}
          </>
        )}
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
