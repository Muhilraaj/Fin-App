//import logo from './logo.svg';
import './App.css';
import ExpenseForm from '../InputForm/ExpenseForm';
import SignIn from '../SignIn/SignIn';
import { Routes, Route } from 'react-router-dom';

function App()
{
   return (
   <>
       <Routes>
          <Route path="/page//login" element={<SignIn/>} />
          <Route path="/page/expense" element={<ExpenseForm/>} />
       </Routes>
   </>)
}

export default App;