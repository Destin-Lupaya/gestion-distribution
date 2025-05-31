import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { motion } from 'framer-motion';
import { PageTransition } from './PageTransition';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';

function NutritionDistribution() {
  const [beneficiaire, setBeneficiaire] = useState<any>(null);
  const [searchId, setSearchId] = useState('');
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  
  const [formData, setFormData] = useState({
    dateDistribution: dayjs(),
    cycle: '',
    quantite: '',
    pb: '',
    observations: ''
  });

  useEffect(() => {
    // Charger le rapport de nutrition au chargement du composant
    if (activeTab === 1) {
      fetchNutritionReport();
    }
  }, [activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const fetchNutritionReport = async () => {
    setLoadingReport(true);
    try {
      const response = await apiService.get('/api/nutrition/report');
      
      if (response.error) throw new Error(response.error);
      
      // Vérifier si la réponse est un tableau ou un objet avec une propriété data
      const data = Array.isArray(response) ? response : 
                  (response.data ? response.data : []);
      
      // Transformer les données pour le DataGrid (ajouter un id unique)
      const dataWithIds = data.map((item: any, index: number) => ({
        id: index + 1,
        ...item
      }));
      
      setReportData(dataWithIds);
    } catch (err: any) {
      console.error('Error fetching nutrition report:', err);
      toast.error('Erreur lors du chargement du rapport: ' + (err.message || 'Erreur inconnue'));
      setReportData([]);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Nettoyer et normaliser l'ID de recherche
      // Supprimer les espaces, points et autres caractères spéciaux
      let rawId = searchId.trim();
      
      // Extraire uniquement les caractères alphanumériques (lettres et chiffres)
      const alphanumericRegex = /[^a-zA-Z0-9-]/g;
      let cleanSearchId = rawId.replace(alphanumericRegex, '');
      
      console.log(`ID original: '${rawId}', ID nettoyé: '${cleanSearchId}'`);
      
      // Stratégie de recherche:
      // 1. Essayer d'abord avec l'ID complet tel quel (peut inclure R-)
      // 2. Si ça échoue et que l'ID commence par R-, essayer sans le préfixe
      // 3. Si ça échoue et que l'ID ne commence pas par R-, essayer avec le préfixe
      
      let foundBeneficiary = false;
      
      // Première tentative: ID tel quel
      try {
        console.log(`Tentative 1: Recherche avec ID: '${cleanSearchId}'`);
        const response = await apiService.get(`/api/nutrition/beneficiaires/${encodeURIComponent(cleanSearchId)}`);
        
        if (response.data) {
          console.log('Bénéficiaire trouvé avec le format exact');
          setBeneficiaire(response.data);
          await fetchDistributions(response.data.nutrition_rations[0]?.id);
          foundBeneficiary = true;
        }
      } catch (firstError) {
        console.log('Première tentative échouée');
      }
      
      // Deuxième tentative: format alternatif
      if (!foundBeneficiary) {
        try {
          let alternativeId;
          
          if (cleanSearchId.toUpperCase().startsWith('R-')) {
            // Si l'ID commence par R-, essayer sans le préfixe
            alternativeId = cleanSearchId.substring(2);
            console.log(`Tentative 2: Essai sans préfixe: '${alternativeId}'`);
          } else {
            // Si l'ID ne commence pas par R-, essayer avec le préfixe
            alternativeId = `R-${cleanSearchId}`;
            console.log(`Tentative 2: Essai avec préfixe: '${alternativeId}'`);
          }
          
          const response = await apiService.get(`/api/nutrition/beneficiaires/${encodeURIComponent(alternativeId)}`);
          
          if (response.data) {
            console.log('Bénéficiaire trouvé avec le format alternatif');
            setBeneficiaire(response.data);
            await fetchDistributions(response.data.nutrition_rations[0]?.id);
            foundBeneficiary = true;
          }
        } catch (secondError) {
          console.log('Deuxième tentative échouée');
        }
      }
      
      // Troisième tentative: uniquement la partie numérique
      if (!foundBeneficiary) {
        try {
          // Extraire uniquement les chiffres
          const numericPart = cleanSearchId.replace(/\D/g, '');
          
          if (numericPart && numericPart !== cleanSearchId) {
            console.log(`Tentative 3: Essai avec uniquement la partie numérique: '${numericPart}'`);
            
            const response = await apiService.get(`/api/nutrition/beneficiaires/${encodeURIComponent(numericPart)}`);
            
            if (response.data) {
              console.log('Bénéficiaire trouvé avec la partie numérique');
              setBeneficiaire(response.data);
              await fetchDistributions(response.data.nutrition_rations[0]?.id);
              foundBeneficiary = true;
            }
          }
        } catch (thirdError) {
          console.log('Troisième tentative échouée');
        }
      }
      
      // Si toutes les tentatives échouent
      if (!foundBeneficiary) {
        setError('Bénéficiaire non trouvé. Vérifiez le numéro d\'enregistrement.');
      }
    } catch (err: any) {
      console.error('Error searching beneficiary:', err);
      setError(err.message);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributions = async (rationId: string) => {
    if (!rationId) return;

    try {
      const response = await apiService.get(`/api/nutrition/distributions/${rationId}`);

      if (response.error) throw new Error(response.error);

      setDistributions(response.data || []);
    } catch (err) {
      console.error('Error fetching distributions:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: any) => {
    setFormData(prev => ({
      ...prev,
      dateDistribution: date
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!beneficiaire?.nutrition_rations?.[0]?.id) {
      toast.error('Aucune ration associée à ce bénéficiaire');
      return;
    }

    setLoading(true);

    try {
      const distributionData = {
        ration_id: beneficiaire.nutrition_rations[0].id,
        date_distribution: formData.dateDistribution.format('YYYY-MM-DD'),
        cycle: formData.cycle,
        quantite: formData.quantite,
        pb: formData.pb,
        observations: formData.observations
      };

      const response = await apiService.post('/api/nutrition/distributions', distributionData);

      if (response.error) throw new Error(response.error);

      toast.success('Distribution enregistrée avec succès');
      
      // Reset form
      setFormData({
        dateDistribution: dayjs(),
        cycle: '',
        quantite: '',
        pb: '',
        observations: ''
      });
      
      // Refresh distributions
      await fetchDistributions(beneficiaire.nutrition_rations[0].id);
    } catch (err: any) {
      console.error('Error registering distribution:', err);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    // Définir les en-têtes des colonnes
    const headers = [
      'N° Enregistrement',
      'Nom de l\'enfant',
      'Nom de la mère',
      'Âge (mois)',
      'Sexe',
      'Province',
      'Territoire',
      'Partenaire',
      'Village',
      'Site/CS',
      'N° Carte',
      'Statut',
      'Nb. Distributions',
      'Dernière Distribution'
    ];

    // Convertir les données en format CSV
    const csvData = reportData.map(row => [
      row.numero_enregistrement || '',
      row.nom_enfant || '',
      row.nom_mere || '',
      row.age_mois || '',
      row.sexe || '',
      row.province || '',
      row.territoire || '',
      row.partenaire || '',
      row.village || '',
      row.site_cs || '',
      row.numero_carte || '',
      row.statut || '',
      row.nombre_distributions || '0',
      row.derniere_distribution ? new Date(row.derniere_distribution).toLocaleDateString() : '-'
    ]);

    // Ajouter les en-têtes au début
    csvData.unshift(headers);

    // Convertir en chaîne CSV
    const csvString = csvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Créer un objet Blob et un lien de téléchargement
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rapport_Nutrition_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Rapport exporté avec succès');
  };

  const handlePrintRationCard = () => {
    if (!beneficiaire) {
      toast.error('Aucun bénéficiaire sélectionné');
      return;
    }

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les paramètres de votre navigateur.');
      return;
    }

    // Calculer la période de validité (6 mois à partir de la date d'enregistrement)
    const dateEnregistrement = beneficiaire.date_enregistrement 
      ? dayjs(beneficiaire.date_enregistrement).format('DD/MM/YYYY')
      : dayjs().format('DD/MM/YYYY');
    
    const dateFin = beneficiaire.date_enregistrement
      ? dayjs(beneficiaire.date_enregistrement).add(6, 'month').format('DD/MM/YYYY')
      : dayjs().add(6, 'month').format('DD/MM/YYYY');

    // Créer les données pour le QR code
    const qrData = JSON.stringify({
      id: beneficiaire.numero_enregistrement,
      nom: beneficiaire.nom_enfant,
      mere: beneficiaire.nom_mere,
      age: beneficiaire.age_mois,
      sexe: beneficiaire.sexe,
      site: beneficiaire.site_cs
    });

    // Contenu HTML de la carte de ration
    const cardContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Carte de Ration - ${beneficiaire.numero_enregistrement || 'Nutrition'}</title>
        <meta charset="UTF-8">
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
        <style>
          @page {
            size: A5 landscape;
            margin: 0;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background-color: #f9f9f9;
          }
          .print-container {
            padding: 15px;
            background-color: white;
          }
          .card { 
            border: 2px solid #000; 
            padding: 15px; 
            max-width: 100%; 
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            position: relative;
            page-break-inside: avoid;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            width: 80px;
            height: 80px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .logo img {
            max-width: 100%;
            max-height: 100%;
          }
          .title-container {
            flex-grow: 1;
            text-align: center;
          }
          .title { 
            font-size: 22px; 
            font-weight: bold; 
            margin: 0;
            color: #00457C;
          }
          .subtitle { 
            font-size: 18px; 
            margin: 5px 0 0;
            color: #0072BC;
          }
          .row { 
            display: flex; 
            margin-bottom: 10px;
            flex-wrap: wrap;
          }
          .col { 
            flex: 1; 
            min-width: 200px;
          }
          .qr-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 10px;
          }
          .enfant-box { 
            border: 2px dashed #00457C; 
            padding: 10px; 
            text-align: center; 
            margin-bottom: 10px;
            background-color: #f0f7ff;
          }
          .enfant-title { 
            font-size: 18px; 
            margin: 0;
            color: #00457C;
          }
          .info-label { 
            font-weight: bold;
            color: #00457C;
          }
          .info-value {
            color: #333;
          }
          .divider { 
            border-top: 2px solid #00457C; 
            margin: 15px 0; 
            padding-top: 10px; 
            text-align: center;
            background-color: #f0f7ff;
          }
          .warning { 
            font-weight: bold;
            color: #d32f2f;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            border: 2px solid #00457C;
          }
          th { 
            border: 1px solid #00457C; 
            padding: 8px; 
            text-align: center;
            background-color: #e3f2fd;
            color: #00457C;
          }
          td { 
            border: 1px solid #00457C; 
            padding: 8px; 
            text-align: center;
          }
          .empty-cell { 
            height: 30px;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            opacity: 0.05;
            color: #00457C;
            pointer-events: none;
            z-index: 0;
          }
          .info-item {
            margin-bottom: 5px;
            display: flex;
          }
          .info-item .info-label {
            min-width: 120px;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              background-color: white;
            }
            .card { 
              border: 2px solid #000;
              box-shadow: none;
            }
            .print-container {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          .print-button {
            background-color: #00457C;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .print-button:hover {
            background-color: #003366;
          }
          .reprint-mark {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(255, 0, 0, 0.1);
            color: #d32f2f;
            padding: 5px 10px;
            border: 1px solid #d32f2f;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            transform: rotate(10deg);
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="card">
            <div class="reprint-mark">RÉIMPRESSION</div>
            <div class="watermark">WFP/PAM</div>
            <div class="header">
              <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60" height="60">
                  <path fill="#00457C" d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M256,472 c-119.3,0-216-96.7-216-216S136.7,40,256,40s216,96.7,216,216S375.3,472,256,472z"/>
                  <path fill="#00457C" d="M256,96c-88.4,0-160,71.6-160,160s71.6,160,160,160s160-71.6,160-160S344.4,96,256,96z M256,376 c-66.3,0-120-53.7-120-120s53.7-120,120-120s120,53.7,120,120S322.3,376,256,376z"/>
                  <path fill="#00457C" d="M256,192c-35.3,0-64,28.7-64,64s28.7,64,64,64s64-28.7,64-64S291.3,192,256,192z"/>
                </svg>
              </div>
              <div class="title-container">
                <h1 class="title">CARTE DE RATION N° ${beneficiaire.nutrition_rations?.[0]?.numero_ration || ''}</h1>
                <h2 class="subtitle">Blanket Feeding</h2>
              </div>
              <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60" height="60">
                  <path fill="#00457C" d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M256,472 c-119.3,0-216-96.7-216-216S136.7,40,256,40s216,96.7,216,216S375.3,472,256,472z"/>
                  <path fill="#00457C" d="M256,96c-88.4,0-160,71.6-160,160s71.6,160,160,160s160-71.6,160-160S344.4,96,256,96z M256,376 c-66.3,0-120-53.7-120-120s53.7-120,120-120s120,53.7,120,120S322.3,376,256,376z"/>
                  <path fill="#00457C" d="M256,192c-35.3,0-64,28.7-64,64s28.7,64,64,64s64-28.7,64-64S291.3,192,256,192z"/>
                </svg>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <div class="info-item">
                  <span class="info-label">Province:</span> 
                  <span class="info-value">${beneficiaire.province || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Territoire:</span> 
                  <span class="info-value">${beneficiaire.territoire || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Partenaire:</span> 
                  <span class="info-value">${beneficiaire.partenaire || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Village:</span> 
                  <span class="info-value">${beneficiaire.village || ''}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Site/CS:</span> 
                  <span class="info-value">${beneficiaire.site_cs || ''}</span>
                </div>
              </div>
              <div class="col">
                <div class="enfant-box">
                  <h3 class="enfant-title">ENFANT</h3>
                </div>
                <div class="qr-container" id="qrcode"></div>
              </div>
            </div>
            
            <div class="info-item">
              <span class="info-label">Nom & prénom de l'enfant:</span> 
              <span class="info-value">${beneficiaire.nom_enfant || ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nom & prénom de la mère:</span> 
              <span class="info-value">${beneficiaire.nom_mere || ''}</span>
            </div>
            
            <div class="row">
              <div class="col" style="flex: 0 0 auto; min-width: 100px;">
                <div class="info-item">
                  <span class="info-label">Age (mois):</span> 
                  <span class="info-value">${beneficiaire.age_mois || ''}</span>
                </div>
              </div>
              <div class="col" style="flex: 0 0 auto; min-width: 100px;">
                <div class="info-item">
                  <span class="info-label">Sexe:</span> 
                  <span class="info-value">${beneficiaire.sexe === 'M' ? 'M ☑ F ☐' : 'M ☐ F ☑'}</span>
                </div>
              </div>
              <div class="col">
                <div class="info-item">
                  <span class="info-label">Période de validité:</span> 
                  <span class="info-value">${dateEnregistrement} à ${dateFin}</span>
                </div>
              </div>
            </div>
            
            <div class="info-item">
              <span class="info-label">N° d'enregistrement:</span> 
              <span class="info-value">${beneficiaire.numero_enregistrement || ''}</span>
            </div>
            
            <div class="divider">
              <p class="warning">GARDEZ BIEN CETTE CARTE. NE PAS LA PERDRE.</p>
              <p class="warning">Réservé aux agents de distribution !</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Enregistrement</th>
                  <th>1<sup>er</sup></th>
                  <th>2<sup>ème</sup></th>
                  <th>3<sup>ème</sup></th>
                  <th>4<sup>ème</sup></th>
                  <th>5<sup>ème</sup></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="empty-cell"></td>
                  <td>${beneficiaire.date_enregistrement ? dayjs(beneficiaire.date_enregistrement).format('DD/MM/YYYY') : ''}</td>
                  <td>${distributions[0]?.date_distribution ? dayjs(distributions[0].date_distribution).format('DD/MM/YYYY') : ''}</td>
                  <td>${distributions[1]?.date_distribution ? dayjs(distributions[1].date_distribution).format('DD/MM/YYYY') : ''}</td>
                  <td>${distributions[2]?.date_distribution ? dayjs(distributions[2].date_distribution).format('DD/MM/YYYY') : ''}</td>
                  <td>${distributions[3]?.date_distribution ? dayjs(distributions[3].date_distribution).format('DD/MM/YYYY') : ''}</td>
                  <td>${distributions[4]?.date_distribution ? dayjs(distributions[4].date_distribution).format('DD/MM/YYYY') : ''}</td>
                </tr>
                <tr>
                  <td>PB</td>
                  <td class="empty-cell"></td>
                  <td>${distributions[0]?.pb || ''}</td>
                  <td>${distributions[1]?.pb || ''}</td>
                  <td>${distributions[2]?.pb || ''}</td>
                  <td>${distributions[3]?.pb || ''}</td>
                  <td>${distributions[4]?.pb || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="print-button no-print" onclick="window.print(); return false;">Imprimer cette carte</button>
        </div>

        <script>
          window.onload = function() {
            // Générer le QR code
            var typeNumber = 4;
            var errorCorrectionLevel = 'L';
            var qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData('${qrData.replace(/'/g, "\\'")}');
            qr.make();
            document.getElementById('qrcode').innerHTML = qr.createImgTag(5);
          };
        </script>
      </body>
      </html>
    `;

    // Écrire le contenu dans la nouvelle fenêtre
    printWindow.document.write(cardContent);
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      printWindow.focus();
      // L'impression sera déclenchée par le bouton dans la page
      toast.success('Carte de ration prête à imprimer');
    };
  };

  // Colonnes pour le DataGrid
  const columns: GridColDef[] = [
    { field: 'numero_enregistrement', headerName: 'N° Enregistrement', width: 150 },
    { field: 'nom_enfant', headerName: 'Nom de l\'enfant', width: 180 },
    { field: 'nom_mere', headerName: 'Nom de la mère', width: 180 },
    { field: 'age_mois', headerName: 'Âge (mois)', width: 100, type: 'number' },
    { field: 'sexe', headerName: 'Sexe', width: 80 },
    { field: 'site_cs', headerName: 'Site/CS', width: 150 },
    { field: 'numero_carte', headerName: 'N° Carte', width: 120 },
    { field: 'statut', headerName: 'Statut', width: 100 },
    { field: 'nombre_distributions', headerName: 'Nb. Distributions', width: 130, type: 'number' },
    { 
      field: 'derniere_distribution', 
      headerName: 'Dernière Distribution', 
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString();
      }
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight={600}>
            Distribution Nutrition
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="nutrition tabs"
            >
              <Tab label="Enregistrement Distribution" />
              <Tab label="Rapport Global" />
            </Tabs>
          </Box>

          {activeTab === 0 ? (
            <>
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Numéro d'enregistrement"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      placeholder="Entrez le numéro d'enregistrement"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSearch}
                      disabled={loading}
                      startIcon={<SearchIcon />}
                      sx={{ height: 56 }}
                    >
                      Rechercher
                    </Button>
                  </Grid>
                  {beneficiaire && (
                    <Grid item xs={12} sm={6} md={2}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="secondary"
                        onClick={handlePrintRationCard}
                        startIcon={<PrintIcon />}
                        sx={{ height: 56 }}
                      >
                        Réimprimer Carte
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {beneficiaire && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="outlined" sx={{ mb: 4 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informations du bénéficiaire
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Numéro d'enregistrement
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {beneficiaire.numero_enregistrement}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Nom de l'enfant
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {beneficiaire.nom_enfant}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Nom de la mère
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {beneficiaire.nom_mere}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Âge
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {beneficiaire.age_mois} mois
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Sexe
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {beneficiaire.sexe === 'M' ? 'Masculin' : 'Féminin'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Site/Centre de Santé
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {beneficiaire.site_cs}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Nouvelle distribution
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={4}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="Date de distribution"
                            value={formData.dateDistribution}
                            onChange={handleDateChange}
                            slotProps={{ textField: { fullWidth: true } }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Cycle"
                          name="cycle"
                          value={formData.cycle}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Quantité"
                          name="quantite"
                          value={formData.quantite}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          label="PB (mm)"
                          name="pb"
                          value={formData.pb}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={8}>
                        <TextField
                          fullWidth
                          label="Observations"
                          name="observations"
                          value={formData.observations}
                          onChange={handleInputChange}
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={<SaveIcon />}
                      >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </Box>
                  </Box>

                  {distributions.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Historique des distributions
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Cycle</TableCell>
                              <TableCell>Quantité</TableCell>
                              <TableCell>PB</TableCell>
                              <TableCell>Observations</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {distributions.map((dist) => (
                              <TableRow key={dist.id}>
                                <TableCell>{new Date(dist.date_distribution).toLocaleDateString()}</TableCell>
                                <TableCell>{dist.cycle}</TableCell>
                                <TableCell>{dist.quantite}</TableCell>
                                <TableCell>{dist.pb || '-'}</TableCell>
                                <TableCell>{dist.observations || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Rapport des Bénéficiaires Nutrition
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={exportToCSV}
                  disabled={reportData.length === 0}
                >
                  Exporter en CSV
                </Button>
              </Box>
              
              <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={reportData}
                  columns={columns}
                  loading={loadingReport}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 25, page: 0 },
                    },
                  }}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                      quickFilterProps: { debounceMs: 500 },
                    },
                  }}
                />
              </Paper>
            </Box>
          )}
        </Paper>
      </div>
    </PageTransition>
  );
}

export default NutritionDistribution;