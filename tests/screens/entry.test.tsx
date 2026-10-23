import { screen, userEvent, waitFor } from '@testing-library/react-native';

import Entry from '@/app/tables/[tableId]/entry';
import type { Field } from '@/data/schema';
import { initI18n } from '@/i18n';

import { makeField } from '../helpers';
import { renderScreen } from './render';

// Tableau « Ventes » avec une vente précédente de « Savon Nosy » (3 pce à 1 500 Ar).
const mockFields: Field[] = [
  makeField({ id: 'p', name: 'Produit', type: 'text', required: true }),
  makeField({ id: 'q', name: 'Quantité', type: 'number', defaultValue: '1' }),
  makeField({ id: 'u', name: 'Unité', type: 'choice', optionsJson: '{"choices":["pce","kg"]}' }),
  makeField({ id: 'pr', name: 'Prix unitaire', type: 'money', required: true }),
  makeField({ id: 't', name: 'Montant total', type: 'formula', formula: '{Quantité} * {Prix unitaire}' }),
];
const mockPrevious = { id: 'r1', tableId: 't1', data: { p: 'Savon Nosy', q: 3, u: 'pce', pr: 1500, t: 4500 }, createdAt: '2026-10-22T08:00:00Z', updatedAt: '', deletedAt: null };
const mockInsert = jest.fn();
const mockAddChoice = jest.fn((value: string) => value.trim());
const mockPrevent: { dirty: boolean; callback?: (e: { data: { action: unknown } }) => void } = { dirty: false };

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ tableId: 't1' }),
  useNavigation: () => ({ dispatch: jest.fn() }),
  usePreventRemove: (dirty: boolean, callback: (e: { data: { action: unknown } }) => void) => {
    mockPrevent.dirty = dirty;
    mockPrevent.callback = callback;
  },
}));
jest.mock('@/features/tables/useTables', () => ({ useTable: () => ({ table: { id: 't1', name: 'Ventes' }, fields: mockFields }) }));
jest.mock('@/data/db', () => ({ db: {}, sqlite: {} }));
jest.mock('@/features/useDbQuery', () => ({ useDbQuery: (read: () => unknown) => read() }));
jest.mock('@/services/tables', () => ({
  ...jest.requireActual('@/services/tables'),
  addChoice: (_fieldId: string, value: string) => mockAddChoice(value),
}));
jest.mock('@/features/entry/usePhotoPicker', () => ({ usePhotoPicker: () => ({ busy: false, denied: false }) }));
jest.mock('@/data/repositories', () => ({
  recordsRepo: {
    get: () => undefined,
    last: () => mockPrevious,
    list: () => [mockPrevious, { ...mockPrevious, id: 'r2' }],
    lastWhere: (_t: string, fieldId: string, value: string) => (mockPrevious.data[fieldId as 'p'] === value ? mockPrevious : undefined),
    suggestions: (_t: string, fieldId: string, text: string) =>
      fieldId === 'p' && 'Savon Nosy'.toLowerCase().includes(text.toLowerCase()) ? ['Savon Nosy'] : [],
    insert: (...args: unknown[]) => mockInsert(...args),
    update: jest.fn(),
  },
}));

jest.setTimeout(15_000);
beforeAll(() => {
  initI18n('fr');
});
beforeEach(() => jest.clearAllMocks());

describe('saisie rapide assistée', () => {
  it('propose « Reprendre la dernière saisie » avec son résumé', async () => {
    await renderScreen(<Entry />);
    expect(screen.getByRole('button', { name: 'Reprendre la dernière saisie, Savon Nosy · 4 500 Ar' })).toBeOnTheScreen();
  });

  it('un produit déjà vendu est suggéré, et son prix et son unité sont repris', async () => {
    const user = userEvent.setup();
    await renderScreen(<Entry />);

    await user.type(screen.getByLabelText('Produit, obligatoire'), 'sav');
    const suggestion = await screen.findByRole('button', { name: 'Suggestion : Savon Nosy' });
    await user.press(suggestion);

    expect(screen.getByDisplayValue('Savon Nosy')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('1500')).toBeOnTheScreen();
    // Total calculé en direct avec la quantité par défaut (1) et le prix repris.
    expect(screen.getByLabelText('Montant total : 1 500 Ar')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(mockInsert).toHaveBeenCalled());
    expect(mockInsert.mock.calls[0][1]).toEqual(expect.objectContaining({ p: 'Savon Nosy', q: 1, u: 'pce', pr: 1500, t: 1500 }));
  });

  it('« Reprendre la dernière saisie » remplit tout en un geste', async () => {
    const user = userEvent.setup();
    await renderScreen(<Entry />);
    await user.press(screen.getByRole('button', { name: /^Reprendre la dernière saisie/ }));

    expect(screen.getByDisplayValue('Savon Nosy')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('3')).toBeOnTheScreen();
    expect(screen.getByLabelText('Montant total : 4 500 Ar')).toBeOnTheScreen();
  });

  it('protège une saisie en cours contre un retour accidentel', async () => {
    const user = userEvent.setup();
    await renderScreen(<Entry />);
    expect(mockPrevent.dirty).toBe(false);
    await user.type(screen.getByLabelText('Produit, obligatoire'), 'Riz');
    expect(mockPrevent.dirty).toBe(true);
  });

  it('propose les saisies habituelles et les rejoue en un geste', async () => {
    const user = userEvent.setup();
    await renderScreen(<Entry />);
    await user.press(screen.getByRole('button', { name: 'Saisies habituelles : Savon Nosy · 4 500 Ar' }));
    expect(screen.getByDisplayValue('Savon Nosy')).toBeOnTheScreen();
    expect(screen.getByLabelText('Montant total : 4 500 Ar')).toBeOnTheScreen();
  });

  it('ajoute un nouveau choix sans quitter la saisie, et le sélectionne', async () => {
    const user = userEvent.setup();
    await renderScreen(<Entry />);
    await user.press(screen.getByRole('button', { name: 'Ajouter un choix à « Unité »' }));
    await user.type(screen.getByLabelText('Nouveau choix'), 'sac');
    await user.press(screen.getByRole('button', { name: 'Ajouter' }));
    expect(mockAddChoice).toHaveBeenCalledWith('sac');
  });
});
