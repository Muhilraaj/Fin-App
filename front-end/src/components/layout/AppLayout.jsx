import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Outlet, useLocation } from 'react-router-dom';
import { DRAWER_WIDTH, getPageTitle } from '../../config/navConfig';
import { PageActionsProvider } from './PageActionsContext';
import AppDrawer from './AppDrawer';
import AppTopBar from './AppTopBar';

function AppLayoutContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppTopBar
        title={pageTitle}
        onMenuClick={handleDrawerToggle}
        showMenuButton={isMobile}
      />

      {isMobile ? (
        <AppDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      ) : (
        <AppDrawer variant="permanent" open />
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar variant="dense" />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default function AppLayout() {
  return (
    <PageActionsProvider>
      <AppLayoutContent />
    </PageActionsProvider>
  );
}
