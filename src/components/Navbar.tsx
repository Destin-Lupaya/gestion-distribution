import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
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

function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavButton = ({ to, icon, label }: { to: string; icon: JSX.Element; label: string }) => (
    <Button
      component={Link}
      to={to}
      sx={{
        mx: 1,
        position: 'relative',
        color: isActive(to) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
        fontWeight: 500,
        padding: '8px 12px',
        textTransform: 'none',
        fontSize: '0.9rem',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {React.cloneElement(icon, { 
          sx: { 
            color: isActive(to) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
            transition: 'color 0.2s ease-in-out',
            fontSize: '1.1rem'
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
      elevation={0}
      sx={{
        backgroundColor: 'primary.main',
        borderBottom: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 70, px: '0 !important' }}>
          <Typography 
            variant="h5" 
            component="div"
            sx={{ 
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            GESTION DISTRIBUTION
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NavButton to="/" icon={<HomeIcon />} label="Accueil" />
            <NavButton to="/import" icon={<ListAltIcon />} label="Liste" />
            <NavButton to="/manual-registration" icon={<PersonAddIcon />} label="Enregistrement" />
            <NavButton to="/signatures" icon={<DrawIcon />} label="Signatures" />
            <NavButton to="/pending-distributions" icon={<PendingActionsIcon />} label="Approbations" />
            <NavButton to="/rapport" icon={<AssessmentIcon />} label="Rapport" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NavButton to="/data" icon={<GridViewIcon />} label="Données" />
            <NavButton to="/nutrition-registration" icon={<RestaurantIcon />} label="Enregistrement Nutrition" />
            <NavButton to="/nutrition-distribution" icon={<LocalDiningIcon />} label="Distribution Nutrition" />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;