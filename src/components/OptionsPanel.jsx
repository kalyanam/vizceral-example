import { useEffect, useRef, useState } from 'react';

import './optionsPanel.css';

export default function OptionsPanel ({ title, children }) {
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const shouldAlignRight = () => {
    const boundingRect = panelRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    return boundingRect.left + contentRect.width > window.innerWidth;
  };

  useEffect(() => {
    if (!showOptions) { return undefined; }
    const handleDocumentClick = (event) => {
      if (!panelRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [showOptions]);

  const onTitleClicked = () => {
    setAlignRight(shouldAlignRight());
    setShowOptions(!showOptions);
  };

  const panelStyles = {
    visibility: showOptions ? undefined : 'hidden',
    border: '1px solid grey',
    right: alignRight ? 0 : undefined
  };

  return (
    <div ref={panelRef} className="options-panel">
      <div className="options-panel-title" onClick={onTitleClicked}>
        <a role="button" className="options-link">
          {title}
          <span className="caret"></span>
        </a>
      </div>
      <div ref={contentRef} className="options-panel-content" style={panelStyles}>
        {children}
      </div>
    </div>
  );
}
