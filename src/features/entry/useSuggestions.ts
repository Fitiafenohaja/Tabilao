import { useEffect, useState } from 'react';

import { recordsRepo } from '@/data/repositories';

import { useDbQuery } from '../useDbQuery';

/** Valeurs déjà saisies pour une colonne, filtrées par le texte tapé (attente de 150 ms entre deux frappes). */
export function useSuggestions(tableId: string, fieldId: string, text: string): string[] {
  const [query, setQuery] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text), 150);
    return () => clearTimeout(timer);
  }, [text]);
  const suggestions = useDbQuery(() => recordsRepo.suggestions(tableId, fieldId, query), [tableId, fieldId, query]);
  // Inutile de proposer exactement ce qui est déjà écrit.
  return suggestions.filter((s) => s.trim().toLocaleLowerCase('fr') !== text.trim().toLocaleLowerCase('fr'));
}
