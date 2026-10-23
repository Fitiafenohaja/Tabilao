import { screen, userEvent } from '@testing-library/react-native';

import SpendingScreen from '@/app/spending';
import { initI18n } from '@/i18n';

import { renderScreen } from './render';

const mockState = {
  value: {
    total: 200_000,
    hasExpenseTable: true,
    items: [
      { label: 'Achat marchandises', amount: 150_000, share: 0.75, target: { tableId: 't1', fieldId: 'cat', value: 'Achat marchandises' } },
      { label: 'Transport', amount: 30_000, share: 0.15, target: { tableId: 't1', fieldId: 'cat', value: 'Transport' } },
      { label: 'Autres', amount: 20_000, share: 0.1, other: true },
    ],
  },
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ period: 'month' }),
}));
jest.mock('@/features/insights/useSpending', () => ({ useSpending: () => mockState.value }));

const { router } = jest.requireMock<{ router: { push: jest.Mock } }>('expo-router');

jest.setTimeout(15_000);
beforeAll(() => {
  initI18n('fr');
});
beforeEach(() => jest.clearAllMocks());

describe('où va mon argent', () => {
  it('montre le total et chaque catégorie avec montant et pourcentage écrits', async () => {
    await renderScreen(<SpendingScreen />);
    expect(screen.getByLabelText('Dépenses de la période : 200 000 Ar')).toBeOnTheScreen();
    expect(screen.getByText('Le plus gros poste : Achat marchandises (75 %).')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Transport : 30 000 Ar, 15 %' })).toBeOnTheScreen();
    // « Autres » regroupe plusieurs catégories : pas de lien.
    expect(screen.queryByRole('button', { name: /^Autres/ })).toBeNull();
    expect(screen.getByLabelText('Autres : 20 000 Ar, 10 %')).toBeOnTheScreen();
  });

  it('toucher une catégorie ouvre ses dépenses, sur la même période', async () => {
    const user = userEvent.setup();
    await renderScreen(<SpendingScreen />);
    await user.press(screen.getByRole('button', { name: 'Transport : 30 000 Ar, 15 %' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/tables/[tableId]',
      params: { tableId: 't1', period: 'month', filterField: 'cat', filterValue: 'Transport' },
    });
  });

  it('la période se choisit en un geste', async () => {
    await renderScreen(<SpendingScreen />);
    expect(screen.getByRole('radio', { name: 'Mois' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Semaine' })).not.toBeSelected();
  });

  it('explique quoi faire sans tableau de dépenses', async () => {
    mockState.value = { total: 0, hasExpenseTable: false, items: [] };
    await renderScreen(<SpendingScreen />);
    expect(screen.getByText('Pas encore de tableau de dépenses')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Nouveau tableau' })).toBeOnTheScreen();
  });
});
