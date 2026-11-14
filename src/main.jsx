import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import '@fontsource/source-sans-pro/200.css';
import '@fontsource/source-sans-pro/300.css';
import '@fontsource/source-sans-pro/400.css';
import '@fontsource/source-sans-pro/600.css';
import '@fontsource/source-sans-pro/700.css';
import { createRoot } from 'react-dom/client';

import './app.css';
import TrafficFlow from './components/TrafficFlow';

// Vizceral draws labels on canvas, so the webfonts must be loaded before the graph renders.
const fontWeights = [300, 400, 600, 700];
Promise.allSettled(fontWeights.map(weight => document.fonts.load(`${weight} 16px "Source Sans Pro"`)))
  .then(() => {
    createRoot(document.getElementById('traffic')).render(<TrafficFlow />);
  });
