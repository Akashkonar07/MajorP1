import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <main className="max-w-xl mx-auto px-4 py-24 text-center">
    <p className="font-heading text-7xl font-semibold text-maroon-900 mb-2">404</p>
    <h1 className="font-heading text-3xl text-charcoal mb-3">This page is not here</h1>
    <p className="font-body text-sm text-gray-500 mb-8">The link may be old, or the saree may no longer be in our collection.</p>
    <div className="flex flex-wrap justify-center gap-3">
      <Link to="/collection" className="btn-primary">Browse sarees</Link>
      <Link to="/" className="btn-secondary">Home</Link>
    </div>
  </main>
);

export default NotFound;
