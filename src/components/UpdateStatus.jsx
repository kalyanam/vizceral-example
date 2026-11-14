import { useEffect, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import './updateStatus.css';

function msToTimeAgo (ms) {
  if (!ms) { return 'Unknown'; }
  const secs = Math.round(ms / 1000);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = Math.ceil(secs % 60);

  const timeAgo = [];
  if (hours > 0) { timeAgo.push(`${hours}h`); }
  if (hours > 0 || minutes > 0) { timeAgo.push(`${minutes}m`); }
  timeAgo.push(`${seconds}s`);
  return timeAgo.join(':');
}

export default function UpdateStatus ({ status, baseOffset = 0, warnThreshold }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  const currentTime = now - baseOffset;
  const statuses = status.map(s => ({ ...s, fresh: currentTime - (s.updated || 0) < warnThreshold }));
  const freshData = statuses.every(s => s.fresh);

  const tooltip = (
    <Tooltip id="update-status">
      <p className="header">Data last refreshed</p>
      <table className="table table-sm table-borderless">
        <tbody>
          {statuses.map(s => (
            <tr key={s.region}>
              <td>{s.region}:</td>
              <td><span className={s.fresh ? 'severity0' : 'severity1'}>{msToTimeAgo(now - s.updated)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tooltip>
  );

  return (
    <div className="update-status">
      <OverlayTrigger placement="bottom" overlay={tooltip}>
        <span className={`bi bi-arrow-repeat ${freshData ? 'severity0' : 'severity1'}`}></span>
      </OverlayTrigger>
    </div>
  );
}
