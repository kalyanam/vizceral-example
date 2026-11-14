import { useEffect, useState } from 'react';

import logo from './vizceral-mark.png';
import './loadingCover.css';

const helperStyles = {
  display: 'inline-block',
  height: '100%',
  verticalAlign: 'middle'
};

const loaderStyles = {
  display: 'inline-block',
  verticalAlign: 'middle',
  fontSize: '1.5em',
  color: '#555'
};

const FADE_DURATION = 1000;

export default function LoadingCover ({ show }) {
  const [faded, setFaded] = useState(!show);
  if (show && faded) {
    setFaded(false);
  }
  const fading = !show && !faded;
  const showing = !faded;

  useEffect(() => {
    if (show) { return undefined; }
    const timer = setTimeout(() => setFaded(true), FADE_DURATION);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <div className="loading-cover-wrapper" style={{ display: showing ? 'initial' : 'none' }}>
      {showing && (
        <div className="loading-cover" style={fading ? { opacity: 0, transition: `opacity ${FADE_DURATION}ms linear` } : undefined}>
          <span style={helperStyles}></span>
          <div style={loaderStyles}>
            <img className="loading-image" src={logo} alt="" />
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
