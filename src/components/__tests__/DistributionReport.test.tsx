import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DistributionReport from '../DistributionReport';
import apiService from '../../services/apiService';

// Mock du service API
jest.mock('../../services/apiService', () => ({
  get: jest.fn(),
}));

// Mock du composant PageTransition pour éviter les problèmes avec les animations
jest.mock('../PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('DistributionReport Component', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
  });

  test('renders the report form correctly', () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DistributionReport />
      </LocalizationProvider>
    );

    // Vérifier que les éléments principaux sont rendus
    expect(screen.getByText('Rapport de Distribution')).toBeInTheDocument();
    expect(screen.getByText('Générer le rapport')).toBeInTheDocument();
  });

  test('displays loading state when generating report', async () => {
    // Mock de la réponse API
    (apiService.get as jest.Mock).mockResolvedValue([]);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DistributionReport />
      </LocalizationProvider>
    );

    // Cliquer sur le bouton pour générer le rapport
    fireEvent.click(screen.getByText('Générer le rapport'));

    // Vérifier que l'état de chargement est affiché
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Attendre que le chargement soit terminé
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled();
    });
  });

  test('displays error message when API call fails', async () => {
    // Mock d'une erreur API
    (apiService.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DistributionReport />
      </LocalizationProvider>
    );

    // Cliquer sur le bouton pour générer le rapport
    fireEvent.click(screen.getByText('Générer le rapport'));

    // Attendre que l'erreur soit affichée
    await waitFor(() => {
      expect(screen.getByText(/Impossible de générer le rapport/i)).toBeInTheDocument();
    });
  });

  test('displays report data when API call succeeds', async () => {
    // Mock de données de rapport
    const mockData = [
      {
        site: 'Site A',
        beneficiaries: 120,
        households: 30,
        commodities: [
          { name: 'Farine', quantity: 750 },
          { name: 'Haricot', quantity: 300 },
        ],
      },
    ];

    (apiService.get as jest.Mock).mockResolvedValue(mockData);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DistributionReport />
      </LocalizationProvider>
    );

    // Cliquer sur le bouton pour générer le rapport
    fireEvent.click(screen.getByText('Générer le rapport'));

    // Attendre que les données soient affichées
    await waitFor(() => {
      expect(screen.getByText('Site A')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('Farine')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });
});
