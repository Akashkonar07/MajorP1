import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Categories: add, rename, show/hide. A category with sarees cannot be deleted (move or hide instead).
const slugify = name => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const Row = ({ cat, count, onChanged }) => {
  const [name, setName] = useState(cat.name);
  const [error, setError] = useState('');
  const run = async (query) => {
    setError('');
    const { error: e } = await query;
    if (e) setError(e.code === '23505' ? 'That name is already used' : e.message);
    else onChanged();
  };
  const rename = () => {
    if (name.trim().length < 2 || name.trim().length > 60) { setError('2–60 characters'); return; }
    run(supabase.from('categories').update({ name: name.trim() }).eq('id', cat.id));   // web address (slug) stays the same
  };
  const remove = () => {
    if (window.confirm(`Delete the category "${cat.name}"?`)) run(supabase.from('categories').delete().eq('id', cat.id));
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input-field !py-2 flex-1 min-w-[160px]" value={name} onChange={e => setName(e.target.value)} aria-label="Category name" />
        <Link to={`/admin/sarees`} className="font-body text-xs text-gray-500 w-20 text-center">{count} saree{count !== 1 ? 's' : ''}</Link>
        <button onClick={rename} disabled={name === cat.name} className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-30">Rename</button>
        <button onClick={() => run(supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id))}
          className={`px-3 py-1.5 rounded-sm border font-body text-xs ${cat.is_active ? 'border-gray-200 text-gray-600' : 'border-emerald-600 text-emerald-700'}`}>
          {cat.is_active ? 'Hide' : 'Show'}
        </button>
        {count === 0 && <button onClick={remove} className="font-body text-xs text-gray-400 hover:text-red-600 underline">Delete</button>}
      </div>
      <p className="font-body text-[11px] text-gray-400 mt-1">/category/{cat.slug}{!cat.is_active && ' · hidden from menus and filters'}</p>
      {error && <p className="font-body text-xs text-red-600">{error}</p>}
    </div>
  );
};

const Categories = () => {
  const [cats, setCats] = useState(null);
  const [counts, setCounts] = useState({});
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('categories').select('id, name, slug, is_active').order('name'),
      supabase.from('products').select('category_id'),
    ]);
    setCats(c ?? []);
    setCounts((p ?? []).reduce((acc, x) => ({ ...acc, [x.category_id]: (acc[x.category_id] ?? 0) + 1 }), {}));
  };
  useEffect(() => { load(); }, []);

  const add = async e => {
    e.preventDefault();
    const name = newName.trim();
    if (name.length < 2 || name.length > 60 || !slugify(name)) { setError('Enter a name (2–60 characters)'); return; }
    const { error: err } = await supabase.from('categories').insert({ name, slug: slugify(name) });
    if (err) { setError(err.code === '23505' ? 'That category already exists' : err.message); return; }
    setNewName('');
    setError('');
    load();
  };

  return (
    <div className="max-w-3xl">
      <p className="section-label mb-1">Online Store</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-1">Categories</h1>
      <p className="font-body text-sm text-gray-500 mb-6">
        Hiding a category removes it from menus and filters; its sarees stay on the website unless you hide them too.
      </p>
      <form onSubmit={add} className="bg-white rounded-lg shadow-soft border border-gray-50 p-4 mb-4 flex flex-wrap gap-2">
        <input className="input-field !py-2 flex-1 min-w-[180px]" value={newName} placeholder="New category, e.g. Organza Sarees" onChange={e => setNewName(e.target.value)} />
        <button className="btn-primary !py-2">Add</button>
        {error && <p className="w-full font-body text-xs text-red-600">{error}</p>}
      </form>
      <div className="bg-white rounded-lg shadow-soft border border-gray-50 px-4">
        {cats === null ? <div className="h-48 animate-pulse" /> : cats.map(c => <Row key={c.id} cat={c} count={counts[c.id] ?? 0} onChanged={load} />)}
      </div>
    </div>
  );
};

export default Categories;
