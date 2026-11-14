import ConnectionList from './ConnectionList';
import DetailsSubpanel from './DetailsSubpanel';
import Notices from './Notices';
import SubNodeList from './SubNodeList';

import './detailsPanel.css';

export default function DetailsPanelNode ({
  node, region = '', zoomCallback, closeCallback
}) {
  const isZoomOut = node.graphRenderer === 'focused';
  const showConnections = !node.isEntryNode();

  return (
    <div className="details-panel">
      <div className="subsection">
        <div className="details-panel-title">{node.getName()}
          <span title={`Zoom ${isZoomOut ? 'out of' : 'into'} node view`} className={`bi clickable zoom-icon ${isZoomOut ? 'bi-box-arrow-right' : 'bi-box-arrow-in-right'}`} onClick={zoomCallback}></span>
        </div>
        <div className="details-panel-close" onClick={closeCallback}>
          <span className="bi bi-x-lg" aria-hidden="true"></span>
        </div>
      </div>
      <Notices notices={node.notices || []} />
      {showConnections && node.nodes && (
        <DetailsSubpanel key={`subnodes-${node.getName()}`} title="Sub Nodes" expanded badge={node.nodes.length}>
          <div>
            <div className="details-panel-subtitle"><span style={{ fontWeight: 600 }}>Traffic by Sub Node</span></div>
            <SubNodeList nodes={node.nodes} region={region} />
          </div>
        </DetailsSubpanel>
      )}
      {showConnections && (
        <DetailsSubpanel key={`incoming-${node.getName()}`} title="Incoming Connections" badge={node.incomingConnections.length}>
          <ConnectionList connections={node.incomingConnections} direction="incoming" />
        </DetailsSubpanel>
      )}
      <DetailsSubpanel key={`outgoing-${node.getName()}`} title="Outgoing Connections" badge={node.outgoingConnections.length}>
        <ConnectionList connections={node.outgoingConnections} direction="outgoing" />
      </DetailsSubpanel>
    </div>
  );
}
