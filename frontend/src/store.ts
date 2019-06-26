import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { IAppConfig, IUser } from './Constants';

Vue.use(Vuex);

export default new Vuex.Store({
    plugins: [createPersistedState({ storage: sessionStorage })],
    state: {
        user: {} as IUser,
        token: '' as string,
        config: {} as IAppConfig,
        errMsg: '' as string,
    },
    mutations: {
        SET_token(state, token: string) {
            state.token = token;
        },
        SET_user(state, user: IUser) {
            state.user = user;
        },
        SET_config(state, config: IAppConfig) {
            state.config = config;
        },
        SET_errMsg(state, errMsg: string) {
            state.errMsg = errMsg;
        },
    },
    actions: {
        LOGOUT({ commit }) {
            commit('SET_token', '');
            commit('SET_isAdmin', false);
            commit('SET_config', {});
            commit('SET_errMsg', '');
            return window.location.reload(true);
        },
    },
});
