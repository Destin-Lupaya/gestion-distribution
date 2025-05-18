// Script pour créer les nouvelles tables nécessaires pour les fonctionnalités avancées
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  try {
    console.log('Connexion à la base de données...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    // Vérifier et créer la table programmes_aide
    console.log('Vérification et création de la table programmes_aide...');
    const [programmeRows] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'programmes_aide'
    `);
    
    if (programmeRows[0].count === 0) {
      console.log('Création de la table programmes_aide...');
      await connection.query(`
        CREATE TABLE programmes_aide (
          programme_id VARCHAR(36) PRIMARY KEY,
          nom_programme VARCHAR(100) NOT NULL,
          description_programme TEXT,
          organisation_responsable VARCHAR(100) NOT NULL,
          date_debut DATE NOT NULL,
          date_fin DATE,
          budget_total DECIMAL(15, 2),
          devise VARCHAR(10) DEFAULT 'USD',
          objectifs_programme TEXT,
          criteres_eligibilite TEXT,
          type_assistance ENUM('Alimentaire', 'Non-alimentaire', 'Monétaire', 'Mixte', 'Autre') NOT NULL,
          zone_intervention JSON,
          nombre_beneficiaires_cible INT,
          statut_programme ENUM('Planifié', 'En cours', 'Terminé', 'Suspendu', 'Annulé') DEFAULT 'Planifié',
          documents_programme JSON,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Table programmes_aide créée avec succès.');
    } else {
      console.log('La table programmes_aide existe déjà.');
    }

    // Vérifier et créer la table evenements_distribution
    console.log('Vérification et création de la table evenements_distribution...');
    const [evenementRows] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'evenements_distribution'
    `);
    
    if (evenementRows[0].count === 0) {
      console.log('Création de la table evenements_distribution...');
      await connection.query(`
        CREATE TABLE evenements_distribution (
          evenement_id VARCHAR(36) PRIMARY KEY,
          programme_id VARCHAR(36) NOT NULL,
          site_id INT NOT NULL,
          nom_evenement VARCHAR(100) NOT NULL,
          description_evenement TEXT,
          date_distribution_prevue DATE NOT NULL,
          heure_debut TIME,
          heure_fin TIME,
          type_assistance_prevue ENUM('Alimentaire', 'Non-alimentaire', 'Monétaire', 'Mixte', 'Autre') NOT NULL,
          details_assistance JSON,
          quantite_prevue FLOAT,
          unite_mesure VARCHAR(20),
          nombre_beneficiaires_attendus INT,
          statut_evenement ENUM('Planifié', 'En cours', 'Terminé', 'Reporté', 'Annulé') DEFAULT 'Planifié',
          responsable_evenement VARCHAR(100),
          notes_evenement TEXT,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (programme_id) REFERENCES programmes_aide(programme_id) ON DELETE CASCADE,
          FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
        )
      `);
      console.log('Table evenements_distribution créée avec succès.');
    } else {
      console.log('La table evenements_distribution existe déjà.');
    }

    // Vérifier et créer la table listes_eligibles_distribution
    console.log('Vérification et création de la table listes_eligibles_distribution...');
    const [listeRows] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'listes_eligibles_distribution'
    `);
    
    if (listeRows[0].count === 0) {
      console.log('Création de la table listes_eligibles_distribution...');
      await connection.query(`
        CREATE TABLE listes_eligibles_distribution (
          liste_id VARCHAR(36) PRIMARY KEY,
          evenement_id VARCHAR(36) NOT NULL,
          beneficiaire_id INT NOT NULL,
          household_id VARCHAR(50) NOT NULL,
          date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          statut_eligibilite ENUM('Eligible', 'Non-eligible', 'En attente', 'Servi', 'Absent') DEFAULT 'Eligible',
          raison_eligibilite VARCHAR(255) NULL,
          INDEX idx_liste_evenement (evenement_id),
          INDEX idx_liste_beneficiaire (beneficiaire_id),
          INDEX idx_liste_household (household_id),
          INDEX idx_liste_statut (statut_eligibilite),
          FOREIGN KEY (evenement_id) REFERENCES evenements_distribution(evenement_id) ON DELETE CASCADE,
          FOREIGN KEY (beneficiaire_id) REFERENCES recipients(id) ON DELETE CASCADE,
          FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
        )
      `);
      console.log('Table listes_eligibles_distribution créée avec succès.');
    } else {
      console.log('La table listes_eligibles_distribution existe déjà.');
    }

    // Vérifier et créer la table assistances_distribuees
    console.log('Vérification et création de la table assistances_distribuees...');
    const [assistanceRows] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'assistances_distribuees'
    `);
    
    if (assistanceRows[0].count === 0) {
      console.log('Création de la table assistances_distribuees...');
      await connection.query(`
        CREATE TABLE assistances_distribuees (
          assistance_id VARCHAR(36) PRIMARY KEY,
          evenement_id VARCHAR(36) NOT NULL,
          beneficiaire_id INT NOT NULL,
          household_id VARCHAR(50) NOT NULL,
          date_reception_effective DATE NOT NULL,
          heure_reception_effective TIME NOT NULL,
          articles_recus JSON,
          quantite_recue FLOAT,
          agent_distributeur_id VARCHAR(50),
          mode_verification ENUM('Carte d\\'identité', 'Carte de bénéficiaire', 'Biométrie', 'Autre') NOT NULL,
          notes_distribution TEXT,
          date_enregistrement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_assistance_evenement (evenement_id),
          INDEX idx_assistance_beneficiaire (beneficiaire_id),
          INDEX idx_assistance_household (household_id),
          INDEX idx_assistance_date (date_reception_effective),
          FOREIGN KEY (evenement_id) REFERENCES evenements_distribution(evenement_id) ON DELETE CASCADE,
          FOREIGN KEY (beneficiaire_id) REFERENCES recipients(id) ON DELETE CASCADE,
          FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
        )
      `);
      console.log('Table assistances_distribuees créée avec succès.');
    } else {
      console.log('La table assistances_distribuees existe déjà.');
    }

    // Création des vues si elles n'existent pas déjà
    console.log('Vérification et création des vues...');
    
    // Vue v_beneficiaires_details
    const [viewBeneficiairesRows] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.views 
      WHERE table_schema = DATABASE() AND table_name = 'v_beneficiaires_details'
    `);
    
    if (viewBeneficiairesRows[0].count === 0) {
      console.log('Création de la vue v_beneficiaires_details...');
      await connection.query(`
        CREATE OR REPLACE VIEW v_beneficiaires_details AS
        SELECT 
          r.id AS beneficiaire_id,
          r.household_id,
          h.token_number,
          h.nom_menage AS household_name,
          r.first_name,
          r.middle_name,
          r.last_name,
          r.date_naissance,
          r.age,
          r.sexe,
          r.identifiant_national,
          r.criteres_vulnerabilite,
          r.statut_beneficiaire,
          s.id AS site_id,
          s.nom AS site_name,
          s.adresse AS site_address,
          s.province,
          s.region,
          s.district
        FROM 
          recipients r
        JOIN 
          households h ON r.household_id = h.id
        JOIN 
          sites s ON h.site_id = s.id
      `);
      console.log('Vue v_beneficiaires_details créée avec succès.');
    } else {
      console.log('La vue v_beneficiaires_details existe déjà.');
    }
    
    // Vue v_assistances_beneficiaires
    const [viewAssistancesRows] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.views 
      WHERE table_schema = DATABASE() AND table_name = 'v_assistances_beneficiaires'
    `);
    
    if (viewAssistancesRows[0].count === 0) {
      console.log('Création de la vue v_assistances_beneficiaires...');
      await connection.query(`
        CREATE OR REPLACE VIEW v_assistances_beneficiaires AS
        SELECT 
          ad.assistance_id,
          ad.evenement_id,
          ed.programme_id,
          pa.nom_programme,
          ed.date_distribution_prevue,
          ad.date_reception_effective,
          ad.heure_reception_effective,
          r.id AS beneficiaire_id,
          r.first_name,
          r.middle_name,
          r.last_name,
          h.token_number,
          h.nom_menage AS household_name,
          s.nom AS site_name,
          ed.type_assistance_prevue,
          ad.articles_recus,
          ad.quantite_recue,
          ad.mode_verification,
          ad.notes_distribution
        FROM 
          assistances_distribuees ad
        JOIN 
          evenements_distribution ed ON ad.evenement_id = ed.evenement_id
        JOIN 
          programmes_aide pa ON ed.programme_id = pa.programme_id
        JOIN 
          recipients r ON ad.beneficiaire_id = r.id
        JOIN 
          households h ON ad.household_id = h.id
        JOIN 
          sites s ON h.site_id = s.id
      `);
      console.log('Vue v_assistances_beneficiaires créée avec succès.');
    } else {
      console.log('La vue v_assistances_beneficiaires existe déjà.');
    }

    console.log('Création des tables et vues terminée avec succès!');
    await connection.end();
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
    process.exit(1);
  }
}

createTables();
