import { Site, Household, Recipient, Distribution, Signature } from '../types';

const API_URL = 'http://localhost:3001/api';

// Sites
export async function getAllSites(): Promise<Site[]> {
  const response = await fetch(`${API_URL}/sites`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function createSite(site: Omit<Site, 'id'>): Promise<Site> {
  const response = await fetch(`${API_URL}/sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(site),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Households
export async function getAllHouseholds(): Promise<Household[]> {
  const response = await fetch(`${API_URL}/households`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getHouseholdsByTokenNumber(token: string): Promise<Household | null> {
  const response = await fetch(`${API_URL}/households/token/${token}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getHouseholdsBySite(siteId: number): Promise<Household[]> {
  const response = await fetch(`${API_URL}/households/site/${siteId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function createHousehold(household: Omit<Household, 'id'>): Promise<Household> {
  const response = await fetch(`${API_URL}/households`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(household),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Recipients
export async function getAllRecipients(): Promise<Recipient[]> {
  const response = await fetch(`${API_URL}/recipients`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getRecipientsByHousehold(householdId: number): Promise<Recipient[]> {
  const response = await fetch(`${API_URL}/recipients/household/${householdId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function createRecipient(recipient: Omit<Recipient, 'id'>): Promise<Recipient> {
  const response = await fetch(`${API_URL}/recipients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recipient),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function deleteRecipient(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/recipients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Distributions
export async function getAllDistributions(): Promise<Distribution[]> {
  const response = await fetch(`${API_URL}/distributions`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function createDistribution(distribution: Omit<Distribution, 'id'>): Promise<Distribution> {
  const response = await fetch(`${API_URL}/distributions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(distribution),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// QR Code Functions
export async function processQRScan(qrData: { id: string }): Promise<{
  success: boolean;
  household?: Household;
  error?: string;
}> {
  const response = await fetch(`${API_URL}/qr/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(qrData),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function checkQRStatus(householdId: number): Promise<{
  status: 'pending' | 'completed' | 'cancelled';
  message: string;
}> {
  const response = await fetch(`${API_URL}/qr/status/${householdId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
