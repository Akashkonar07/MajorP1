import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Guard for every /admin page.
// This only decides what the browser shows — the real protection is in the
// database: RLS and the admin checks inside every admin function (brief §9.2).
const AdminRoute = ({ children }) => {
  const { user, isAdmin, ready, signOut } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-maroon-900/20 border-t-maroon-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-soft p-8 max-w-sm text-center">
          <span className="material-symbols-outlined text-5xl text-maroon-900 mb-3 block">lock</span>
          <h1 className="font-heading text-3xl font-semibold text-charcoal mb-2">Not authorised</h1>
          <p className="font-body text-sm text-gray-500 mb-6">
            This area is only for the shop&apos;s admins. You are logged in as {user.email}.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/" className="btn-primary">Go to the shop</Link>
            <button onClick={signOut} className="font-body text-xs text-maroon-900 hover:underline">
              Sign out and use an admin account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
