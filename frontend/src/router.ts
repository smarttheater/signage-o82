import Vue from 'vue';
import Router from 'vue-router';
import store from './store';
import Home from './views/Home.vue';
import { ENUM_TICKET_EVENT_IDS } from './Constants';

Vue.use(Router);

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home,
        },
        {
            path: '/info',
            name: 'info',
            props: {
                requiredTicketIdArray: [ENUM_TICKET_EVENT_IDS.FACTORYTOUR, ENUM_TICKET_EVENT_IDS.MYBABYSTAR],
            },
            meta: {
                title: '全体表示(出札上部)',
            },
            component: () => import(/* webpackChunkName: "info" */ './views/Info.vue'),
        },
        {
            path: '/info/v',
            name: 'info-vertical',
            props: {
                requiredTicketIdArray: [ENUM_TICKET_EVENT_IDS.FACTORYTOUR, ENUM_TICKET_EVENT_IDS.MYBABYSTAR],
            },
            meta: {
                vertical: true,
                title: '縦型全体表示(出札上部)',
            },
            component: () => import(/* webpackChunkName: "info" */ './views/Info.vue'),
        },
        {
            path: '/info-nofactory',
            name: 'info-nofactory',
            props: {
                isNoFactory: true,
                requiredTicketIdArray: [ENUM_TICKET_EVENT_IDS.MYBABYSTAR],
            },
            meta: {
                title: '全体表示(出札上部)(工場見学無し)',
            },
            component: () => import(/* webpackChunkName: "info" */ './views/Info.vue'),
        },
        {
            path: '/info-nofactory/v',
            name: 'info-nofactory-vertical',
            props: {
                isNoFactory: true,
                requiredTicketIdArray: [ENUM_TICKET_EVENT_IDS.MYBABYSTAR],
            },
            meta: {
                vertical: true,
                title: '縦型全体表示(出札上部)(工場見学無し)',
            },
            component: () => import(/* webpackChunkName: "info" */ './views/Info.vue'),
        },
        {
            path: '/guide1',
            name: 'guide1',
            meta: {
                title: 'オリジナルベビースター作り体験 案内中',
            },
            component: () => import(/* webpackChunkName: "guide1" */ './views/Guide1.vue'),
        },
        {
            path: '/guide2',
            name: 'guide2',
            meta: {
                title: 'ベビースターチョコクランチ作り体験/フリフリベビースター体験',
            },
            component: () => import(/* webpackChunkName: "guide2" */ './views/Guide2.vue'),
        },
        {
            path: '/admin/:target',
            name: 'admin',
            component: () => import(/* webpackChunkName: "admin" */ './views/UpdateStatus.vue'),
        },
    ],
});

router.beforeEach((to, from, next) => {
    store.commit('SET_errMsg', '');
    next();
});

export default router;
