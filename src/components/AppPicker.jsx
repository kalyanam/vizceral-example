import { useState } from 'react';

import './appPicker.css';

export const MODE_LABELS = {
  '4dc': '4 DC, active in all DCs',
  '2region-active': '2 region, both DCs active, regional failover',
  '2region-standby': '2 region, active/standby DC per region'
};

export default function AppPicker ({ apps, value, onChange }) {
  const [text, setText] = useState(value || '');
  const known = !text || apps.some(app => app.fqdn === text);

  const commit = (next) => {
    const fqdn = next.trim().toLowerCase();
    if (!fqdn) { onChange(undefined); } else if (apps.some(app => app.fqdn === fqdn)) { onChange(fqdn); }
  };

  return (
    <div className="app-picker">
      <input
        type="search"
        list="app-picker-options"
        className={`form-control app-picker-input${known ? '' : ' is-invalid'}`}
        placeholder="All apps (enter FQDN)"
        aria-label="Application FQDN"
        value={text}
        onChange={(event) => {
          setText(event.currentTarget.value);
          // Picking from the datalist (or clearing) fires a change with a complete value.
          if (!event.currentTarget.value || apps.some(app => app.fqdn === event.currentTarget.value)) { commit(event.currentTarget.value); }
        }}
        onKeyDown={(event) => { if (event.key === 'Enter') { commit(text); } }}
        onBlur={() => commit(text)}
      />
      <datalist id="app-picker-options">
        {apps.map(app => (
          <option key={app.fqdn} value={app.fqdn}>{MODE_LABELS[app.mode]}</option>
        ))}
      </datalist>
      <span className="bi bi-globe2 app-picker-icon"></span>
    </div>
  );
}
