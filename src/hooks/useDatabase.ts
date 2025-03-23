import { useState, useCallback } from 'react';
import { databaseService } from '../services/databaseService';
import type { 
  Site, 
  Household, 
  Recipient, 
  Distribution 
} from '../services/databaseService';

export function useDatabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: any) => {
    console.error('Database error:', error);
    setError(error instanceof Error ? error : new Error(String(error)));
    setIsLoading(false);
  };

  // Sites
  const getAllSites = useCallback(async () => {
    setIsLoading(true);
    try {
      const sites = await databaseService.getAllSites();
      setIsLoading(false);
      return sites;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, []);

  // Households
  const getAllHouseholds = useCallback(async () => {
    setIsLoading(true);
    try {
      const households = await databaseService.getAllHouseholds();
      setIsLoading(false);
      return households;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, []);

  const getHouseholdByToken = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const household = await databaseService.getHouseholdsByTokenNumber(token);
      setIsLoading(false);
      return household;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, []);

  const getHouseholdsBySite = useCallback(async (siteId: number) => {
    setIsLoading(true);
    try {
      const households = await databaseService.getHouseholdsBySite(siteId);
      setIsLoading(false);
      return households;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, []);

  // Recipients
  const getAllRecipients = useCallback(async () => {
    setIsLoading(true);
    try {
      const recipients = await databaseService.getAllRecipients();
      setIsLoading(false);
      return recipients;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, []);

  const getRecipientsByHousehold = useCallback(async (householdId: string) => {
    setIsLoading(true);
    try {
      const recipients = await databaseService.getRecipientsByHousehold(householdId);
      setIsLoading(false);
      return recipients;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, []);

  // Distributions
  const getAllDistributions = useCallback(async () => {
    setIsLoading(true);
    try {
      const distributions = await databaseService.getAllDistributions();
      setIsLoading(false);
      return distributions;
    } catch (error) {
      handleError(error);
      return [];
    }
  }, []);

  const processQRCode = useCallback(async (qrData: { id: string }) => {
    setIsLoading(true);
    try {
      const result = await databaseService.processQRScan(qrData);
      setIsLoading(false);
      return result;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, []);

  const saveSignatureAndDistribution = useCallback(async (
    householdId: string,
    recipientId: number,
    signatureData: string,
    notes?: string
  ) => {
    setIsLoading(true);
    try {
      // Sauvegarder la signature
      const signatureId = await databaseService.saveSignature({
        household_id: householdId,
        recipient_id: recipientId,
        signature_data: signatureData
      });

      // Créer la distribution
      const distributionId = await databaseService.createDistribution({
        household_id: householdId,
        recipient_id: recipientId,
        signature_id: signatureId,
        status: 'completed',
        notes
      });

      setIsLoading(false);
      return { signatureId, distributionId };
    } catch (error) {
      handleError(error);
      return null;
    }
  }, []);

  const checkDistributionStatus = useCallback(async (householdId: string) => {
    setIsLoading(true);
    try {
      const status = await databaseService.checkQRStatus(householdId);
      setIsLoading(false);
      return status;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    // Sites
    getAllSites,
    // Households
    getAllHouseholds,
    getHouseholdByToken,
    getHouseholdsBySite,
    // Recipients
    getAllRecipients,
    getRecipientsByHousehold,
    // Distributions
    getAllDistributions,
    processQRCode,
    saveSignatureAndDistribution,
    checkDistributionStatus
  };
}
