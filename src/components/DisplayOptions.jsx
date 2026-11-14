export default function DisplayOptions ({ options, changedCallback }) {
  const onCheckBoxChanged = (event) => {
    changedCallback({ [event.target.id]: event.target.checked });
  };

  return (
    <div>
      <div>
        <input type="checkbox" id="allowDraggingOfNodes" checked={options.allowDraggingOfNodes} onChange={onCheckBoxChanged} />
        <label htmlFor="allowDraggingOfNodes">Allow dragging nodes</label>
      </div>
      <div>
        <input type="checkbox" id="showLabels" checked={options.showLabels} onChange={onCheckBoxChanged} />
        <label htmlFor="showLabels">Show Labels</label>
      </div>
    </div>
  );
}
