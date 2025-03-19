import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

// Initialize the database
export async function initDatabase() {
  if (!db) {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    db = new SQL.Database();
    
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS sites_distribution (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        adresse TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS menages (
        id TEXT PRIMARY KEY,
        household_id TEXT UNIQUE NOT NULL,
        nom_menage TEXT NOT NULL,
        token_number TEXT UNIQUE NOT NULL,
        site_distribution_id TEXT NOT NULL,
        nombre_beneficiaires INTEGER NOT NULL CHECK (nombre_beneficiaires > 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_distribution_id) REFERENCES sites_distribution(id)
      );

      CREATE TABLE IF NOT EXISTS beneficiaires (
        id TEXT PRIMARY KEY,
        menage_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        est_principal BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (menage_id) REFERENCES menages(id)
      );

      CREATE TABLE IF NOT EXISTS distributions (
        id TEXT PRIMARY KEY,
        menage_id TEXT NOT NULL,
        date_distribution DATETIME DEFAULT CURRENT_TIMESTAMP,
        signature TEXT NOT NULL,
        beneficiaire_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (menage_id) REFERENCES menages(id),
        FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id)
      );

      CREATE INDEX IF NOT EXISTS idx_menages_household_id ON menages(household_id);
      CREATE INDEX IF NOT EXISTS idx_menages_token_number ON menages(token_number);
      CREATE INDEX IF NOT EXISTS idx_beneficiaires_menage_id ON beneficiaires(menage_id);
      CREATE INDEX IF NOT EXISTS idx_distributions_menage_id ON distributions(menage_id);
      CREATE INDEX IF NOT EXISTS idx_distributions_date ON distributions(date_distribution);
    `);
  }
  return db;
}

// Helper functions for database operations
export const dbOperations = {
  // Sites Distribution
  createSite: async (id: string, nom: string, adresse: string) => {
    const db = await initDatabase();
    db.run('INSERT INTO sites_distribution (id, nom, adresse) VALUES (?, ?, ?)', [id, nom, adresse]);
  },

  getSites: async () => {
    const db = await initDatabase();
    return db.exec('SELECT * FROM sites_distribution')[0]?.values || [];
  },

  // Menages
  createMenage: async (
    id: string,
    householdId: string,
    nomMenage: string,
    tokenNumber: string,
    siteDistributionId: string,
    nombreBeneficiaires: number
  ) => {
    const db = await initDatabase();
    db.run(
      'INSERT INTO menages (id, household_id, nom_menage, token_number, site_distribution_id, nombre_beneficiaires) VALUES (?, ?, ?, ?, ?, ?)',
      [id, householdId, nomMenage, tokenNumber, siteDistributionId, nombreBeneficiaires]
    );
  },

  getMenages: async () => {
    const db = await initDatabase();
    return db.exec(`
      SELECT m.*, s.nom as site_nom, s.adresse as site_adresse,
             b.first_name, b.middle_name, b.last_name,
             (SELECT b2.first_name FROM beneficiaires b2 
              WHERE b2.menage_id = m.id AND b2.est_principal = 0
              LIMIT 1) as nom_suppleant
      FROM menages m
      JOIN sites_distribution s ON m.site_distribution_id = s.id
      JOIN beneficiaires b ON b.menage_id = m.id AND b.est_principal = 1
    `)[0]?.values || [];
  },

  deleteMenage: async (id: string) => {
    const db = await initDatabase();
    db.run('DELETE FROM menages WHERE id = ?', [id]);
  },

  // Beneficiaires
  createBeneficiaire: async (
    id: string,
    menageId: string,
    firstName: string,
    middleName: string | null,
    lastName: string,
    estPrincipal: boolean
  ) => {
    const db = await initDatabase();
    db.run(
      'INSERT INTO beneficiaires (id, menage_id, first_name, middle_name, last_name, est_principal) VALUES (?, ?, ?, ?, ?, ?)',
      [id, menageId, firstName, middleName, lastName, estPrincipal ? 1 : 0]
    );
  },

  getBeneficiaires: async () => {
    const db = await initDatabase();
    return db.exec(`
      SELECT b.*, m.nom_menage
      FROM beneficiaires b
      JOIN menages m ON b.menage_id = m.id
    `)[0]?.values || [];
  },

  // Import data transaction
  importHouseholdData: async (
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
  ) => {
    const db = await initDatabase();
    const siteId = crypto.randomUUID();
    const menageId = crypto.randomUUID();
    const beneficiaireId = crypto.randomUUID();

    db.run('BEGIN TRANSACTION');
    try {
      await dbOperations.createSite(siteId, siteNom, siteAdresse);
      await dbOperations.createMenage(menageId, householdId, nomMenage, tokenNumber, siteId, nombreBeneficiaires);
      await dbOperations.createBeneficiaire(beneficiaireId, menageId, recipientFirstName, recipientMiddleName, recipientLastName, true);

      if (nomSuppleant) {
        const suppleantId = crypto.randomUUID();
        await dbOperations.createBeneficiaire(suppleantId, menageId, nomSuppleant, null, '', false);
      }

      db.run('COMMIT');
      return menageId;
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  }
};

// Export the database instance
export default db;