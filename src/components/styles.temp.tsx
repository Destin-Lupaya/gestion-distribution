// Styles centralisés pour le composant NutritionDistribution
export const nutritionStyles = {
  container: { 
    maxWidth: '1400px', 
    margin: '0 auto', 
    padding: '24px', 
    borderRadius: '12px', 
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
    backgroundColor: '#ffffff' 
  },
  header: { 
    marginBottom: '24px', 
    borderBottom: '1px solid #e0e0e0', 
    paddingBottom: '16px' 
  },
  title: { 
    fontWeight: 700, 
    color: '#1a365d', 
    fontSize: '1.75rem', 
    marginBottom: '8px' 
  },
  subtitle: { 
    color: '#4a5568', 
    marginTop: '8px', 
    fontSize: '1rem' 
  },
  paper: { 
    borderRadius: '12px', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
    marginBottom: '24px', 
    overflow: 'hidden',
    padding: '24px'
  },
  searchBar: { 
    '& .MuiOutlinedInput-root': { 
      borderRadius: '8px', 
      '& fieldset': { 
        borderColor: '#e2e8f0', 
        borderWidth: '1.5px' 
      }, 
      '&:hover fieldset': { 
        borderColor: '#94a3b8' 
      }, 
      '&.Mui-focused fieldset': { 
        borderColor: '#0078BE' 
      } 
    } 
  },
  button: { 
    textTransform: 'none', 
    fontWeight: 600, 
    borderRadius: '8px', 
    padding: '8px 16px', 
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)', 
    '&:hover': { 
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.12)' 
    } 
  },
  primaryButton: { 
    background: 'linear-gradient(45deg, #0078BE 30%, #00a0e9 90%)', 
    color: 'white', 
    '&:hover': { 
      background: 'linear-gradient(45deg, #006ba7 30%, #0091d4 90%)' 
    } 
  },
  secondaryButton: { 
    background: '#ffffff', 
    border: '1.5px solid #e2e8f0', 
    color: '#4a5568', 
    '&:hover': { 
      background: '#f8fafc', 
      borderColor: '#cbd5e1' 
    } 
  },
  card: { 
    borderRadius: '12px', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
    border: '1px solid #e2e8f0', 
    overflow: 'hidden' 
  },
  cardHeader: { 
    borderBottom: '1px solid #e2e8f0', 
    backgroundColor: '#f8fafc', 
    padding: '16px 20px' 
  },
  cardContent: { 
    padding: '20px' 
  },
  infoLabel: { 
    color: '#64748b', 
    fontSize: '0.875rem', 
    marginBottom: '4px' 
  },
  infoValue: { 
    fontWeight: 500, 
    fontSize: '1rem' 
  },
  tableHeader: { 
    backgroundColor: '#f8fafc', 
    '& .MuiTableCell-head': { 
      fontWeight: 600, 
      color: '#334155' 
    } 
  },
  tableRow: { 
    '&:nth-of-type(odd)': { 
      backgroundColor: '#fafafa' 
    }, 
    '&:hover': { 
      backgroundColor: '#f1f5f9' 
    } 
  },
  tabs: { 
    '& .MuiTab-root': { 
      textTransform: 'none', 
      fontWeight: 600, 
      fontSize: '0.95rem', 
      minWidth: '120px' 
    }, 
    '& .Mui-selected': { 
      color: '#0078BE' 
    }, 
    '& .MuiTabs-indicator': { 
      backgroundColor: '#0078BE' 
    } 
  },
  formField: { 
    '& .MuiOutlinedInput-root': { 
      borderRadius: '8px' 
    }, 
    '& .MuiInputLabel-root': { 
      fontSize: '0.95rem' 
    }, 
    '& .MuiOutlinedInput-input': { 
      padding: '14px 16px' 
    } 
  },
  dataGrid: { 
    border: 'none', 
    '& .MuiDataGrid-columnHeaders': { 
      backgroundColor: '#f8fafc', 
      borderBottom: '1px solid #e2e8f0' 
    }, 
    '& .MuiDataGrid-cell': { 
      borderBottom: '1px solid #f1f5f9' 
    }, 
    '& .MuiDataGrid-row:hover': { 
      backgroundColor: '#f1f5f9' 
    } 
  }
};
