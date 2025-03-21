export interface Beneficiaire {
  id: string;
  siteDistribution: string;
  adresse: string;
  householdId: string;
  nomMenage: string;
  tokenNumber: string;
  recipientFirstName: string;
  recipientMiddleName: string | null;
  recipientLastName: string;
  nombreBeneficiaires: number;
  nomSuppleant: string | null;
}