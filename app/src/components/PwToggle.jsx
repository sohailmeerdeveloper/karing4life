import { useState } from 'react';
import { Icon } from './Icon.jsx';

/** Show/hide button for the password input with id `target`. */
export function PwToggle({ target }) {
  const [shown, setShown] = useState(false);
  return (
    <button className="pw-toggle" type="button" aria-label={shown ? 'Hide password' : 'Show password'}
      onClick={() => { const i = document.getElementById(target); if (!i) return; i.type = shown ? 'password' : 'text'; setShown(!shown); }}>
      <Icon name={shown ? 'eye-off' : 'eye'} />
    </button>
  );
}
