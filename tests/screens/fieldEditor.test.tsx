import { render, screen, userEvent } from '@testing-library/react-native';

import FieldScreen from '@/app/tables/[tableId]/field';
import type { Field } from '@/data/schema';
import { initI18n } from '@/i18n';
import { saveField } from '@/services/tables';

import { makeField } from '../helpers';

// Fiche « Nouvelle colonne » d'un tableau qui a déjà Quantité et Prix unitaire.
const fields: Field[] = [
  makeField({ id: 'q', name: 'Quantité', type: 'number' }),
  makeField({ id: 'p', name: 'Prix unitaire', type: 'money' }),
  makeField({ id: 'c', name: 'Produit', type: 'text' }),
];

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ tableId: 't1' }),
}));
jest.mock('@/features/tables/useTables', () => ({ useTable: () => ({ table: { id: 't1', name: 'Ventes' }, fields: mockFields }) }));
jest.mock('@/services/tables', () => ({ saveField: jest.fn(), deleteField: jest.fn(), draftFromField: jest.fn() }));

const mockFields = fields;
const saved = saveField as jest.Mock;

jest.setTimeout(15_000);
beforeAll(() => {
  initI18n('fr');
});
beforeEach(() => jest.clearAllMocks());

describe('fiche d’une colonne', () => {
  it('crée un calcul « Quantité × Prix unitaire » sans rien taper d’autre que le nom', async () => {
    const user = userEvent.setup();
    await render(<FieldScreen />);

    await user.type(screen.getByLabelText('Nom de la colonne'), 'Montant total');
    await user.press(screen.getByRole('radio', { name: /^Calcul automatique\./ }));

    // Seules les colonnes de nombres sont proposées (pas « Produit »).
    expect(screen.queryByRole('button', { name: 'Produit' })).toBeNull();
    const [firstQty] = screen.getAllByRole('button', { name: 'Quantité' });
    await user.press(firstQty!);
    const prices = screen.getAllByRole('button', { name: 'Prix unitaire' });
    await user.press(prices[1]!);

    expect(screen.getByText('Montant total = Quantité × Prix unitaire')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith('t1', null, expect.objectContaining({ name: 'Montant total', type: 'formula', formula: '{Quantité} * {Prix unitaire}' }));
  });

  it('garde les réglages rares repliés jusqu’à « Options avancées »', async () => {
    const user = userEvent.setup();
    await render(<FieldScreen />);
    await user.type(screen.getByLabelText('Nom de la colonne'), 'Remise');
    await user.press(screen.getByRole('radio', { name: /^Nombre \/ quantité\./ }));

    expect(screen.queryByRole('button', { name: /^Obligatoire/ })).toBeNull();
    expect(screen.queryByLabelText('Minimum')).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Options avancées' }));
    expect(screen.getByRole('button', { name: /^Obligatoire/ })).toBeOnTheScreen();
    expect(screen.getByLabelText('Minimum')).toBeOnTheScreen();
  });

  it('chaque type est expliqué par un exemple', async () => {
    await render(<FieldScreen />);
    expect(screen.getByRole('radio', { name: 'Montant en Ariary. 12 500 Ar — arrondi à l’ariary' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Photo. Ticket, facture, reçu' })).toBeOnTheScreen();
  });

  it('« Enregistrer » est inactif tant que la colonne n’a pas de nom', async () => {
    const user = userEvent.setup();
    await render(<FieldScreen />);
    await user.press(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).not.toHaveBeenCalled();
  });
});
