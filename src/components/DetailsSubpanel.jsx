import { useState } from 'react';

export default function DetailsSubpanel ({
  title, expanded: initiallyExpanded = false, badge, children
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const id = title.replace(/\s/g, '_');
  const headingId = `${id}Heading`;
  const collapseId = `collapse${id}`;

  return (
    <div className="panel-group node-details-subpanel" role="tablist">
      <div className="panel panel-default">
        <div className="panel-heading" role="tab" id={headingId}>
          <h4 className="panel-title">
            <a
              role="button"
              href={`#${collapseId}`}
              aria-controls={collapseId}
              aria-expanded={expanded}
              className={`accordion-toggle${expanded ? '' : ' collapsed'}`}
              onClick={(event) => { event.preventDefault(); setExpanded(!expanded); }}
            >
              <span className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: '12px', paddingRight: expanded ? '5px' : undefined }}></span> {title.toUpperCase()} {badge ? <span className="badge">{badge}</span> : undefined}
            </a>
          </h4>
        </div>
        <div id={collapseId} className={`panel-collapse collapse${expanded ? ' show' : ''}`} role="tabpanel" aria-labelledby={headingId}>
          <div className="panel-body">
            <div className="subsection">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
