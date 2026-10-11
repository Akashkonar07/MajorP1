import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/FormField';
import { check, loginSchema } from '../../lib/validation';
import logoPrimary from '../../assets/brand/logo-primary.svg';

const AdminLogin = () => {
  const { user, isAdmin, ready, signIn, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/admin';
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && user && isAdmin) return <Navigate to={next} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { data, errors: fieldErrors } = check(loginSchema, values);
    setErrors(fieldErrors ?? {});
    if (fieldErrors) return;
    setBusy(true);
    const { error: signInError } = await signIn(data.email, data.password);
    setBusy(false);
    if (signInError) {
      setError(/invalid login credentials/i.test(signInError.message)
        ? 'Wrong email or password.'
        : 'Could not log in. Please try again in a few minutes.');
    }
    // On success the page re-renders: admins are sent on, others see the note below
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src={logoPrimary} alt="Vaibhav Laxmi Saree" className="h-28 w-auto mx-auto mb-2" />
          <p className="section-label">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow-soft p-6 sm:p-8 border border-gray-50 space-y-5">
          {ready && user && !isAdmin && (
            <p className="font-body text-sm rounded-sm px-3 py-2 bg-amber-50 text-amber-800">
              {user.email} is not an admin account.{' '}
              <button type="button" onClick={signOut} className="underline">Sign out</button>
            </p>
          )}
          {error && <p className="font-body text-sm rounded-sm px-3 py-2 bg-red-50 text-red-700">{error}</p>}

          <FormField label="Email" name="email" type="email" autoComplete="username"
            value={values.email} onChange={e => setValues({ ...values, email: e.target.value })} error={errors.email} />
          <FormField label="Password" name="password" type="password" autoComplete="current-password"
            value={values.password} onChange={e => setValues({ ...values, password: e.target.value })} error={errors.password} />

          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="text-center font-body text-xs text-gray-500 mt-6">
          <Link to="/" className="hover:text-maroon-900">← Back to the shop</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
