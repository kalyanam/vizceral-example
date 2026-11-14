/**
 *
 *  Copyright 2016 Netflix, Inc.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */
import { isEqual } from 'lodash';
import { useEffect, useRef } from 'react';

import VizceralGraph from './vizceral/vizceral';
import './vizceral-react.css';

const EVENTS = {
  viewChanged: 'viewChanged',
  objectHighlighted: 'objectHighlighted',
  objectHovered: 'objectHovered',
  nodeUpdated: 'nodeUpdated',
  nodeContextSizeChanged: 'nodeContextSizeChanged',
  matchesFound: 'matchesFound',
  viewUpdated: 'viewUpdated'
};

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

function applyStyles (vizceral, styles) {
  const customStyles = vizceral.getStyles().reduce((result, styleName) => {
    result[styleName] = styles[styleName] || result[styleName];
    return result;
  }, {});
  vizceral.updateStyles(customStyles);
}

/**
 * React wrapper around the vizceral WebGL traffic graph.
 */
export default function Vizceral (props) {
  const {
    traffic = EMPTY_OBJECT,
    view = EMPTY_ARRAY,
    objectToHighlight = null,
    filters = EMPTY_ARRAY,
    definitions = EMPTY_OBJECT,
    styles = EMPTY_OBJECT,
    modes,
    match = '',
    showLabels = true,
    allowDraggingOfNodes = false,
    targetFramerate = null
  } = props;

  const canvasRef = useRef(null);
  const vizceralRef = useRef(null);
  const propsRef = useRef(props);
  const prevRef = useRef(null);

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const vizceral = new VizceralGraph(canvasRef.current, targetFramerate);
    vizceralRef.current = vizceral;
    applyStyles(vizceral, styles);

    Object.entries(EVENTS).forEach(([propName, eventName]) => {
      vizceral.on(eventName, (...args) => {
        const handler = propsRef.current[propName];
        if (handler) { handler(...args); }
      });
    });

    vizceral.setOptions({ allowDraggingOfNodes, showLabels });
    if (filters.length > 0) { vizceral.setFilters(filters); }
    if (Object.keys(definitions).length > 0) { vizceral.updateDefinitions(definitions); }

    // Finish the current call stack before setting the view so the initial graph animates properly.
    const timer = setTimeout(() => {
      const current = propsRef.current;
      vizceral.setView(current.view || EMPTY_ARRAY, current.objectToHighlight);
      vizceral.updateData(current.traffic || EMPTY_OBJECT);
      vizceral.animate(performance.now());
      vizceral.updateBoundingRectCache();
    }, 0);

    return () => {
      clearTimeout(timer);
      vizceral.requestAnimationFrame = () => {};
      vizceralRef.current = null;
    };
    // The graph is created once; subsequent prop changes are diffed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const vizceral = vizceralRef.current;
    const prev = prevRef.current;
    const next = {
      traffic, view, objectToHighlight, filters, definitions, styles, modes, match, showLabels, allowDraggingOfNodes
    };
    prevRef.current = next;
    if (!vizceral || !prev) { return; }

    if (!isEqual(next.styles, prev.styles)) { applyStyles(vizceral, next.styles); }
    // Load new data before changing the view so a view into the new data can resolve.
    next.traffic.updated = next.traffic.updated || Date.now();
    if (!prev.traffic.nodes || next.traffic.updated > (prev.traffic.updated || 0)) {
      vizceral.updateData(next.traffic);
    }
    if (!isEqual(next.view, prev.view) || !isEqual(next.objectToHighlight, prev.objectToHighlight)) {
      vizceral.setView(next.view, next.objectToHighlight);
    }
    if (!isEqual(next.filters, prev.filters)) { vizceral.setFilters(next.filters); }
    if (next.showLabels !== prev.showLabels || next.allowDraggingOfNodes !== prev.allowDraggingOfNodes) {
      vizceral.setOptions({ allowDraggingOfNodes: next.allowDraggingOfNodes, showLabels: next.showLabels });
    }
    if (!isEqual(next.modes, prev.modes)) { vizceral.setModes(next.modes); }
    if (!isEqual(next.definitions, prev.definitions)) { vizceral.updateDefinitions(next.definitions); }
    if (next.match !== prev.match) { vizceral.findNodes(next.match); }

  });

  return (
    <div className="vizceral">
      <canvas style={{ width: '100%', height: '100%' }} ref={canvasRef} />
      <div className="vizceral-notice"></div>
    </div>
  );
}
