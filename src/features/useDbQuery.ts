import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';

/**
 * Exécute une lecture de repository et la relance quand la base change.
 * Les écrans n'appellent jamais SQL directement : ils passent par ce hook.
 */
export function useDbQuery<T>(read: () => T, deps: readonly unknown[]): T {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const sub = addDatabaseChangeListener(() => {
      // Regroupe les rafales d'écritures (import, transactions) en un seul rafraîchissement.
      timer ??= setTimeout(() => {
        timer = null;
        setVersion((v) => v + 1);
      }, 50);
    });
    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const depsKey = JSON.stringify(deps);
  // `read` change à chaque rendu : on ne relit que si les dépendances ou la base ont changé.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => read(), [depsKey, version]);
}
