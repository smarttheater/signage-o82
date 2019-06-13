import axios, { AxiosInstance } from 'axios';
import store from '../store';

export default (): AxiosInstance => {
    const axiosInstance = axios.create({
        timeout: 50000,
        withCredentials: true,        
    });
    axiosInstance.interceptors.response.use((res) => {
        if (res.headers.token) {
            store.commit('SET_token', res.headers.token);
        }
        return res;
    });
    axiosInstance.interceptors.request.use((config) => {
        config.headers.token = store.state.token;
        return config;
    });
    return axiosInstance;
};
