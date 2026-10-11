import React, { useState } from 'react';

// Label + input + error message, styled like the rest of the site.
// Password fields get an eye button to show/hide what is typed.
const FormField = ({ label, name, error, hint, type = 'text', ...inputProps }) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={name} className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && visible ? 'text' : type}
          className={`input-field ${isPassword ? 'pr-12' : ''} ${error ? 'border-red-400' : ''}`}
          aria-invalid={!!error}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            title={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-maroon-900"
          >
            <span className="material-symbols-outlined text-xl">{visible ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
      {error ? (
        <p className="font-body text-xs text-red-600 mt-1">{error}</p>
      ) : hint ? (
        <p className="font-body text-xs text-gray-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
};

export default FormField;
