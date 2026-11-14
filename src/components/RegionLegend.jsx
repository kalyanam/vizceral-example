import './regionLegend.css';

export default function RegionLegend ({ regions, app }) {
  let summary = 'All apps (aggregate)';
  if (app) {
    const details = {
      '4dc': 'active in all 4 DCs',
      '2region-active': 'active in both DCs of each region, failover is per region',
      '2region-standby': `active in ${app.dcs.join(' + ')}, warm standby in ${app.standbyDcs.join(' + ')}`
    };
    summary = `${app.fqdn}: ${details[app.mode]}`;
  }
  return (
    <div className="region-legend">
      <div className="region-legend-summary">{summary}</div>
      {regions.map((region, index) => (
        <div key={region.name} className={`region-legend-label ${index === 0 ? 'left' : 'right'}`}>
          {region.displayName} REGION
          <div className="region-legend-dcs">{region.dcs.join(' / ')}</div>
        </div>
      ))}
    </div>
  );
}
