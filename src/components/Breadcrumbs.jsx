import './breadcrumbs.css';

export default function Breadcrumbs ({ rootTitle, navigationStack, navigationCallback }) {
  const navStack = [rootTitle, ...navigationStack];

  return (
    <div className="breadcrumbs">
      <ol>
        {navStack.map((state, index) => (index !== navStack.length - 1
          ? <li key={index + state}><a className="clickable" onClick={() => navigationCallback(navigationStack.slice(0, index))}>{state}</a></li>
          : <li key={index + state}>{state}</li>))}
      </ol>
    </div>
  );
}
