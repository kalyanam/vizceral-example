import { SortDirection } from 'react-virtualized';

const byKey = key => (a, b) => {
  if (a.disabled && !b.disabled) { return 1; }
  if (!a.disabled && b.disabled) { return -1; }
  if (a[key] < b[key]) { return 1; }
  if (a[key] > b[key]) { return -1; }
  return 0;
};

export const sorters = {
  name: byKey('name'),
  errorRate: byKey('errorRate'),
  totalPercent: byKey('total')
};

export default function sortRows (rows, sortBy, sortDirection) {
  rows.sort(sorters[sortBy]);
  if (sortDirection !== SortDirection.ASC) { rows.reverse(); }
  return rows;
}
