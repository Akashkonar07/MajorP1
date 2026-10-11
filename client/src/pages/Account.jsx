import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { check, profileSchema } from '../lib/validation';
import { formatPrice } from '../lib/catalogue';
import { deleteAddress, fetchMyAddresses, fetchMyOrders } from '../lib/orders';

const ProfileForm = ({ profile, updateProfile }) => {
  const [values, setValues] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);         // 'saving' | 'saved' | 'error'

  const handleSave = async (e) => {
    e.preventDefault();
    const { data, errors: fieldErrors } = check(profileSchema, values);
    setErrors(fieldErrors ?? {});
    if (fieldErrors) return;
    setStatus('saving');
    const { error } = await updateProfile({ full_name: data.full_name, phone: data.phone || null });
    setStatus(error ? 'error' : 'saved');
  };

  return (
    <form onSubmit={handleSave} noValidate className="space-y-4">
      <FormField label="Full name" name="full_name" autoComplete="name"
        value={values.full_name} onChange={e => setValues({ ...values, full_name: e.target.value })} error={errors.full_name} />
      <FormField label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
        placeholder="10-digit mobile" value={values.phone}
        onChange={e => setValues({ ...values, phone: e.target.value })} error={errors.phone} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === 'saving'} className="btn-primary disabled:opacity-60">
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="font-body text-xs text-emerald-700">Saved ✓</span>}
        {status === 'error' && <span className="font-body text-xs text-red-600">Could not save. Please try again.</span>}
      </div>
    </form>
  );
};

const MyOrders = () => {
  const [orders, setOrders] = useState(null);
  useEffect(() => { fetchMyOrders().then(setOrders).catch(() => setOrders([])); }, []);

  if (orders === null) return <div className="h-20 bg-gray-50 rounded animate-pulse" />;
  if (orders.length === 0) {
    return (
      <>
        <p className="font-body text-sm text-gray-500 mb-4">You have not placed any orders yet.</p>
        <Link to="/collection" className="font-body text-sm text-maroon-900 hover:underline">Browse sarees →</Link>
      </>
    );
  }
  return (
    <div className="divide-y divide-gray-100">
      {orders.map(o => (
        <Link key={o.id} to={`/order/${o.order_no}`} className="flex items-center gap-3 py-3 hover:bg-maroon-50/40 -mx-2 px-2 rounded">
          <div className="flex-1 min-w-0 font-body">
            <p className="text-sm font-semibold text-charcoal">{o.order_no}</p>
            <p className="text-xs text-gray-500">
              {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{o.count} saree{o.count !== 1 ? 's' : ''} · {formatPrice(o.total)}
            </p>
          </div>
          <OrderStatusBadge order={o} />
          <span className="material-symbols-outlined text-gray-400 text-base">chevron_right</span>
        </Link>
      ))}
    </div>
  );
};

const SavedAddresses = () => {
  const [list, setList] = useState(null);
  const load = () => fetchMyAddresses().then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const remove = async id => {
    if (!window.confirm('Delete this address?')) return;
    await deleteAddress(id).catch(() => {});
    load();
  };

  if (list === null) return <div className="h-16 bg-gray-50 rounded animate-pulse" />;
  if (list.length === 0) return <p className="font-body text-sm text-gray-500">Addresses you use at checkout will be saved here.</p>;
  return (
    <div className="space-y-2">
      {list.map(a => (
        <div key={a.id} className="flex gap-3 p-3 border border-gray-100 rounded-sm font-body text-sm">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-charcoal">{a.full_name} · {a.phone}</p>
            <p className="text-gray-600">{[a.line1, a.line2, `${a.city}, ${a.state} – ${a.pincode}`].filter(Boolean).join(', ')}</p>
          </div>
          <button onClick={() => remove(a.id)} className="text-gray-400 hover:text-red-600 self-start" aria-label="Delete address">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      ))}
    </div>
  );
};

const Account = () => {
  const { user, profile, isAdmin, loading, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <main className="max-w-3xl mx-auto px-4 py-16"><div className="h-40 bg-gray-100 rounded-lg animate-pulse" /></main>;
  }
  if (!user) return <Navigate to="/login?next=/account" replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="section-label mb-1">My Account</p>
          <h1 className="font-heading text-4xl font-semibold text-charcoal">
            Namaste{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="font-body text-sm text-gray-500 mt-1">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Link to="/admin" className="btn-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              Admin Panel
            </Link>
          )}
          <button onClick={handleSignOut} className="btn-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-base">logout</span>
            Sign out
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="bg-white rounded-lg shadow-soft p-6 border border-gray-50">
          <h2 className="font-heading text-2xl font-semibold text-charcoal mb-4">Profile</h2>
          {/* key: re-fill the form once the profile has loaded */}
          <ProfileForm key={profile?.id ?? 'loading'} profile={profile} updateProfile={updateProfile} />
        </section>

        <section className="bg-white rounded-lg shadow-soft p-6 border border-gray-50">
          <h2 className="font-heading text-2xl font-semibold text-charcoal mb-3">My Orders</h2>
          <MyOrders />
        </section>

        <section className="bg-white rounded-lg shadow-soft p-6 border border-gray-50">
          <h2 className="font-heading text-2xl font-semibold text-charcoal mb-3">Saved Addresses</h2>
          <SavedAddresses />
        </section>
      </div>
    </main>
  );
};

export default Account;
