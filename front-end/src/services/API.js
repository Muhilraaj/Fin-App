import axios from 'axios';


class API
{
    static Label() 
    {
        return axios.get(process.env.REACT_APP_API_URL+'/api/labels').then((r)=>r.data).catch((err)=>{throw err});
    }
    static OnBehalf()
    {
        return axios.get(process.env.REACT_APP_API_URL+'/api/user').then((r)=>{
            r=r.data
            const list=[];
            r.map((e)=>{list.push(e['On-Behalf']);
        return '';});
            return list;
        }).catch((err)=>{throw err});
    }
    static SubmitExpense(Expense)
    {
        const ins=axios.create();
        return ins.post(process.env.REACT_APP_API_URL+'/api/expense',Expense);
    }
    static SubmitLogin(Login)
    {
        const ins2=axios.create();
        return ins2.post(process.env.REACT_APP_API_URL+'/api/login',Login);
    }
}

export default API;