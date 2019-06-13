import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Timer from './components/Timer.vue';

Vue.component('timer', Timer);

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    render: (h) => h(App),
}).$mount('#app');
