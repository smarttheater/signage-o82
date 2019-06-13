import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';

Vue.use(Router);

export default new Router({
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
            meta: {
                title: '全体表示(出札上部)',
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
