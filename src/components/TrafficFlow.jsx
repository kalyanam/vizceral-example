import { filter, get, map } from 'lodash';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';

import Vizceral from '../lib/VizceralReact';
import { APPS, APPS_BY_FQDN, REGIONS, buildOnPremTraffic } from '../onprem/topology';
import AppPicker from './AppPicker';
import Breadcrumbs from './Breadcrumbs';
import DetailsPanelConnection from './DetailsPanelConnection';
import DetailsPanelNode from './DetailsPanelNode';
import DisplayOptions from './DisplayOptions';
import FilterControls from './FilterControls';
import LoadingCover from './LoadingCover';
import Locator from './Locator';
import OptionsPanel from './OptionsPanel';
import PhysicsOptions, { defaultPhysicsOptions } from './PhysicsOptions';
import RegionLegend from './RegionLegend';
import UpdateStatus from './UpdateStatus';
import filterStore from './filterStore';
import useFilterStore from './useFilterStore';

import './trafficFlow.css';

const PANEL_WIDTH = 400;
const NO_MATCHES = { total: -1, visible: -1 };
const MODES = { detailedNode: 'volume' };

const TOPOLOGY_PARAM = new URLSearchParams(window.location.search).get('topology');
const IS_ONPREM = (TOPOLOGY_PARAM || import.meta.env.VITE_TOPOLOGY) === 'onprem';
const ONPREM_REFRESH_MS = 15000;

function buildUrl (view, highlighted, app) {
  const params = new URLSearchParams();
  if (TOPOLOGY_PARAM) { params.set('topology', TOPOLOGY_PARAM); }
  if (app) { params.set('app', app); }
  if (highlighted) { params.set('highlighted', highlighted); }
  const query = params.toString();
  return `/${view.join('/')}${query ? `?${query}` : ''}`;
}

function getInitialRoute () {
  const [, region, node] = window.location.pathname.split('/');
  const currentView = [];
  if (region) {
    currentView.push(decodeURIComponent(region));
    if (node) { currentView.push(decodeURIComponent(node)); }
  }
  const params = new URLSearchParams(window.location.search);
  const objectToHighlight = params.get('highlighted') || undefined;
  const app = IS_ONPREM && APPS_BY_FQDN[params.get('app')] ? params.get('app') : undefined;
  return { currentView, objectToHighlight, app };
}

function mergePhysicsOptions (current, changes) {
  return {
    ...current,
    ...changes,
    hooksSprings: { ...current.hooksSprings, ...changes.hooksSprings },
    particles: { ...current.particles, ...changes.particles }
  };
}

