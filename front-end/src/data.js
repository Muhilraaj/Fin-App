import axios from 'axios';
import jsonpAdapter from 'axios-jsonp';

const data=axios({url:'https://myfinapi18.azurewebsites.net/api/labels?code=daSl1rP1F0w--C3A0DQXoltQrv8942H_aXTomPfyYZq3AzFu0xUD0A==',adapter: jsonpAdapter})

module.exports={data}