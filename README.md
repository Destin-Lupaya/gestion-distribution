# Gestion de Distribution

Application web pour la gestion des distributions d'aide humanitaire, incluant l'enregistrement des bénéficiaires, la collecte de signatures, et la génération de rapports.

## Fonctionnalités

- **Enregistrement des bénéficiaires** : Enregistrement manuel ou par scan de QR code
- **Collecte de signatures** : Capture des signatures des bénéficiaires lors des distributions
- **Gestion des événements de distribution** : Planification et suivi des événements de distribution
- **Rapports** : Génération de rapports détaillés sur les distributions
  - Rapport de distribution
  - Rapport journalier
  - Rapport par âge
  - Rapport de comparaison de tonnage
  - Rapport par batch et commodité

## Architecture

L'application est construite avec les technologies suivantes :

### Frontend
- React (TypeScript)
- Material-UI pour l'interface utilisateur
- React Router pour la navigation
- Dayjs pour la gestion des dates
- Chart.js pour les graphiques
- React Signature Canvas pour la capture des signatures
- QR Code scanning (html5-qrcode et react-qr-reader)

### Backend
- Node.js avec Express
- MySQL pour la base de données
- TypeScript pour le typage

## Structure du projet

```
gestion-distribution/
├── dist/                  # Code JavaScript compilé pour le backend
├── public/                # Fichiers statiques
├── src/                   # Code source
│   ├── assets/            # Images et autres ressources
│   ├── components/        # Composants React
│   ├── config/            # Configuration
│   ├── contexts/          # Contextes React
│   ├── hooks/             # Hooks personnalisés
│   ├── lib/               # Bibliothèques utilitaires
│   ├── pages/             # Pages principales
│   ├── routes/            # Routes API
│   ├── services/          # Services pour les appels API
│   ├── types/             # Définitions de types TypeScript
│   └── utils/             # Fonctions utilitaires
├── database/              # Scripts de base de données
├── scripts/               # Scripts utilitaires
└── server/                # Code source du serveur
```

## Base de données

La base de données utilise différents types d'identifiants selon les tables :
- `recipients` : identifiants numériques (int(11)) avec auto-increment
- `signatures` : identifiants numériques (int(11)) avec auto-increment
- `households` : identifiants UUID (varchar(36))
- `distributions` : identifiants UUID (varchar(36))

### Contraintes de clé étrangère importantes

La table `distributions` a plusieurs contraintes de clé étrangère :
1. `recipient_id` (NOT NULL) - référence la table `recipients` (id)
2. `signature_id` (NOT NULL) - référence la table `signatures` (id)
3. `household_id` (NOT NULL) - référence la table `households` (id)

## Installation

### Prérequis
- Node.js (v14+)
- MySQL (v5.7+)
- XAMPP (recommandé pour le développement local)

### Étapes d'installation

1. Cloner le dépôt
```bash
git clone <repository-url>
cd gestion-distribution
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer la base de données
   - Créer une base de données MySQL nommée `gestion_distribution`
   - Importer les scripts de création de tables depuis le dossier `database`
   - Configurer les variables d'environnement dans le fichier `.env`

4. Compiler le code TypeScript
```bash
npm run build
npm run build:server
```

5. Démarrer l'application
```bash
npm run dev:full
```

## Utilisation

### Démarrage du serveur

Pour démarrer le serveur de développement :
```bash
npm run dev:full
```

Pour démarrer uniquement le frontend :
```bash
npm run dev
```

Pour démarrer uniquement le backend :
```bash
npm run server
```

### Accès à l'application

- Frontend : http://localhost:5173
- Backend API : http://localhost:3001

## Implémentation des QR codes

L'application utilise deux implémentations différentes pour le scan des QR codes :

1. **ManualRegistration.tsx** : Utilise html5-qrcode pour scanner les QR codes avec support webcam
2. **SignatureCollection.tsx** : Utilise react-qr-reader@3.0.0-beta-1 pour le scan QR adapté aux mobiles

## Calcul du tonnage

Le calcul du tonnage reçu prend en compte le poids spécifique de chaque type de produit :
- Huile : 20kg par carton
- Farine : 25kg par sac
- Haricot : 50kg par sac
- Sel : 25kg par sac

La formule utilisée est : tonnage = (quantité * poids unitaire) / 1000

## Rapports disponibles

### Rapport de distribution
Affiche les données de distribution par site, incluant le nombre de bénéficiaires, de ménages et les commodités distribuées.

### Rapport journalier
Affiche les données de distribution par jour, permettant de suivre l'évolution des distributions dans le temps.

### Rapport par âge
Analyse la distribution des bénéficiaires par groupe d'âge et par genre.

### Rapport de comparaison de tonnage
Compare le tonnage reçu selon les waybills avec le tonnage selon les données MPOS (scope) par commodité, et fournit des recommandations d'action basées sur les différences.

### Rapport par batch et commodité
Visualise les données par commodité selon le numéro de batch, incluant le tonnage envoyé, les mouvements internes, le tonnage reçu, les quantités retournées et les pertes.

## Licence

Ce projet est sous licence [MIT](LICENSE).
