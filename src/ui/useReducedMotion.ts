import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Réglage système « Supprimer les animations » : les animations décoratives sont alors coupées. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
