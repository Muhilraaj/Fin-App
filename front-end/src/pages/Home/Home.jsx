import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react';
import theme from '../../assets/theme';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@mui/material';

function Home() {
    const navigate = useNavigate();

    const handleExpense = (event) => {
        event.preventDefault();
        navigate('/page/expense');
    }

    const handleConstruction = (event) => {
        event.preventDefault();
        navigate('/page/construction');
    }

    const handleExpenseDetails = (event) => {
        event.preventDefault();
        navigate('/page/expenseDetails');
    }
    const handleIncomeDetails = (event) => {
        event.preventDefault();
        navigate('/page/incomeDetails');
    }
    const handleConstructionExpenseDetails = (event) => {
        event.preventDefault();
        navigate('/page/expenseDetails/construction');
    }

    const handleIncome = (event) => {
        event.preventDefault();
        navigate('/page/income');
    }

    return (
        <ThemeProvider theme={theme}>
            <Box display="flex" flexDirection="column" minHeight="100vh">
                <AppBar position="static">
                    <Toolbar variant="dense">
                        <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" color="inherit" component="div">
                            Home
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Box sx={{ display: 'flex' }} p={4}
            display="flex"
          >
                    <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                        <Card
                            elevation={10}
                            onClick={handleExpense}
                            sx={{
                                minWidth: 345,
                                backgroundColor: theme.palette.success.main,
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" align="center">
                                    Expense
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card
                            elevation={10}
                            onClick={handleConstruction}
                            sx={{
                                minWidth: 345,
                                backgroundColor: theme.palette.success.main,
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" align="center">
                                    Construction
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card
                            elevation={10}
                            onClick={handleIncome}
                            sx={{
                                minWidth: 345,
                                backgroundColor: theme.palette.success.main,
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" align="center">
                                    Income
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card
                            elevation={10}
                            onClick={handleExpenseDetails}
                            sx={{
                                minWidth: 345,
                                backgroundColor: theme.palette.success.main,
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" align="center">
                                    Expense Detail
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card
                            elevation={10}
                            onClick={handleConstructionExpenseDetails}
                            sx={{
                                minWidth: 345,
                                backgroundColor: theme.palette.success.main,
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" align="center">
                                    Construction Detail
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card
                            elevation={10}
                            onClick={handleIncomeDetails}
                            sx={{
                                minWidth: 345,
                                backgroundColor: theme.palette.success.main,
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" align="center">
                                    Income Detail
                                </Typography>
                            </CardContent>
                        </Card>
                    </Stack>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default Home;
