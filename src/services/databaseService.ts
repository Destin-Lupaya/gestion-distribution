import { query } from '../config/database';

export interface Site {
  id: number;
  nom: string;
  adresse: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  site_id: number;
  nom_menage: string;
  token_number: string;
  nombre_beneficiaires: number;
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: number;
  household_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: number;
  household_id: string;
  recipient_id: number;
  signature_data: string;
  collected_at: string;
}

export interface Distribution {
  id: number;
  household_id: string;
  recipient_id: number;
  signature_id: number;
  distribution_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

const API_URL = 'http://localhost:3001/api';

class DatabaseService {
  // Sites
  async getAllSites(): Promise<Site[]> {
    try {
      const response = await fetch(`${API_URL}/sites`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw error;
    }
  }

  async getSiteById(id: number): Promise<Site | null> {
    try {
      const response = await fetch(`${API_URL}/sites/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching site by id:', error);
      throw error;
    }
  }

  // Households
  async getAllHouseholds(): Promise<Household[]> {
    try {
      const response = await fetch(`${API_URL}/households`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching households:', error);
      throw error;
    }
  }

  async getHouseholdsByTokenNumber(token: string): Promise<Household | null> {
    try {
      const response = await fetch(`${API_URL}/households?token_number=${token}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const households = await response.json();
      return households[0] || null;
    } catch (error) {
      console.error('Error fetching households by token number:', error);
      throw error;
    }
  }

  async getHouseholdsBySite(siteId: number): Promise<Household[]> {
    try {
      const response = await fetch(`${API_URL}/households?site_id=${siteId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching households by site id:', error);
      throw error;
    }
  }

  // Recipients
  async getAllRecipients(): Promise<Recipient[]> {
    try {
      const response = await fetch(`${API_URL}/recipients`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching recipients:', error);
      throw error;
    }
  }

  async getRecipientsByHousehold(householdId: string): Promise<Recipient[]> {
    try {
      const response = await fetch(`${API_URL}/recipients?household_id=${householdId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching recipients by household id:', error);
      throw error;
    }
  }

  // Signatures
  async saveSignature(signature: Omit<Signature, 'id' | 'collected_at'>): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signature),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error saving signature:', error);
      throw error;
    }
  }

  // Distributions
  async getAllDistributions(): Promise<Distribution[]> {
    try {
      const response = await fetch(`${API_URL}/distributions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching distributions:', error);
      throw error;
    }
  }

  async createDistribution(distribution: Omit<Distribution, 'id' | 'distribution_date'>): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/distributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(distribution),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error creating distribution:', error);
      throw error;
    }
  }

  async getDistributionStatus(householdId: string): Promise<Distribution | null> {
    try {
      const response = await fetch(`${API_URL}/distributions?household_id=${householdId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const distributions = await response.json();
      return distributions[0] || null;
    } catch (error) {
      console.error('Error fetching distribution status:', error);
      throw error;
    }
  }

  // QR Code Functions
  async processQRScan(qrData: { id: string }): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/qr/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qrData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error processing QR scan:', error);
      throw error;
    }
  }

  async checkQRStatus(householdId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/qr/status?household_id=${householdId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking QR status:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
