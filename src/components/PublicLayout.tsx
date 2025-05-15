import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

const PublicLayout: React.FC = () => {
  return (
    <Box className="PublicApp">
      <Outlet />
    </Box>
  );
};

export default PublicLayout;
