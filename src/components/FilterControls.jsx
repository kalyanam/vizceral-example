import filterStore from './filterStore';
import Stepper from './Stepper';
import useFilterStore from './useFilterStore';

import './controls.css';

export default function FilterControls () {
  useFilterStore();
  const states = filterStore.getStates();

  return (
    <div className="vizceral-controls-panel">
      <div className="vizceral-control">
        <span>RPS</span>
        <Stepper
          steps={states.rps}
          selectedStep={filterStore.getStepFromValue('rps')}
          changeCallback={step => filterStore.updateFilter({ rps: states.rps[step].value })}
        />
      </div>
      <div className="vizceral-control">
        <button type="button" className="btn btn-default btn-block btn-xs" disabled={filterStore.isDefault()} onClick={() => filterStore.resetFilters()}>Reset Filters</button>
      </div>
    </div>
  );
}
