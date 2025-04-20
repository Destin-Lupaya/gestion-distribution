// Script pour initialiser les tables de nutrition
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initNutritionTables() {
  try {
    console.log('Initialisation des tables de nutrition...');
    
    // Créer une connexion à la base de données
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_distribution',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      multipleStatements: true
    });
    
    // Requête SQL pour créer les tables de nutrition
    const sql = `
      -- Table des bénéficiaires nutrition
      CREATE TABLE IF NOT EXISTS nutrition_beneficiaires (
        id VARCHAR(36) PRIMARY KEY,
        numero_enregistrement VARCHAR(50) UNIQUE NOT NULL,
        nom_enfant VARCHAR(255) NOT NULL,
        nom_mere VARCHAR(255) NOT NULL,
        age_mois INT NOT NULL,
        sexe ENUM('M', 'F') NOT NULL,
        province VARCHAR(100) NOT NULL,
        territoire VARCHAR(100) NOT NULL,
        partenaire VARCHAR(100) NOT NULL,
        village VARCHAR(100) NOT NULL,
        site_cs VARCHAR(100) NOT NULL,
        date_enregistrement DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      -- Table des rations nutrition
      CREATE TABLE IF NOT EXISTS nutrition_rations (
        id VARCHAR(36) PRIMARY KEY,
        beneficiaire_id VARCHAR(36) NOT NULL,
        numero_carte VARCHAR(50) UNIQUE NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        statut ENUM('ACTIF', 'INACTIF', 'TERMINE') DEFAULT 'ACTIF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (beneficiaire_id) REFERENCES nutrition_beneficiaires(id) ON DELETE CASCADE
      );

      -- Table des distributions nutrition
      CREATE TABLE IF NOT EXISTS nutrition_distributions (
        id VARCHAR(36) PRIMARY KEY,
        ration_id VARCHAR(36) NOT NULL,
        date_distribution DATE NOT NULL,
        cycle VARCHAR(50) NOT NULL,
        quantite VARCHAR(50) NOT NULL,
        pb VARCHAR(50),
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ration_id) REFERENCES nutrition_rations(id) ON DELETE CASCADE
      );

      -- Index pour améliorer les performances
      CREATE INDEX IF NOT EXISTS idx_nutrition_beneficiaire_numero ON nutrition_beneficiaires(numero_enregistrement);
      CREATE INDEX IF NOT EXISTS idx_nutrition_ration_beneficiaire ON nutrition_rations(beneficiaire_id);
      CREATE INDEX IF NOT EXISTS idx_nutrition_distribution_ration ON nutrition_distributions(ration_id);
      CREATE INDEX IF NOT EXISTS idx_nutrition_distribution_date ON nutrition_distributions(date_distribution);
    `;
    
    // Exécuter la requête SQL
    await connection.query(sql);
    
    console.log('Tables de nutrition créées avec succès');
    
    // Ajouter les routes de nutrition au serveur
    const nutritionRoutes = `
      // Routes pour la nutrition
      // Récupérer le rapport de nutrition
      app.get('/api/nutrition/report', async (req, res) => {
        try {
          console.log('Récupération du rapport de nutrition');
          
          // Créer une connexion à la base de données
          const connection = await mysql.createConnection(dbConfig);
          
          // Requête pour obtenir les données du rapport de nutrition
          const [rows] = await connection.execute(\`
            SELECT 
              nb.numero_enregistrement,
              nb.nom_enfant,
              nb.nom_mere,
              nb.age_mois,
              nb.sexe,
              nb.province,
              nb.territoire,
              nb.partenaire,
              nb.village,
              nb.site_cs,
              nr.numero_carte,
              nr.statut,
              COUNT(nd.id) as nombre_distributions,
              MAX(nd.date_distribution) as derniere_distribution
            FROM nutrition_beneficiaires nb
            LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
            LEFT JOIN nutrition_distributions nd ON nr.id = nd.ration_id
            GROUP BY nb.id, nr.id
            ORDER BY nb.nom_enfant
          \`);
          
          await connection.end();
          
          // Renvoyer les données
          res.status(200).json(rows);
        } catch (error) {
          console.error('Erreur lors de la récupération du rapport de nutrition:', error);
          res.status(500).json({ error: String(error) });
        }
      });

      // Récupérer un bénéficiaire de nutrition par son numéro d'enregistrement
      app.get('/api/nutrition/beneficiaires/:numeroEnregistrement', async (req, res) => {
        try {
          const { numeroEnregistrement } = req.params;
          console.log(\`Recherche du bénéficiaire de nutrition avec le numéro d'enregistrement: \${numeroEnregistrement}\`);
          
          // Créer une connexion à la base de données
          const connection = await mysql.createConnection(dbConfig);
          
          // Requête pour obtenir le bénéficiaire et ses informations de ration
          const [rows] = await connection.execute(
            \`SELECT 
              nb.*, 
              nr.id as ration_id, 
              nr.numero_carte as numero_ration, 
              nr.date_debut, 
              nr.date_fin, 
              nr.statut
            FROM nutrition_beneficiaires nb
            LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
            WHERE nb.numero_enregistrement = ?\`,
            [numeroEnregistrement]
          );
          
          await connection.end();
          
          if (rows.length > 0) {
            // Formater la réponse pour correspondre à ce que le frontend attend
            const beneficiary = rows[0];
            
            // Extraire les données de ration
            const ration = {
              id: beneficiary.ration_id,
              numero_ration: beneficiary.numero_ration,
              date_debut: beneficiary.date_debut,
              date_fin: beneficiary.date_fin,
              statut: beneficiary.statut
            };
            
            // Supprimer les champs de ration de l'objet principal
            delete beneficiary.ration_id;
            delete beneficiary.numero_ration;
            delete beneficiary.date_debut;
            delete beneficiary.date_fin;
            delete beneficiary.statut;
            
            // Ajouter les rations comme un tableau
            beneficiary.nutrition_rations = [ration];
            
            res.status(200).json(beneficiary);
          } else {
            res.status(404).json({ error: 'Bénéficiaire non trouvé' });
          }
        } catch (error) {
          console.error('Erreur lors de la recherche du bénéficiaire de nutrition:', error);
          res.status(500).json({ error: String(error) });
        }
      });

      // Récupérer les distributions de nutrition pour une ration donnée
      app.get('/api/nutrition/distributions/:rationId', async (req, res) => {
        try {
          const { rationId } = req.params;
          console.log(\`Récupération des distributions de nutrition pour la ration: \${rationId}\`);
          
          // Créer une connexion à la base de données
          const connection = await mysql.createConnection(dbConfig);
          
          // Requête pour obtenir les distributions
          const [rows] = await connection.execute(
            \`SELECT * FROM nutrition_distributions WHERE ration_id = ? ORDER BY date_distribution\`,
            [rationId]
          );
          
          await connection.end();
          
          res.status(200).json(rows);
        } catch (error) {
          console.error('Erreur lors de la récupération des distributions de nutrition:', error);
          res.status(500).json({ error: String(error) });
        }
      });

      // Enregistrer un nouveau bénéficiaire de nutrition
      app.post('/api/nutrition/register-beneficiary', async (req, res) => {
        try {
          const {
            numero_enregistrement,
            nom_enfant,
            nom_mere,
            age_mois,
            sexe,
            province,
            territoire,
            partenaire,
            village,
            site_cs
          } = req.body;
          
          console.log('Enregistrement d\\'un nouveau bénéficiaire de nutrition:', req.body);
          
          // Créer une connexion à la base de données
          const connection = await mysql.createConnection(dbConfig);
          
          // Démarrer une transaction
          await connection.beginTransaction();
          
          try {
            // Insérer le bénéficiaire
            const beneficiaireId = uuidv4();
            await connection.execute(
              \`INSERT INTO nutrition_beneficiaires (
                id,
                numero_enregistrement,
                nom_enfant,
                nom_mere,
                age_mois,
                sexe,
                province,
                territoire,
                partenaire,
                village,
                site_cs,
                date_enregistrement
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())\`,
              [
                beneficiaireId,
                numero_enregistrement,
                nom_enfant,
                nom_mere,
                age_mois,
                sexe,
                province,
                territoire,
                partenaire,
                village,
                site_cs
              ]
            );
            
            // Calculer la date de fin (6 mois après l'enregistrement)
            const dateDebut = new Date();
            const dateFin = new Date();
            dateFin.setMonth(dateFin.getMonth() + 6);
            
            // Générer un numéro de ration
            const numeroRation = \`R-\${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}\`;
            
            // Insérer la ration
            const rationId = uuidv4();
            await connection.execute(
              \`INSERT INTO nutrition_rations (
                id,
                beneficiaire_id,
                numero_carte,
                date_debut,
                date_fin,
                statut
              ) VALUES (?, ?, ?, ?, ?, ?)\`,
              [
                rationId,
                beneficiaireId,
                numeroRation,
                dateDebut,
                dateFin,
                'ACTIF'
              ]
            );
            
            // Valider la transaction
            await connection.commit();
            
            // Récupérer les données complètes du bénéficiaire
            const [rows] = await connection.execute(
              \`SELECT 
                nb.*, 
                nr.id as ration_id, 
                nr.numero_carte as numero_ration, 
                nr.date_debut, 
                nr.date_fin, 
                nr.statut
              FROM nutrition_beneficiaires nb
              LEFT JOIN nutrition_rations nr ON nb.id = nr.beneficiaire_id
              WHERE nb.id = ?\`,
              [beneficiaireId]
            );
            
            await connection.end();
            
            if (rows.length > 0) {
              // Formater la réponse
              const beneficiary = rows[0];
              
              // Extraire les données de ration
              const ration = {
                id: beneficiary.ration_id,
                numero_ration: beneficiary.numero_ration,
                date_debut: beneficiary.date_debut,
                date_fin: beneficiary.date_fin,
                statut: beneficiary.statut
              };
              
              // Supprimer les champs de ration de l'objet principal
              delete beneficiary.ration_id;
              delete beneficiary.numero_ration;
              delete beneficiary.date_debut;
              delete beneficiary.date_fin;
              delete beneficiary.statut;
              
              // Ajouter les rations comme un tableau
              beneficiary.nutrition_rations = [ration];
              
              res.status(201).json({
                success: true,
                message: 'Bénéficiaire de nutrition enregistré avec succès',
                data: beneficiary
              });
            } else {
              res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des données du bénéficiaire après enregistrement'
              });
            }
          } catch (error) {
            // Annuler la transaction en cas d'erreur
            await connection.rollback();
            await connection.end();
            throw error;
          }
        } catch (error) {
          console.error('Erreur lors de l\\'enregistrement du bénéficiaire de nutrition:', error);
          res.status(500).json({
            success: false,
            error: String(error)
          });
        }
      });

      // Enregistrer une distribution de nutrition
      app.post('/api/nutrition/distributions', async (req, res) => {
        try {
          const {
            ration_id,
            date_distribution,
            cycle,
            quantite,
            pb,
            observations
          } = req.body;
          
          console.log('Enregistrement d\\'une nouvelle distribution de nutrition:', req.body);
          
          // Créer une connexion à la base de données
          const connection = await mysql.createConnection(dbConfig);
          
          // Démarrer une transaction
          await connection.beginTransaction();
          
          try {
            // Insérer la distribution
            const distributionId = uuidv4();
            await connection.execute(
              \`INSERT INTO nutrition_distributions (
                id,
                ration_id,
                date_distribution,
                cycle,
                quantite,
                pb,
                observations
              ) VALUES (?, ?, ?, ?, ?, ?, ?)\`,
              [
                distributionId,
                ration_id,
                date_distribution,
                cycle,
                quantite,
                pb,
                observations
              ]
            );
            
            // Valider la transaction
            await connection.commit();
            
            // Récupérer les données de la distribution
            const [rows] = await connection.execute(
              \`SELECT * FROM nutrition_distributions WHERE id = ?\`,
              [distributionId]
            );
            
            await connection.end();
            
            if (rows.length > 0) {
              res.status(201).json({
                success: true,
                message: 'Distribution de nutrition enregistrée avec succès',
                data: rows[0]
              });
            } else {
              res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des données de la distribution après enregistrement'
              });
            }
          } catch (error) {
            // Annuler la transaction en cas d'erreur
            await connection.rollback();
            await connection.end();
            throw error;
          }
        } catch (error) {
          console.error('Erreur lors de l\\'enregistrement de la distribution de nutrition:', error);
          res.status(500).json({
            success: false,
            error: String(error)
          });
        }
      });
    `;
    
    console.log('Voici les routes à ajouter au fichier server.js ou server-combined.js :');
    console.log(nutritionRoutes);
    
    await connection.end();
    
    console.log('\nInstructions :');
    console.log('1. Ajoutez les routes ci-dessus au fichier server.js ou server-combined.js');
    console.log('2. Redémarrez le serveur');
    console.log('3. Testez les routes avec l\'application frontend');
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des tables de nutrition :', error);
  }
}

// Exécuter la fonction
initNutritionTables();
