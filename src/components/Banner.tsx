import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const BannerContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  padding: theme.spacing(6, 0),
  color: '#ffffff',
  position: 'relative',
  overflow: 'hidden',
  marginBottom: theme.spacing(4),
}));

const BannerOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'url(/banner-pattern.png) repeat',
  opacity: 0.1,
  zIndex: 1,
});

const BannerContent = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.primary.main,
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  alignSelf: 'flex-start',
  marginTop: theme.spacing(2),
}));

interface BannerProps {
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

const Banner: React.FC<BannerProps> = ({ title, subtitle, buttonText, buttonLink }) => {
  return (
    <BannerContainer>
      <BannerOverlay />
      <BannerContent maxWidth="lg">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 400, maxWidth: '800px', opacity: 0.9 }}>
          {subtitle}
        </Typography>
        {buttonText && buttonLink && (
          <StyledButton variant="contained" disableElevation>
            <Link to={buttonLink} style={{ color: 'inherit', textDecoration: 'none' }}>
              {buttonText}
            </Link>
          </StyledButton>
        )}
      </BannerContent>
    </BannerContainer>
  );
};

export default Banner;
