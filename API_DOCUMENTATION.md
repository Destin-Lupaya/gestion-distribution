# Documentation de l'API

Ce document décrit les endpoints API disponibles dans l'application de gestion de distribution.

## Base URL

Toutes les URLs sont relatives à : `http://localhost:3001/api`

## Authentification

Actuellement, l'API n'implémente pas d'authentification. C'est une fonctionnalité qui devrait être ajoutée dans une future version.

## Format des réponses

Toutes les réponses sont au format JSON. Les réponses d'erreur incluent généralement un champ `error` avec un message descriptif.

Exemple de réponse réussie :
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": [...]
}
```

Exemple de réponse d'erreur :
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

## Endpoints

### Santé de l'API

#### GET /health

Vérifie l'état de l'API et la connexion à la base de données.

**Réponse** :
```json
{
  "status": "ok",
  "message": "Backend server is running and database connection is successful",
  "timestamp": "2025-05-22T16:45:00.000Z"
}
```

### Bénéficiaires

#### GET /beneficiaires

Récupère la liste des bénéficiaires.

**Réponse** :
```json
[
  {
    "id": "123",
    "menage_id": "456",
    "first_name": "John",
    "middle_name": null,
    "last_name": "Doe",
    "est_principal": true
  },
  ...
]
```

#### POST /beneficiaires

Crée un nouveau bénéficiaire.

**Corps de la requête** :
```json
{
  "menageId": "456",
  "firstName": "Jane",
  "middleName": null,
  "lastName": "Doe",
  "estPrincipal": false
}
```

**Réponse** :
```json
{
  "id": "789",
  "menageId": "456",
  "firstName": "Jane",
  "middleName": null,
  "lastName": "Doe",
  "estPrincipal": false
}
```

### Ménages

#### GET /menages

Récupère la liste des ménages.

**Réponse** :
```json
[
  {
    "id": "456",
    "householdId": "H123",
    "nomMenage": "Famille Doe",
    "tokenNumber": "T456",
    "siteDistributionId": "789",
    "nombreBeneficiaires": 4
  },
  ...
]
```

#### POST /menages

Crée un nouveau ménage.

**Corps de la requête** :
```json
{
  "householdId": "H124",
  "nomMenage": "Famille Smith",
  "tokenNumber": "T457",
  "siteDistributionId": "789",
  "nombreBeneficiaires": 3
}
```

**Réponse** :
```json
{
  "id": "457",
  "householdId": "H124",
  "nomMenage": "Famille Smith",
  "tokenNumber": "T457",
  "siteDistributionId": "789",
  "nombreBeneficiaires": 3
}
```

#### DELETE /menages/:id

Supprime un ménage.

**Réponse** : Code 204 (No Content)

### Sites

#### GET /sites

Récupère la liste des sites.

**Réponse** :
```json
[
  {
    "id": "789",
    "nom": "Site A",
    "adresse": "123 Main St"
  },
  ...
]
```

#### POST /sites

Crée un nouveau site.

**Corps de la requête** :
```json
{
  "nom": "Site B",
  "adresse": "456 Second St"
}
```

**Réponse** :
```json
{
  "id": "790",
  "nom": "Site B",
  "adresse": "456 Second St"
}
```

### Événements de Distribution

#### GET /evenements-distribution

Récupère la liste des événements de distribution.

**Réponse** :
```json
[
  {
    "evenement_id": "123",
    "programme_id": "456",
    "nom_programme": "Programme A",
    "site_id": "789",
    "nom_site": "Site A",
    "date_distribution_prevue": "2025-06-01",
    "heure_debut_prevue": "09:00:00",
    "heure_fin_prevue": "17:00:00",
    "type_assistance_prevue": "Nourriture",
    "quantite_totale_prevue": 1000,
    "statut_evenement": "PLANIFIÉ",
    "date_creation": "2025-05-22T14:30:00",
    "date_modification": "2025-05-22T14:30:00"
  },
  ...
]
```

#### GET /evenements-distribution/:id

Récupère un événement de distribution spécifique.

**Réponse** :
```json
{
  "evenement_id": "123",
  "programme_id": "456",
  "nom_programme": "Programme A",
  "site_id": "789",
  "nom_site": "Site A",
  "date_distribution_prevue": "2025-06-01",
  "heure_debut_prevue": "09:00:00",
  "heure_fin_prevue": "17:00:00",
  "type_assistance_prevue": "Nourriture",
  "quantite_totale_prevue": 1000,
  "statut_evenement": "PLANIFIÉ",
  "date_creation": "2025-05-22T14:30:00",
  "date_modification": "2025-05-22T14:30:00"
}
```

#### POST /evenements-distribution

Crée un nouvel événement de distribution.

**Corps de la requête** :
```json
{
  "programme_id": "456",
  "site_id": "789",
  "date_distribution_prevue": "2025-06-15",
  "heure_debut_prevue": "10:00:00",
  "heure_fin_prevue": "16:00:00",
  "type_assistance_prevue": "Nourriture",
  "quantite_totale_prevue": 800,
  "statut_evenement": "PLANIFIÉ"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Événement créé avec succès",
  "data": {
    "evenement_id": "124",
    "programme_id": "456",
    "nom_programme": "Programme A",
    "site_id": "789",
    "nom_site": "Site A",
    "date_distribution_prevue": "2025-06-15",
    "heure_debut_prevue": "10:00:00",
    "heure_fin_prevue": "16:00:00",
    "type_assistance_prevue": "Nourriture",
    "quantite_totale_prevue": 800,
    "statut_evenement": "PLANIFIÉ",
    "date_creation": "2025-05-22T15:00:00",
    "date_modification": "2025-05-22T15:00:00"
  }
}
```

#### PUT /evenements-distribution/:id

Met à jour un événement de distribution existant.

**Corps de la requête** :
```json
{
  "programme_id": "456",
  "site_id": "789",
  "date_distribution_prevue": "2025-06-15",
  "heure_debut_prevue": "09:00:00",
  "heure_fin_prevue": "17:00:00",
  "type_assistance_prevue": "Nourriture",
  "quantite_totale_prevue": 900,
  "statut_evenement": "EN_COURS"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Événement mis à jour avec succès",
  "data": {
    "evenement_id": "124",
    "programme_id": "456",
    "nom_programme": "Programme A",
    "site_id": "789",
    "nom_site": "Site A",
    "date_distribution_prevue": "2025-06-15",
    "heure_debut_prevue": "09:00:00",
    "heure_fin_prevue": "17:00:00",
    "type_assistance_prevue": "Nourriture",
    "quantite_totale_prevue": 900,
    "statut_evenement": "EN_COURS",
    "date_creation": "2025-05-22T15:00:00",
    "date_modification": "2025-05-22T15:30:00"
  }
}
```

#### DELETE /evenements-distribution/:id

Supprime un événement de distribution.

**Réponse** :
```json
{
  "success": true,
  "message": "Événement supprimé avec succès"
}
```

### Distributions

#### POST /register-distribution

Enregistre une distribution.

**Corps de la requête** :
```json
{
  "site_id": "789",
  "household_id": "456",
  "recipient_id": "123",
  "signature": "data:image/png;base64,...",
  "distribution_date": "2025-05-22",
  "commodities": [
    {
      "commodity_id": "c1",
      "quantity": 2
    },
    {
      "commodity_id": "c2",
      "quantity": 1
    }
  ]
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Distribution enregistrée avec succès",
  "distribution_id": "d123"
}
```

### Rapports

#### GET /reports/distribution

Génère un rapport de distribution.

**Paramètres de requête** :
- `startDate` (obligatoire) : Date de début au format YYYY-MM-DD
- `endDate` (obligatoire) : Date de fin au format YYYY-MM-DD
- `siteId` (optionnel) : ID du site pour filtrer les résultats

**Réponse** :
```json
[
  {
    "site": "Site A",
    "beneficiaries": 120,
    "households": 30,
    "commodities": [
      {
        "name": "Farine",
        "quantity": 750
      },
      {
        "name": "Haricot",
        "quantity": 300
      },
      {
        "name": "Huile",
        "quantity": 150
      }
    ]
  },
  ...
]
```

#### GET /reports/daily

Génère un rapport journalier.

**Paramètres de requête** :
- `date` (optionnel) : Date spécifique au format YYYY-MM-DD
- `startDate` (obligatoire si `date` n'est pas fourni) : Date de début au format YYYY-MM-DD
- `endDate` (obligatoire si `date` n'est pas fourni) : Date de fin au format YYYY-MM-DD
- `siteId` (optionnel) : ID du site pour filtrer les résultats

**Réponse** :
```json
[
  {
    "date": "2025-05-20",
    "sites": [
      {
        "site": "Site A",
        "total_beneficiaries": 50,
        "total_households": 12,
        "commodities": [
          {
            "name": "Farine",
            "quantity": 300
          },
          {
            "name": "Haricot",
            "quantity": 120
          }
        ]
      }
    ]
  },
  ...
]
```

#### GET /reports/age

Génère un rapport par âge.

**Paramètres de requête** :
- `startDate` (obligatoire) : Date de début au format YYYY-MM-DD
- `endDate` (obligatoire) : Date de fin au format YYYY-MM-DD
- `siteId` (optionnel) : ID du site pour filtrer les résultats

**Réponse** :
```json
[
  {
    "age_group": "0-4",
    "count": 25,
    "gender": "M"
  },
  {
    "age_group": "0-4",
    "count": 30,
    "gender": "F"
  },
  ...
]
```

#### GET /reports/tonnage-comparison

Génère un rapport de comparaison de tonnage.

**Paramètres de requête** :
- `startDate` (obligatoire) : Date de début au format YYYY-MM-DD
- `endDate` (obligatoire) : Date de fin au format YYYY-MM-DD
- `siteId` (optionnel) : ID du site pour filtrer les résultats

**Réponse** :
```json
{
  "commodities": [
    {
      "commodity_name": "Farine",
      "commodity_type": "Céréale",
      "waybill_tonnage": 25.5,
      "mpos_tonnage": 24.8,
      "difference": 0.7,
      "recommendation": "À distribuer en sac: 28"
    },
    ...
  ],
  "totals": {
    "waybill_tonnage": 50.2,
    "mpos_tonnage": 48.9,
    "difference": 1.3
  },
  "beneficiaries": {
    "total_beneficiaries": 500,
    "total_households": 125
  }
}
```

#### GET /reports/batch-commodity

Génère un rapport par batch et commodité.

**Paramètres de requête** :
- `startDate` (obligatoire) : Date de début au format YYYY-MM-DD
- `endDate` (obligatoire) : Date de fin au format YYYY-MM-DD
- `activity` (optionnel) : ID de l'activité pour filtrer les résultats
- `location` (optionnel) : ID de l'emplacement pour filtrer les résultats

**Réponse** :
```json
{
  "batches": [
    {
      "activity": "Distribution générale",
      "batch_number": "B001",
      "commodities": [
        {
          "commodity_specific": "Farine de maïs",
          "tonnage_sent": 10.5,
          "internal_movement": 0.2,
          "tonnage_received": 10.3,
          "quantity_returned": 0.1,
          "losses": 0.1,
          "location": "Site A"
        },
        ...
      ],
      "totals": {
        "tonnage_sent": 25.0,
        "internal_movement": 0.5,
        "tonnage_received": 24.5,
        "quantity_returned": 0.2,
        "losses": 0.3
      }
    },
    ...
  ],
  "grandTotal": {
    "tonnage_sent": 50.0,
    "internal_movement": 1.0,
    "tonnage_received": 49.0,
    "quantity_returned": 0.5,
    "losses": 0.5
  }
}
```

### Importation de données

#### POST /import

Importe des données de bénéficiaires et de ménages.

**Corps de la requête** :
```json
{
  "data": [
    {
      "site_name": "Site A",
      "site_address": "123 Main St",
      "household_id": "H125",
      "household_name": "Famille Johnson",
      "token_number": "T458",
      "beneficiary_count": 5,
      "first_name": "Robert",
      "middle_name": null,
      "last_name": "Johnson",
      "alternate_recipient": null
    },
    ...
  ]
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Import completed",
  "results": [
    {
      "success": true,
      "householdId": "H125",
      "message": "Household imported successfully"
    },
    ...
  ]
}
```

### Nutrition

#### GET /nutrition/beneficiaires/:numeroEnregistrement

Récupère un bénéficiaire de nutrition par son numéro d'enregistrement.

**Réponse** :
```json
{
  "id": "n123",
  "numero_enregistrement": "NUT001",
  "nom_enfant": "Baby Doe",
  "nom_mere": "Jane Doe",
  "age_mois": 24,
  "sexe": "M",
  "province": "Province A",
  "territoire": "Territoire B",
  "partenaire": "Partner C",
  "village": "Village D",
  "site_cs": "Site E"
}
```

#### POST /nutrition/register-beneficiary

Enregistre un bénéficiaire de nutrition.

**Corps de la requête** :
```json
{
  "numero_enregistrement": "NUT002",
  "nom_enfant": "Baby Smith",
  "nom_mere": "Jane Smith",
  "age_mois": 18,
  "sexe": "F",
  "province": "Province A",
  "territoire": "Territoire B",
  "partenaire": "Partner C",
  "village": "Village D",
  "site_cs": "Site E"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Bénéficiaire enregistré avec succès",
  "beneficiaire_id": "n124"
}
```

#### POST /nutrition/distributions

Enregistre une distribution de nutrition.

**Corps de la requête** :
```json
{
  "ration_id": "r123",
  "date_distribution": "2025-05-22",
  "type_ration": "RUTF",
  "quantite": 10,
  "notes": "Distribution hebdomadaire"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Distribution enregistrée avec succès",
  "distribution_id": "nd123"
}
```
