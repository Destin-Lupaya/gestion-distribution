export interface Site {
  id: number;
  nom: string;
  adresse: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: number;
  site_id: number;
  nom_menage: string;
  token_number: string;
  nombre_beneficiaires: number;
  created_at: string;
  updated_at: string;
  site?: Site;
}

export interface Recipient {
  id: number;
  household_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  household?: Household;
}

export interface Distribution {
  id: number;
  household_id: number;
  recipient_id: number;
  signature_id?: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  household?: Household;
  recipient?: Recipient;
}

export interface Signature {
  id: number;
  household_id: number;
  recipient_id: number;
  signature_data: string;
  created_at: string;
  updated_at: string;
  household?: Household;
  recipient?: Recipient;
}

export interface ImportRow {
  site_name: string;
  site_address?: string;
  household_id: string;
  household_name: string;
  token_number: string;
  beneficiary_count: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  alternate_recipient?: string;
}

export interface ExportRow {
  site_name: string;
  site_address: string;
  household_id: string;
  household_name: string;
  token_number: string;
  beneficiary_count: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  alternate_recipient: string;
  created_at: string;
  updated_at: string;
}
