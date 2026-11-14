import Notices from './Notices';

import './detailsPanel.css';

export default function DetailsPanelConnection ({ connection, closeCallback }) {
  return (
    <div className="details-panel">
      <div className="subsection">
        <div className="details-panel-title">{connection.getName()}</div>
        <div className="details-panel-close" onClick={closeCallback}>
          <span className="bi bi-x-lg" aria-hidden="true"></span>
        </div>
      </div>
      <Notices notices={connection.notices || []} />
    </div>
  );
}
