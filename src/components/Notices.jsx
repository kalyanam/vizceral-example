export default function Notices ({ notices }) {
  return (
    <div className="details-panel-description subsection"><span style={{ fontWeight: 600 }}>Notices</span>&nbsp;
      {notices.length > 0
        ? notices.map(notice => (
          <div key={notice.title}>
            {notice.link
              ? <span>{notice.title} <a href={notice.link} target="_blank" rel="noopener noreferrer"><span className="bi bi-box-arrow-up-right"></span></a></span>
              : notice.title}
          </div>
        ))
        : <div>None</div>}
    </div>
  );
}
