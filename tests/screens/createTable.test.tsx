import { screen, userEvent } from '@testing-library/react-native';

import CreateTable from '@/app/tables/create';
import { initI18n } from '@/i18n';
import { createCustomTable } from '@/services/tables';

import { renderScreen } from './render';

// Parcours utilisateur réel sur l'écran « Nouveau tableau », en français, sans base ni navigation.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
}));
jest.mock('@/services/tables', () => ({ createCustomTable: jest.fn(() => ({ id: 'tableau-1' })) }));

const { router } = jest.requireMock<{ router: { replace: jest.Mock } }>('expo-router');
const created = createCustomTable as jest.Mock;

jest.setTimeout(15_000);

beforeAll(() => {
  initI18n('fr');
});
beforeEach(() => jest.clearAllMocks());

const checkbox = (name: string) => screen.getByRole('checkbox', { name: new RegExp(`^${name}\\.`) });

describe('créer un tableau sur mesure', () => {
  it('ventes : 3 gestes (nom, Suivant, Créer) donnent un tableau prêt avec son calcul', async () => {
    const user = userEvent.setup();
    await renderScreen(<CreateTable />);

    // « Suivant » ne fait rien tant que le tableau n'a pas de nom.
    await user.press(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.queryByText('Quelles colonnes ?')).toBeNull();

    await user.type(screen.getByLabelText('Comment s’appelle votre tableau ?'), 'Ventes boutique');
    await user.press(screen.getByRole('button', { name: 'Suivant' }));

    // Colonnes déjà cochées pour des ventes.
    for (const name of ['Date', 'Produit', 'Quantité', 'Prix unitaire', 'Montant total', 'Paiement']) {
      expect(checkbox(name)).toBeChecked();
    }
    expect(checkbox('Client')).not.toBeChecked();
    expect(screen.getByText('Calculé tout seul : Quantité × Prix unitaire')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Créer le tableau · 6 colonnes' }));

    expect(created).toHaveBeenCalledTimes(1);
    const [name, category, columns] = created.mock.calls[0];
    expect(name).toBe('Ventes boutique');
    expect(category).toBe('income');
    expect(columns.map((c: { name: string }) => c.name)).toEqual(['Date', 'Produit', 'Quantité', 'Prix unitaire', 'Montant total', 'Paiement']);
    expect(columns.find((c: { name: string }) => c.name === 'Montant total').formula).toBe('{Quantité} * {Prix unitaire}');
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/tables/[tableId]', params: { tableId: 'tableau-1' } });
  });

  it('décocher le prix retire aussi le total, qui en dépend', async () => {
    const user = userEvent.setup();
    await renderScreen(<CreateTable />);
    await user.type(screen.getByLabelText('Comment s’appelle votre tableau ?'), 'Ventes');
    await user.press(screen.getByRole('button', { name: 'Suivant' }));

    await user.press(checkbox('Prix unitaire'));
    expect(checkbox('Montant total')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Créer le tableau · 4 colonnes' })).toBeOnTheScreen();
  });

  it('stock : les colonnes proposées changent avec ce que suit le tableau', async () => {
    const user = userEvent.setup();
    await renderScreen(<CreateTable />);
    await user.type(screen.getByLabelText('Comment s’appelle votre tableau ?'), 'Stock boutique');
    await user.press(screen.getByRole('radio', { name: /^Du stock\./ }));
    await user.press(screen.getByRole('button', { name: 'Suivant' }));

    expect(checkbox('Produit')).toBeChecked();
    expect(checkbox('Quantité')).toBeChecked();
    expect(checkbox('Seuil d’alerte')).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: /^Date\./ })).toBeNull();
  });

  it('ajoute une colonne personnalisée en 3 gestes (nom, type, Ajouter)', async () => {
    const user = userEvent.setup();
    await renderScreen(<CreateTable />);
    await user.type(screen.getByLabelText('Comment s’appelle votre tableau ?'), 'Ventes');
    await user.press(screen.getByRole('button', { name: 'Suivant' }));

    await user.press(screen.getByRole('button', { name: 'Ajouter une autre colonne' }));
    await user.type(screen.getByLabelText('Nom de la colonne'), 'Vendeur');
    await user.press(screen.getByRole('button', { name: 'Ajouter cette colonne' }));
    await user.press(screen.getByRole('button', { name: 'Créer le tableau · 7 colonnes' }));

    const columns = created.mock.calls[0][2] as { name: string; type: string }[];
    expect(columns.at(-1)).toEqual(expect.objectContaining({ name: 'Vendeur', type: 'text' }));
  });
});
