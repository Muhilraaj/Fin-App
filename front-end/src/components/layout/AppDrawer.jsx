import React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DRAWER_WIDTH,
  footerNavItem,
  isNavItemActive,
  navGroups,
} from '../../config/navConfig';

function NavList({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (path) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <>
      {navGroups.map((group) => (
        <List
          key={group.id}
          subheader={(
            <ListSubheader
              component="div"
              sx={{
                bgcolor: 'transparent',
                lineHeight: '32px',
                mt: 1,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'text.secondary',
              }}
            >
              {group.label}
            </ListSubheader>
          )}
        >
          {group.items.map((item) => {
            const Icon = item.icon;
            const selected = isNavItemActive(location.pathname, item.path);
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => handleClick(item.path)}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: (theme) => `${theme.palette.success.main}14`,
                    borderLeft: '4px solid',
                    borderColor: 'success.main',
                    '&:hover': {
                      bgcolor: (theme) => `${theme.palette.success.main}20`,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: selected ? 'success.main' : 'inherit' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: selected ? 600 : 400 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      ))}
    </>
  );
}

function DrawerFooter({ onNavigate }) {
  const navigate = useNavigate();
  const FooterIcon = footerNavItem.icon;

  return (
    <Box sx={{ mt: 'auto', p: 1 }}>
      <Divider sx={{ mb: 1 }} />
      <ListItemButton
        onClick={() => {
          navigate(footerNavItem.path);
          onNavigate?.();
        }}
        sx={{ mx: 1, borderRadius: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <FooterIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={footerNavItem.label} />
      </ListItemButton>
    </Box>
  );
}

function DrawerContent({ onNavigate }) {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography variant="h6" fontWeight={700} color="success.main">
          MyFinApp
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Personal finance tracker
        </Typography>
      </Box>
      <Divider />
      <NavList onNavigate={onNavigate} />
      <DrawerFooter onNavigate={onNavigate} />
    </Box>
  );
}

export default function AppDrawer({ variant, open, onClose }) {
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DrawerContent onNavigate={variant === 'temporary' ? onClose : undefined} />
    </Drawer>
  );
}
