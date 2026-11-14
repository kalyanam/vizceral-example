import { clone, every, filter, findIndex, map, merge } from 'lodash';

const defaultFilters = {
  rps: { value: -1 }
};

const noFilters = {
  rps: { value: -1 }
};

const filters = {
  rps: {
    name: 'rps',
    type: 'connection',
    passes: (object, value) => object.volumeTotal >= value,
    value: -1
  }
};

const states = {
  rps: [
    { name: 'high', value: 1000 },
    { name: ' ', value: 300 },
    { name: ' ', value: 5 },
    { name: 'all', value: -1 }
  ]
};

const listeners = new Set();
let version = 0;

function emitChange () {
  version += 1;
  listeners.forEach(listener => listener());
}

merge(filters, defaultFilters);

const filterStore = {
  subscribe (listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getVersion: () => version,
  getFilters: () => filters,
  getFiltersArray: () => map(filters, f => clone(f)),
  getStates: () => states,
  getChangedFilters: () => filter(filters, f => f.value !== defaultFilters[f.name].value),
  getStepFromValue (name) {
    const index = findIndex(states[name], step => step.value === filters[name].value);
    if (index === -1) {
      return findIndex(states[name], step => step.value === defaultFilters[name].value);
    }
    return index;
  },
  isDefault: () => every(filters, f => f.value === defaultFilters[f.name].value),
  isClear: () => every(filters, f => f.value === noFilters[f.name].value),

  updateFilter (values) {
    Object.keys(values).forEach((name) => {
      filters[name].value = values[name];
    });
    emitChange();
  },
  resetFilters () {
    merge(filters, defaultFilters);
    emitChange();
  },
  clearFilters () {
    merge(filters, noFilters);
    emitChange();
  }
};

export default filterStore;
