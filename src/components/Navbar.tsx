import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton, 
  Divider, 
  ListItemIcon,
  Tooltip
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DrawIcon from '@mui/icons-material/Draw';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GridViewIcon from '@mui/icons-material/GridView';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HomeIcon from '@mui/icons-material/Home';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';

import { useAuth } from '../contexts/AuthContext';
import wfpLogo from '../assets/wfp-logo.svg';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [regMenuAnchor, setRegMenuAnchor] = useState<null | HTMLElement>(null);
  const [distMenuAnchor, setDistMenuAnchor] = useState<null | HTMLElement>(null);
  const [reportMenuAnchor, setReportMenuAnchor] = useState<null | HTMLElement>(null);
  const [advancedMenuAnchor, setAdvancedMenuAnchor] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleCloseUserMenu();
    navigate('/profile');
  };

  const NavButton = ({ to, icon, label }: { to: string; icon: JSX.Element; label: string }) => (
    <Button
      component={Link}
      to={to}
      sx={{
        mx: 1,
        position: 'relative',
        color: isActive(to) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
        fontWeight: 600,
        padding: '8px 12px',
        textTransform: 'none',
        fontSize: '0.95rem',
        letterSpacing: '0.3px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {React.cloneElement(icon, { 
          sx: { 
            color: isActive(to) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
            transition: 'color 0.2s ease-in-out',
            fontSize: '1.2rem',
            marginRight: '4px'
          } 
        })}
        {label}
      </Box>
      {isActive(to) && (
        <motion.div
          layoutId="activeIndicator"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: '#ffffff',
            borderRadius: '3px 3px 0 0',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Button>
  );

  return (
    <AppBar 
      position="sticky" 
      elevation={4}
      sx={{
        backgroundColor: 'primary.main',
        borderBottom: 'none',
        boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 70, px: '0 !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={wfpLogo} alt="WFP Logo" style={{ height: 40, marginRight: 16 }} />
            <Typography 
              variant="h5" 
              component="div"
              sx={{ 
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '1.5rem'
              }}
            >
              GESTION DISTRIBUTION
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'center' }}>
            <NavButton to="/app" icon={<HomeIcon />} label="Accueil" />
            
            {/* Menu Données et Enregistrement combiné avec dropdown */}
            <Box sx={{ position: 'relative', mx: 1 }}>
              <Button
                sx={{
                  color: isActive('/data') || isActive('/manual-registration') || isActive('/nutrition-registration') || isActive('/import') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 600,
                  padding: '8px 12px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  letterSpacing: '0.3px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                  },
                }}
                onClick={(e) => setRegMenuAnchor(e.currentTarget)}
                endIcon={<span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>▼</span>}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GridViewIcon sx={{ 
                    color: isActive('/data') || isActive('/manual-registration') || isActive('/nutrition-registration') || isActive('/import') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                    transition: 'color 0.2s ease-in-out',
                    fontSize: '1.1rem',
                    marginRight: '4px'
                  }} />
                  Données
                </Box>
                {(isActive('/app/data') || isActive('/app/manual-registration') || isActive('/app/nutrition-registration') || isActive('/app/import')) && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: '#ffffff',
                      borderRadius: '3px 3px 0 0',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Button>
              <Menu
                anchorEl={regMenuAnchor}
                open={Boolean(regMenuAnchor)}
                onClose={() => setRegMenuAnchor(null)}
                sx={{ mt: 1 }}
              >
                <MenuItem 
                  component={Link} 
                  to="/app/data" 
                  onClick={() => setRegMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/data') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/data') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <GridViewIcon fontSize="small" color={isActive('/data') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Visualisation des données</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/import" 
                  onClick={() => setRegMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/import') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/import') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <ListAltIcon fontSize="small" color={isActive('/import') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Liste et importation</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/manual-registration" 
                  onClick={() => setRegMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/manual-registration') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/manual-registration') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <PersonAddIcon fontSize="small" color={isActive('/manual-registration') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Enregistrement Standard</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/nutrition-registration" 
                  onClick={() => setRegMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/nutrition-registration') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/nutrition-registration') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <RestaurantIcon fontSize="small" color={isActive('/nutrition-registration') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Enregistrement Nutrition</Typography>
                </MenuItem>
              </Menu>
            </Box>
            
            {/* Menu Signatures et Distributions */}
            <Box sx={{ position: 'relative', mx: 1 }}>
              <Button
                sx={{
                  color: isActive('/app/signatures') || isActive('/app/pending-distributions') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 600,
                  padding: '8px 12px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  letterSpacing: '0.3px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                  },
                }}
                onClick={(e) => setDistMenuAnchor(e.currentTarget)}
                endIcon={<span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>▼</span>}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DrawIcon sx={{ 
                    color: isActive('/app/signatures') || isActive('/app/pending-distributions') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                    transition: 'color 0.2s ease-in-out',
                    fontSize: '1.1rem',
                    marginRight: '4px'
                  }} />
                  Distributions
                </Box>
                {(isActive('/app/signatures') || isActive('/app/pending-distributions')) && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: '#ffffff',
                      borderRadius: '3px 3px 0 0',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Button>
              <Menu
                anchorEl={distMenuAnchor}
                open={Boolean(distMenuAnchor)}
                onClose={() => setDistMenuAnchor(null)}
                sx={{ mt: 1 }}
              >
                <MenuItem 
                  component={Link} 
                  to="/app/signatures" 
                  onClick={() => setDistMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/signatures') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/signatures') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <DrawIcon fontSize="small" color={isActive('/app/signatures') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  Collecte de signatures
                </MenuItem>
                {user?.roles?.includes('distribution') && (
                  <MenuItem 
                    component={Link} 
                    to="/app/pending-distributions" 
                    onClick={() => setDistMenuAnchor(null)}
                    sx={{ 
                      color: isActive('/app/pending-distributions') ? 'primary.main' : 'inherit',
                      fontWeight: isActive('/app/pending-distributions') ? 600 : 400
                    }}
                  >
                    <ListItemIcon>
                      <PendingActionsIcon fontSize="small" color={isActive('/app/pending-distributions') ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    Distributions en attente
                  </MenuItem>
                )}
                <MenuItem 
                  component={Link} 
                  to="/app/nutrition-distribution" 
                  onClick={() => setDistMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/nutrition-distribution') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/nutrition-distribution') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <LocalDiningIcon fontSize="small" color={isActive('/nutrition-distribution') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Distribution Nutrition</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/calendrier-distribution" 
                  onClick={() => setDistMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/calendrier-distribution') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/calendrier-distribution') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <CalendarMonthIcon fontSize="small" color={isActive('/app/calendrier-distribution') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Calendrier de distribution</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/unified-report" 
                  onClick={() => setDistMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/unified-report') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/unified-report') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <BarChartIcon fontSize="small" color={isActive('/app/unified-report') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Rapports Unifiés</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/reception-waybill" 
                  onClick={() => setDistMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/reception-waybill') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/reception-waybill') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <InventoryIcon fontSize="small" color={isActive('/app/reception-waybill') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Réception Waybill</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/mpos" 
                  onClick={() => setDistMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/mpos') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/mpos') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <PeopleIcon fontSize="small" color={isActive('/app/mpos') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>MPOS</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/geo-data" 
                  onClick={() => setDistMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/geo-data') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/geo-data') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <LocationOnIcon fontSize="small" color={isActive('/app/geo-data') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <Typography>Données Géographiques</Typography>
                </MenuItem>
              </Menu>
            </Box>
            
            {/* Menu Rapports */}
            <Box sx={{ position: 'relative', mx: 1 }}>
              <Button
                sx={{
                  color: isActive('/app/rapport') || isActive('/app/unified-report') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 600,
                  padding: '8px 12px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  letterSpacing: '0.3px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                  },
                }}
                onClick={(e) => setReportMenuAnchor(e.currentTarget)}
                endIcon={<span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>▼</span>}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon sx={{ 
                    color: isActive('/app/rapport') || isActive('/app/unified-report') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                    transition: 'color 0.2s ease-in-out',
                    fontSize: '1.1rem',
                    marginRight: '4px'
                  }} />
                  Rapports
                </Box>
                {(isActive('/app/rapport') || isActive('/app/unified-report')) && (
                  <motion.div
                    layoutId="activeIndicator3"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: '#ffffff',
                      borderRadius: '3px 3px 0 0',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Button>
              <Menu
                anchorEl={reportMenuAnchor}
                open={Boolean(reportMenuAnchor)}
                onClose={() => setReportMenuAnchor(null)}
                sx={{ mt: 1 }}
              >
                <MenuItem 
                  component={Link} 
                  to="/app/rapport" 
                  onClick={() => setReportMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/rapport') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/rapport') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <AssessmentIcon fontSize="small" color={isActive('/app/rapport') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <Typography>Rapport Standard</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/unified-report" 
                  onClick={() => setReportMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/unified-report') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/unified-report') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <BarChartIcon fontSize="small" color={isActive('/app/unified-report') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <Typography>Rapports Unifiés</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/detailed-reports" 
                  onClick={() => setReportMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/detailed-reports') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/detailed-reports') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <AssessmentIcon fontSize="small" color={isActive('/app/detailed-reports') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <Typography>Rapports Détaillés</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/distribution-report" 
                  onClick={() => setReportMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/distribution-report') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/distribution-report') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <PeopleIcon fontSize="small" color={isActive('/app/distribution-report') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <Typography>Rapport de Distribution</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/batch-commodity-report" 
                  onClick={() => setReportMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/batch-commodity-report') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/batch-commodity-report') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <InventoryIcon fontSize="small" color={isActive('/app/batch-commodity-report') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <Typography>Rapport par Batch et Commodité</Typography>
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/app/tonnage-comparison-report" 
                  onClick={() => setReportMenuAnchor(null)}
                  sx={{ 
                    color: isActive('/app/tonnage-comparison-report') ? 'primary.main' : 'inherit',
                    fontWeight: isActive('/app/tonnage-comparison-report') ? 600 : 400
                  }}
                >
                  <ListItemIcon>
                    <BarChartIcon fontSize="small" color={isActive('/app/tonnage-comparison-report') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <Typography>Comparaison Tonnage Waybill/MPOS</Typography>
                </MenuItem>
              </Menu>
            </Box>
            
            {/* Menu Gestion Avancée des Distributions */}
            {(user?.roles?.includes('admin') || user?.roles?.includes('manager')) && (
              <Box sx={{ position: 'relative', mx: 1 }}>
                <Button
                  sx={{
                    color: isActive('/app/programmes-aide') || isActive('/app/calendrier-distribution') || isActive('/app/assistances-distribuees') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                    fontWeight: 600,
                    padding: '8px 12px',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    letterSpacing: '0.3px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                    },
                  }}
                  onClick={(e) => setAdvancedMenuAnchor(e.currentTarget)}
                  endIcon={<span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>▼</span>}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon sx={{ 
                      color: isActive('/app/programmes-aide') || isActive('/app/calendrier-distribution') || isActive('/app/assistances-distribuees') ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                      transition: 'color 0.2s ease-in-out',
                      fontSize: '1.1rem',
                      marginRight: '4px'
                    }} />
                    Gestion Avancée
                  </Box>
                  {(isActive('/app/programmes-aide') || isActive('/app/calendrier-distribution') || isActive('/app/assistances-distribuees')) && (
                    <motion.div
                      layoutId="activeIndicator2"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        backgroundColor: '#ffffff',
                        borderRadius: '3px 3px 0 0',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Button>
                <Menu
                  anchorEl={advancedMenuAnchor}
                  open={Boolean(advancedMenuAnchor)}
                  onClose={() => setAdvancedMenuAnchor(null)}
                  sx={{ mt: 1 }}
                >
                  <MenuItem 
                    component={Link} 
                    to="/app/programmes-aide" 
                    onClick={() => setAdvancedMenuAnchor(null)}
                    sx={{ 
                      color: isActive('/app/programmes-aide') ? 'primary.main' : 'inherit',
                      fontWeight: isActive('/app/programmes-aide') ? 600 : 400
                    }}
                  >
                    <ListItemIcon>
                      <InventoryIcon fontSize="small" color={isActive('/app/programmes-aide') ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <Typography>Programmes d'aide</Typography>
                  </MenuItem>
                  <MenuItem 
                    component={Link} 
                    to="/app/calendrier-distribution" 
                    onClick={() => setAdvancedMenuAnchor(null)}
                    sx={{ 
                      color: isActive('/app/calendrier-distribution') ? 'primary.main' : 'inherit',
                      fontWeight: isActive('/app/calendrier-distribution') ? 600 : 400
                    }}
                  >
                    <ListItemIcon>
                      <CalendarMonthIcon fontSize="small" color={isActive('/app/calendrier-distribution') ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <Typography>Calendrier de distribution</Typography>
                  </MenuItem>
                  <MenuItem 
                    component={Link} 
                    to="/app/assistances-distribuees" 
                    onClick={() => setAdvancedMenuAnchor(null)}
                    sx={{ 
                      color: isActive('/app/assistances-distribuees') ? 'primary.main' : 'inherit',
                      fontWeight: isActive('/app/assistances-distribuees') ? 600 : 400
                    }}
                  >
                    <ListItemIcon>
                      <PeopleIcon fontSize="small" color={isActive('/app/assistances-distribuees') ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <Typography>Suivi des assistances</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            )}
            
            {user ? (
              <Box sx={{ ml: 2 }}>
                <Tooltip title="Paramètres du compte">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.light',
                        color: '#FFFFFF',
                        width: 40,
                        height: 40,
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseUserMenu}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.role}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleProfile}>
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body1">Mon profil</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <Typography variant="body1" color="error.main">Se déconnecter</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button 
                component={Link} 
                to="/login" 
                variant="contained" 
                color="secondary" 
                sx={{ 
                  ml: 2,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  px: 3
                }}
              >
                Connexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;