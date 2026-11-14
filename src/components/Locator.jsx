import './locator.css';

const style = {
  display: 'inline-block',
  position: 'relative'
};

const listStyle = {
  display: 'inline-block',
  position: 'relative',
  paddingRight: '5px'
};

export default function Locator ({
  searchTerm, changeCallback, clearFilterCallback, matches
}) {
  const totalServices = matches.totalMatches > -1 ? matches.totalMatches : matches.total;
  const filteredServices = totalServices - (matches.visibleMatches > -1 ? matches.visibleMatches : matches.visible);

  return (
    <div style={style}>
      <div style={listStyle}>{totalServices} services / {filteredServices} filtered &nbsp;
        {filteredServices > 0 && <span className="clickable" onClick={clearFilterCallback}>(show)</span>}
      </div>
      <div style={style}>
        <input type="search" className="form-control locator-input" placeholder="Locate Service" onChange={event => changeCallback(event.currentTarget.value)} value={searchTerm} />
        <span className="bi bi-search locator-icon"></span>
      </div>
    </div>
  );
}
