import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { Site, Menage, Beneficiaire, MenageWithSite, BeneficiaireWithMenage } from '../types/models';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_distribution',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

// Initialize the database connection
export async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

// Helper functions for database operations
export const dbOperations = {
  // Sites Distribution
  async createSite(id: string, nom: string, adresse: string) {
    const conn = await getConnection();
    try {
      await conn.execute<Site[]>(
        'INSERT INTO sites (id, nom, adresse) VALUES (?, ?, ?)',
        [id, nom, adresse]
      );
    } finally {
      await conn.end();
    }
  },

  async getSites() {
    const conn = await getConnection();
    try {
      const [rows] = await conn.execute<Site[]>('SELECT * FROM sites');
      return rows;
    } finally {
      await conn.end();
    }
  },

  // Menages
  async createMenage(
    id: string,
    householdId: string,
    nomMenage: string,
    tokenNumber: string,
    siteDistributionId: string,
    nombreBeneficiaires: number
  ) {
    const conn = await getConnection();
    try {
      await conn.execute<Menage[]>(
        'INSERT INTO menages (id, household_id, nom_menage, token_number, site_distribution_id, nombre_beneficiaires) VALUES (?, ?, ?, ?, ?, ?)',
        [id, householdId, nomMenage, tokenNumber, siteDistributionId, nombreBeneficiaires]
      );
    } finally {
      await conn.end();
    }
  },

  async getMenages() {
    const conn = await getConnection();
    try {
      const [rows] = await conn.execute<MenageWithSite[]>(
        `
        SELECT m.*, s.nom as site_nom, s.adresse as site_adresse 
        FROM menages m 
        LEFT JOIN sites s ON m.site_distribution_id = s.id
      `
      );
      return rows;
    } finally {
      await conn.end();
    }
  },

  async deleteMenage(id: string) {
    const conn = await getConnection();
    try {
      await conn.execute<Menage[]>('DELETE FROM menages WHERE id = ?', [id]);
    } finally {
      await conn.end();
    }
  },

  // Beneficiaires
  async createBeneficiaire(
    id: string,
    menageId: string,
    firstName: string,
    middleName: string | null,
    lastName: string,
    estPrincipal: boolean
  ) {
    const conn = await getConnection();
    try {
      await conn.execute<Beneficiaire[]>(
        'INSERT INTO beneficiaires (id, menage_id, first_name, middle_name, last_name, est_principal) VALUES (?, ?, ?, ?, ?, ?)',
        [id, menageId, firstName, middleName, lastName, estPrincipal]
      );
    } finally {
      await conn.end();
    }
  },

  async getBeneficiaires() {
    const conn = await getConnection();
    try {
      const [rows] = await conn.execute<BeneficiaireWithMenage[]>(
        `
        SELECT b.*, m.nom_menage, m.token_number, s.nom as site_nom
        FROM beneficiaires b
        LEFT JOIN menages m ON b.menage_id = m.id
        LEFT JOIN sites s ON m.site_distribution_id = s.id
      `
      );
      return rows;
    } finally {
      await conn.end();
    }
  },

  // Import data transaction
  async importHouseholdData(
    siteNom: string,
    siteAdresse: string,
    householdId: string,
    nomMenage: string,
    tokenNumber: string,
    nombreBeneficiaires: number,
    recipientFirstName: string,
    recipientMiddleName: string | null,
    recipientLastName: string,
    nomSuppleant: string | null
  ) {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // Create or get site
      const siteId = uuidv4();
      const [sites] = await conn.execute<Site[]>('SELECT id FROM sites WHERE nom = ? AND adresse = ?', [
        siteNom,
        siteAdresse,
      ]);
      const site = sites[0];
      if (!site) {
        await conn.execute<Site[]>(
          'INSERT INTO sites (id, nom, adresse) VALUES (?, ?, ?)',
          [siteId, siteNom, siteAdresse]
        );
      }

      // Create menage
      const menageId = uuidv4();
      await conn.execute<Menage[]>(
        'INSERT INTO menages (id, household_id, nom_menage, token_number, site_distribution_id, nombre_beneficiaires) VALUES (?, ?, ?, ?, ?, ?)',
        [menageId, householdId, nomMenage, tokenNumber, site ? site.id : siteId, nombreBeneficiaires]
      );

      // Create principal beneficiaire
      const beneficiaireId = uuidv4();
      await conn.execute<Beneficiaire[]>(
        'INSERT INTO beneficiaires (id, menage_id, first_name, middle_name, last_name, est_principal) VALUES (?, ?, ?, ?, ?, true)',
        [beneficiaireId, menageId, recipientFirstName, recipientMiddleName, recipientLastName]
      );

      // Create suppleant if exists
      if (nomSuppleant) {
        const suppleantId = uuidv4();
        const [firstName, ...rest] = nomSuppleant.split(' ');
        const lastName = rest.join(' ');
        await conn.execute<Beneficiaire[]>(
          'INSERT INTO beneficiaires (id, menage_id, first_name, last_name, est_principal) VALUES (?, ?, ?, ?, false)',
          [suppleantId, menageId, firstName, lastName]
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      await conn.end();
    }
  },
};