import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useIsMounted() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return isMounted;
}
