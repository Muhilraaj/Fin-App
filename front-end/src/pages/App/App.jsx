//import logo from './logo.svg';
import './App.css';
import ExpenseForm from '../InputForm/ExpenseForm';
import SignIn from '../SignIn/SignIn';
import { Routes, Route,Navigate } from 'react-router-dom';
import IncomeForm from '../InputForm/IncomeForm';
import ExpenseDetails from '../Analytics/ExpenseDetails';
import Home from '../Home/Home';
import IncomeDetails from '../Analytics/IncomeDetails';
import ConstructionExpenseForm from '../InputForm/ConstructionExpenseForm';
import ConstructionExpenseDetails from '../Analytics/ConstructionExpenseDetails';
import ManageExpenseLabels from '../Labels/ManageExpenseLabels';
import ManageIncomeLabels from '../Labels/ManageIncomeLabels';
import SnackbarWrapper from '../../components/SnackbarWrapper';

function App()
{
   return (
   <>
       <Routes>
          <Route path="/page/login" element={<SignIn/>} />
          <Route path="/page/expenseDetails" element={<ExpenseDetails/>} />
          <Route path="/page/expenseDetails/construction" element={<ConstructionExpenseDetails/>} />
          <Route path="/page/incomeDetails" element={<IncomeDetails/>} />
          <Route path="/" element={ <Navigate to="/page/login" replace={true} />  } />
          <Route path="/page/expense" element={<ExpenseForm/>} />
          <Route path="/page/construction" element={<ConstructionExpenseForm/>} />
          <Route path="/page/income" element={<IncomeForm/>} />
          <Route path="/page/home" element={<Home/>} />
          <Route path="/page/manageLabels/expense" element={<ManageExpenseLabels/>} />
          <Route path="/page/manageLabels/income" element={<ManageIncomeLabels/>} />
       </Routes>
       <SnackbarWrapper />
   </>)
}

export default App;