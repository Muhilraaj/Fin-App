//import logo from './logo.svg';
import './App.css';
import ExpenseForm from '../InputForm/ExpenseForm';
import SignIn from '../SignIn/SignIn';
import { Routes, Route,Navigate } from 'react-router-dom';
import IncomeForm from '../InputForm/IncomeForm';

function App()
{
   return (
   <>
       <Routes>
          <Route path="/page/login" element={<SignIn/>} />
          <Route path="/" element={ <Navigate to="/page/login" replace={true} />  } />
          <Route path="/page/expense" element={<ExpenseForm/>} />
          <Route path="/page/income" element={<IncomeForm/>} />
       </Routes>
   </>)
}

export default App;