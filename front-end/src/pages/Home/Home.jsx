import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import { useNavigate } from 'react-router-dom';
import { getHomeShortcutGroups } from '../../config/navConfig';

function ShortcutCard({ item, onClick, variant = 'entry' }) {
  const Icon = item.icon;
  const isReport = variant === 'reports';
  const isLabels = variant === 'labels';

  return (
    <Card
      elevation={2}
      sx={{
        minWidth: { xs: '100%', sm: 200 },
        flex: { sm: '1 1 200px' },
        maxWidth: { sm: 280 },
        border: isReport || isLabels ? '1px solid' : 'none',
        borderColor: isLabels ? 'success.main' : 'divider',
        bgcolor: isReport || isLabels ? 'background.paper' : 'success.main',
        color: isReport || isLabels ? 'text.primary' : 'white',
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <Icon sx={{ color: isReport || isLabels ? 'success.main' : 'inherit' }} />
          <Typography variant="subtitle1" fontWeight={500}>
            {item.label}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const shortcutGroups = getHomeShortcutGroups();

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome to MyFinApp
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track expenses, income, and labels. Use the sidebar or shortcuts below to get started.
        </Typography>
      </Box>

      {shortcutGroups.map((group) => (
        <Box key={group.id}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: '0.08em' }}
          >
            {group.label}
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={2}
            sx={{ mt: 1.5 }}
          >
            {group.items.map((item) => (
              <ShortcutCard
                key={item.path}
                item={item}
                variant={
                  group.id === 'reports'
                    ? 'reports'
                    : group.id === 'labels'
                      ? 'labels'
                      : 'entry'
                }
                onClick={() => navigate(item.path)}
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
