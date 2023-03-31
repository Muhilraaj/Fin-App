import axios from 'axios';


class FormData
{
    static Label() 
    {
        return axios.get(process.env.REACT_APP_API_Label_URL).then((r)=>r.data).catch((err)=>{throw err});
    }
    static OnBehalf()
    {
        return axios.get(process.env.REACT_APP_API_OnBehalf_URL).then((r)=>{
            r=r.data
            const list=[];
            r.map((e)=>{list.push(e['On-Behalf'])});
            return list;
        }).catch((err)=>{throw err});
    }
}

export default FormData;