export default function TrafficFlow () {
  const [initialRoute] = useState(getInitialRoute);
  const [currentView, setCurrentView] = useState(initialRoute.currentView);
  const [objectToHighlight, setObjectToHighlight] = useState(initialRoute.objectToHighlight);
  const [highlightedObject, setHighlightedObject] = useState();
  const [redirectedFrom, setRedirectedFrom] = useState();
  const [currentGraph, setCurrentGraph] = useState(null);
  const [displayOptions, setDisplayOptions] = useState({ allowDraggingOfNodes: false, showLabels: true });
  const [physicsOptions, setPhysicsOptions] = useState(defaultPhysicsOptions);
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState(NO_MATCHES);
  const [sampleTraffic, setSampleTraffic] = useState({ nodes: [], connections: [] });
  const [sampleUpdateStatus, setSampleUpdateStatus] = useState([]);
  const [timeOffset, setTimeOffset] = useState(0);
  const [app, setApp] = useState(initialRoute.app);
  const [onPremTime, setOnPremTime] = useState(() => Date.now());
  // Vizceral mutates its graph objects in place; this forces a re-render when it says the view changed.
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const filtersVersion = useFilterStore();
  const filters = useMemo(() => filterStore.getFiltersArray(), [filtersVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const poppedState = useRef(false);
  const isFirstHistoryEntry = useRef(true);

  // Load sample data
  useEffect(() => {
    if (IS_ONPREM) { return; }
    fetch(`${import.meta.env.BASE_URL}sample_data.json`, { headers: { Accept: 'application/json' } })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        const clientUpdateTime = Date.now();
        const status = map(filter(data.nodes, n => n.name !== 'INTERNET'), node => ({ region: node.name, updated: node.updated }));
        setSampleUpdateStatus(status);
        setTimeOffset(data.serverUpdateTime ? clientUpdateTime - data.serverUpdateTime : 0);
        setSampleTraffic(data);
      })
      .catch(err => console.error('Failed to load sample data', err));
  }, []);

  // Synthetic on-prem data refreshes periodically so the update status stays current.
  useEffect(() => {
    if (!IS_ONPREM) { return undefined; }
    const timer = setInterval(() => setOnPremTime(Date.now()), ONPREM_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  const onPremTraffic = useMemo(() => (IS_ONPREM ? buildOnPremTraffic(app, onPremTime) : null), [app, onPremTime]);
  const trafficData = onPremTraffic || sampleTraffic;
  const regionUpdateStatus = useMemo(() => (onPremTraffic
    ? map(filter(onPremTraffic.nodes, n => n.name !== 'INTERNET'), node => ({ region: node.name, updated: node.updated }))
    : sampleUpdateStatus), [onPremTraffic, sampleUpdateStatus]);

  // Browser history support
  useEffect(() => {
    const handlePopState = () => {
      const state = window.history.state || {};
      poppedState.current = true;
      setCurrentView(state.selected || []);
      setObjectToHighlight(state.highlighted);
      setApp(state.app);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const highlightedObjectName = highlightedObject ? highlightedObject.getName() : undefined;
  useEffect(() => {
    const title = ['Vizceral', ...currentView].join(' / ');
    document.title = title;

    if (poppedState.current) {
      poppedState.current = false;
      return;
    }
    const url = buildUrl(currentView, highlightedObjectName, app);
    const state = { title, url, selected: currentView, highlighted: highlightedObjectName, app };
    if (isFirstHistoryEntry.current) {
      isFirstHistoryEntry.current = false;
      window.history.replaceState(state, title, url);
    } else {
      window.history.pushState(state, title, url);
    }
    // Only navigation changes should create history entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView[0], currentView[1], highlightedObjectName, app]);

  // Keyboard interactivity
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCurrentView(view => (view.length > 0 ? view.slice(0, -1) : view));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const viewChanged = (data) => {
    setCurrentView(data.view);
    setSearchTerm('');
    setMatches(NO_MATCHES);
    setRedirectedFrom(data.redirectedFrom);
    if (Object.hasOwn(data, 'graph')) {
      const newGraph = data.graph || null;
      if (newGraph !== currentGraph) {
        setCurrentGraph(newGraph);
        if (newGraph) {
          setPhysicsOptions(mergePhysicsOptions(defaultPhysicsOptions, newGraph.getPhysicsOptions()));
        }
      }
    }
  };

  const objectHighlighted = (object) => {
    // objectToHighlight is kept in sync for diffing in the Vizceral component; since the object is already highlighted it is a noop
    setHighlightedObject(object);
    setObjectToHighlight(object ? object.getName() : undefined);
    setSearchTerm('');
    setMatches(NO_MATCHES);
    setRedirectedFrom(undefined);
  };

  const zoomCallback = () => {
    const newView = currentView.slice();
    if (highlightedObject) {
      newView.push(highlightedObject.name);
      setObjectToHighlight(undefined);
    } else if (newView.length > 0) {
      setObjectToHighlight(newView.pop());
    }
    setCurrentView(newView);
  };

  const physicsOptionsChanged = (changes) => {
    setPhysicsOptions(current => mergePhysicsOptions(current, changes));
    if (currentGraph) {
      currentGraph.setPhysicsOptions(changes);
    }
  };

  const detailsClosed = () => {
    if (currentGraph.type === 'focused') {
      if (currentGraph.parentGraph) {
        if (currentView.length > 0) {
          setCurrentView(currentView.slice(0, -1));
        }
        if (currentGraph.parentGraph.type !== 'focused') {
          setHighlightedObject(undefined);
        }
      }
    } else {
      setHighlightedObject(undefined);
    }
  };

  const filtersCleared = () => {
    if (!filterStore.isClear()) {
      if (!filterStore.isDefault()) {
        filterStore.resetFilters();
      } else {
        filterStore.clearFilters();
      }
    }
  };

  const nodeClicked = (node) => {
    if (currentView.length === 1) {
      setObjectToHighlight(node.getName());
    } else if (currentView.length === 2) {
      setCurrentView([currentView[0], node.getName()]);
    }
  };

  const appChanged = (fqdn) => {
    if (fqdn === app) { return; }
    setApp(fqdn);
    setHighlightedObject(undefined);
    setObjectToHighlight(undefined);
    // Service names differ per app, so stay at the DC level at most.
    setCurrentView(view => view.slice(0, 1));
  };

  const resetLayoutButtonClicked = () => {
    if (currentGraph) {
      currentGraph._relayout();
    }
  };

  const viewUpdated = useCallback(() => forceUpdate(), []);

  const focusedNode = currentGraph && currentGraph.focusedNode;
  const nodeToShowDetails = focusedNode || (highlightedObject && highlightedObject.type === 'node' ? highlightedObject : undefined);
  const connectionToShowDetails = highlightedObject && highlightedObject.type === 'connection' ? highlightedObject : undefined;
  const showBreadcrumbs = trafficData && trafficData.nodes && trafficData.nodes.length > 0;
  const breadcrumbsRoot = get(trafficData, 'name', 'root');

  const locatorMatches = currentGraph
    ? {
      totalMatches: matches.total,
      visibleMatches: matches.visible,
      total: currentGraph.nodeCounts.total,
      visible: currentGraph.nodeCounts.visible
    }
    : undefined;

  return (
    <div className="vizceral-container">
      {redirectedFrom && (
        <Alert variant="info" dismissible onClose={() => setRedirectedFrom(undefined)}>
          <strong>{redirectedFrom.join('/') || '/'}</strong> does not exist, you were redirected to <strong>{currentView.join('/') || '/'}</strong> instead
        </Alert>
      )}
      <div className="subheader">
        {showBreadcrumbs && <Breadcrumbs rootTitle={breadcrumbsRoot} navigationStack={currentView} navigationCallback={setCurrentView} />}
        {showBreadcrumbs && <UpdateStatus status={regionUpdateStatus} baseOffset={timeOffset} warnThreshold={180000} />}
        <div style={{ float: 'right', paddingTop: '4px' }}>
          {IS_ONPREM && <AppPicker key={app || ''} apps={APPS} value={app} onChange={appChanged} />}
          {!focusedNode && locatorMatches && <Locator changeCallback={setSearchTerm} searchTerm={searchTerm} matches={locatorMatches} clearFilterCallback={filtersCleared} />}
          <OptionsPanel title="Filters"><FilterControls /></OptionsPanel>
          <OptionsPanel title="Display"><DisplayOptions options={displayOptions} changedCallback={options => setDisplayOptions(current => ({ ...current, ...options }))} /></OptionsPanel>
          <OptionsPanel title="Physics"><PhysicsOptions options={physicsOptions} changedCallback={physicsOptionsChanged} /></OptionsPanel>
          <a role="button" className="reset-layout-link" onClick={resetLayoutButtonClicked}>Reset Layout</a>
        </div>
      </div>
      <div className="service-traffic-map">
        <div style={{
          position: 'absolute', top: '0px', right: nodeToShowDetails || connectionToShowDetails ? '380px' : '0px', bottom: '0px', left: '0px'
        }}>
          <Vizceral
            traffic={trafficData}
            view={currentView}
            showLabels={displayOptions.showLabels}
            filters={filters}
            viewChanged={viewChanged}
            viewUpdated={viewUpdated}
            objectHighlighted={objectHighlighted}
            objectToHighlight={objectToHighlight}
            matchesFound={setMatches}
            match={searchTerm}
            modes={MODES}
            allowDraggingOfNodes={displayOptions.allowDraggingOfNodes}
          />
          {IS_ONPREM && currentGraph && currentView.length === 0 && <RegionLegend regions={REGIONS} app={APPS_BY_FQDN[app]} />}
        </div>
        {nodeToShowDetails && (
          <DetailsPanelNode
            node={nodeToShowDetails}
            region={currentView[0]}
            width={PANEL_WIDTH}
            zoomCallback={zoomCallback}
            closeCallback={detailsClosed}
            nodeClicked={nodeClicked}
            openAppCallback={IS_ONPREM && !app ? appChanged : undefined}
          />
        )}
        {connectionToShowDetails && (
          <DetailsPanelConnection
            connection={connectionToShowDetails}
            closeCallback={detailsClosed}
          />
        )}
        <LoadingCover show={!currentGraph} />
      </div>
    </div>
  );
}
