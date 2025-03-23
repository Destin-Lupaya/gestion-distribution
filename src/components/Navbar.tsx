import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DrawIcon from '@mui/icons-material/Draw';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GridViewIcon from '@mui/icons-material/GridView';

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
        color: isActive(to) ? 'primary.main' : 'text.secondary',
        fontWeight: 500,
        '&:hover': {
          backgroundColor: 'rgba(37, 99, 235, 0.04)',
          color: 'primary.main',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {React.cloneElement(icon, { 
          sx: { 
            color: isActive(to) ? 'primary.main' : 'text.secondary',
            transition: 'color 0.2s ease-in-out'
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
            backgroundColor: '#2563eb',
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
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', height: 70, px: '0 !important' }}>
          <Typography 
            variant="h5" 
            component="div"
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              letterSpacing: '-0.5px'
            }}
          >
            Gestion des Distributions
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NavButton to="/" icon={<ListAltIcon />} label="Vérification Liste" />
            <NavButton to="/signatures" icon={<DrawIcon />} label="Émargement" />
            <NavButton to="/rapport" icon={<AssessmentIcon />} label="Rapport" />
            <NavButton to="/data" icon={<GridViewIcon />} label="Données" />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;