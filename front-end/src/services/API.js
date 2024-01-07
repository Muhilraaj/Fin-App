import axios from 'axios';


class API {
    static ExpenseLabel() {
        return axios.get(process.env.REACT_APP_API_URL + '/api/labels/expense', { withCredentials: true }).then((r) => r.data).catch((err) => { throw err });
    }
    static IncomeLabel() {
        return axios.get(process.env.REACT_APP_API_URL + '/api/labels/income', { withCredentials: true }).then((r) => r.data).catch((err) => { throw err });
    }
    static OnBehalf() {
        return axios.get(process.env.REACT_APP_API_URL + '/api/user', { withCredentials: true }).then((r) => {
            r = r.data
            const list = [];
            r.map((e) => {
                list.push(e['On-Behalf']);
                return '';
            });
            return list;
        }).catch((err) => { throw err });
    }
    static SubmitExpense(Expense) {
        const ins = axios.create();
        return ins.post(process.env.REACT_APP_API_URL + '/api/expense', Expense, { withCredentials: true });
    }

    static SubmitIncome(Income) {
        const ins = axios.create();
        return ins.post(process.env.REACT_APP_API_URL + '/api/income', Income, { withCredentials: true });
    }
    static SubmitLogin(Login) {
        const ins2 = axios.create();
        return ins2.post(process.env.REACT_APP_API_URL + '/api/login', Login);
    }
}

export default API;