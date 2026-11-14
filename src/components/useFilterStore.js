import { useSyncExternalStore } from 'react';

import filterStore from './filterStore';

export default function useFilterStore () {
  return useSyncExternalStore(filterStore.subscribe, filterStore.getVersion);
}
