import { RowDataPacket } from 'mysql2';
import { DistributionItem, DistributionHistory as DistHistoryBase } from './distribution';

export interface Site extends RowDataPacket {
  id: string;
  nom: string;
  adresse: string;
  created_at: Date;
  updated_at: Date;
}

export interface Menage extends RowDataPacket {
  id: string;
  household_id: string;
  nom_menage: string;
  token_number: string;
  site_distribution_id: string;
  nombre_beneficiaires: number;
  created_at: Date;
  updated_at: Date;
}

export interface Beneficiaire extends RowDataPacket {
  id: string;
  menage_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  est_principal: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Distribution extends RowDataPacket {
  id: string;
  menage_id: string;
  date_distribution: Date;
  signature: string;
  beneficiaire_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DistributionHistory extends DistHistoryBase, RowDataPacket {}

export interface MenageWithSite extends Menage {
  site_nom: string;
  site_adresse: string;
}

export interface BeneficiaireWithMenage extends Beneficiaire {
  nom_menage: string;
  token_number: string;
  site_nom: string;
}
