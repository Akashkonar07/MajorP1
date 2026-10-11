import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoIcon from '../../assets/brand/icon.svg';

// Sidebar sections (project brief §6). `to: null` = page arrives in a later build step.
const NAV = [
  {
    title: 'Online Store',
    items: [
      { label: 'Dashboard', icon: 'dashboard', to: '/admin', end: true },
      { label: 'Sarees', icon: 'checkroom', to: '/admin/sarees' },
      { label: 'Orders', icon: 'receipt_long', to: null },
      { label: 'Online Stock Register', icon: 'inventory', to: '/admin/stock-register' },
      { label: 'Customers', icon: 'group', to: null },
      { label: 'Categories', icon: 'category', to: null },
    ],
  },
  {
    title: 'Shop Inventory (private)',
    items: [
      { label: 'Shop Items', icon: 'storefront', to: null },
      { label: 'Shop Stock History', icon: 'history', to: null },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Shop Settings', icon: 'settings', to: null },
      { label: 'Activity Log', icon: 'fact_check', to: null },
    ],
  },
];

const Sidebar = ({ onNavigate }) => (
  <nav className="space-y-6">
    {NAV.map(section => (
      <div key={section.title}>
        <p className="font-body text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-700 px-3 mb-2">
          {section.title}
        </p>
        <ul className="space-y-0.5">
          {section.items.map(item => (
            <li key={item.label}>
              {item.to ? (
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-sm font-body text-sm transition-colors ${
                      isActive ? 'bg-maroon-900 text-white' : 'text-charcoal hover:bg-maroon-50 hover:text-maroon-900'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ) : (
                <span className="flex items-center gap-3 px-3 py-2 font-body text-sm text-gray-400 cursor-not-allowed">
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                  <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
);

const AdminLayout = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-2">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span className="material-symbols-outlined text-charcoal">menu</span>
            </button>
            <Link to="/admin" className="flex items-center gap-2">
              <img src={logoIcon} alt="" className="w-9 h-9" />
              <span className="font-heading font-bold text-lg text-maroon-900 whitespace-nowrap">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="hidden sm:flex items-center gap-1 font-body text-xs text-gray-500 hover:text-maroon-900">
              <span className="material-symbols-outlined text-base">open_in_new</span>
              View shop
            </Link>
            <span className="hidden md:block font-body text-xs text-gray-500 truncate max-w-[180px]">
              {profile?.full_name || user?.email}
            </span>
            <button onClick={handleSignOut} className="flex items-center gap-1 font-body text-xs text-maroon-900 hover:underline">
              <span className="material-symbols-outlined text-base">logout</span>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-gray-100 p-4">
          <Sidebar />
        </aside>

        {/* Sidebar — mobile slide-over */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-white p-4 overflow-y-auto">
              <div className="flex justify-end mb-2">
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
