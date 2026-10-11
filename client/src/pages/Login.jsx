import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { check, loginSchema, signUpSchema, resetSchema } from '../lib/validation';

const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === 'true';

// Supabase's messages → simple words for customers
function friendly(message = '') {
  if (/invalid login credentials/i.test(message)) return 'Wrong email or password.';
  if (/already registered/i.test(message)) return 'An account with this email already exists — please log in.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first (check your inbox).';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a few minutes and try again.';
  return 'Something went wrong. Please try again.';
}

const Login = () => {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/account';
  const [mode, setMode] = useState('login');            // 'login' | 'signup' | 'reset'
  const [values, setValues] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);         // { type: 'error' | 'success', text }
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  const set = (field) => (e) => setValues({ ...values, [field]: e.target.value });
  const switchMode = (m) => { setMode(m); setErrors({}); setMessage(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const schema = mode === 'signup' ? signUpSchema : mode === 'reset' ? resetSchema : loginSchema;
    const { data, errors: fieldErrors } = check(schema, values);
    setErrors(fieldErrors ?? {});
    if (fieldErrors) return;

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(data.email, data.password);
        if (error) setMessage({ type: 'error', text: friendly(error.message) });
        else navigate(next, { replace: true });
      } else if (mode === 'signup') {
        const { data: res, error } = await signUp(data.email, data.password, data.fullName);
        if (error) setMessage({ type: 'error', text: friendly(error.message) });
        else if (res.session) navigate(next, { replace: true });
        else setMessage({ type: 'success', text: 'Account created! Please check your email to confirm, then log in.' });
      } else {
        const { error } = await resetPassword(data.email);
        if (error) setMessage({ type: 'error', text: friendly(error.message) });
        else setMessage({ type: 'success', text: 'If this email has an account, a reset link is on its way.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const titles = { login: 'Welcome back', signup: 'Create your account', reset: 'Reset your password' };

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <p className="section-label mb-2">My Account</p>
        <h1 className="font-heading text-4xl font-semibold text-charcoal">{titles[mode]}</h1>
      </div>

      {mode !== 'reset' && (
        <div className="grid grid-cols-2 mb-6 border border-gray-200 rounded-sm overflow-hidden">
          {[['login', 'Log In'], ['signup', 'Create Account']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`py-2.5 font-body font-medium text-sm transition-colors ${
                mode === m ? 'bg-maroon-900 text-white' : 'bg-white text-charcoal hover:text-maroon-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow-soft p-6 sm:p-8 border border-gray-50 space-y-5">
        {message && (
          <p className={`font-body text-sm rounded-sm px-3 py-2 ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {message.text}
          </p>
        )}

        {mode === 'signup' && (
          <FormField label="Full name" name="fullName" autoComplete="name"
            value={values.fullName} onChange={set('fullName')} error={errors.fullName} />
        )}
        <FormField label="Email" name="email" type="email" autoComplete="email"
          value={values.email} onChange={set('email')} error={errors.email} />
        {mode !== 'reset' && (
          <FormField label="Password" name="password" type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={values.password} onChange={set('password')} error={errors.password}
            hint={mode === 'signup' ? 'At least 8 characters, with a letter and a number' : undefined} />
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </button>

        {mode === 'login' && (
          <button type="button" onClick={() => switchMode('reset')} className="block mx-auto font-body text-xs text-maroon-900 hover:underline">
            Forgot password?
          </button>
        )}
        {mode === 'reset' && (
          <button type="button" onClick={() => switchMode('login')} className="block mx-auto font-body text-xs text-maroon-900 hover:underline">
            Back to log in
          </button>
        )}

        {GOOGLE_ENABLED && mode !== 'reset' && (
          <>
            <div className="flex items-center gap-3 text-xs font-body text-gray-400">
              <span className="flex-1 h-px bg-gray-200" /> or <span className="flex-1 h-px bg-gray-200" />
            </div>
            <button type="button" onClick={signInWithGoogle} className="btn-secondary w-full flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">account_circle</span>
              Continue with Google
            </button>
          </>
        )}
      </form>

      <p className="text-center font-body text-xs text-gray-500 mt-6">
        <Link to="/collection" className="hover:text-maroon-900">← Continue shopping</Link>
      </p>
    </main>
  );
};

export default Login;
