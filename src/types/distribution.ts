export interface QRValidationResult {
  household_id: string;
  nom_menage: string;
  site_name: string;
  beneficiaire_principal: string;
  nombre_beneficiaires: number;
  est_valide: boolean;
  derniere_distribution: string | null;
  statut: string;
  historique_recent: DistributionHistory[];
}

export interface DistributionHistory {
  date: string;
  status: string;
  items: DistributionItem[];
}

export interface DistributionItem {
  id: number;
  nom: string;
  quantite: number;
  unite_mesure: string;
}

export interface DistributionRequest {
  household_id: string;
  signature_data: string;
  items: Array<{
    id: number;
    quantite: number;
  }>;
}

export interface Item {
  id: number;
  nom: string;
  unite_mesure: string;
  stock_disponible: number;
}
