<template>
    <div v-if="is_initialized" id="app">
        <router-view v-if="is_logined" />
        <div v-else>
            <h1>Login</h1>
            <input v-model="loginId" type="text" name="user" @keydown.enter="login" />
            <input v-model="password" type="password" name="password" @keydown.enter="login" />
            <button @click="login">login</button>
        </div>
        <p v-if="$store.state.errMsg" class="errmsg">{{ $store.state.errMsg }}</p>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { API_LOGIN, API_CHECK_TOKEN, API_FETCH_CONFIG } from './misc/api';

export default Vue.extend({
    name: 'App',
    data() {
        return {
            is_initialized: false,
            is_logined: false,
            loginId: '',
            password: '',
        };
    },
    async created() {
        // Vue-Routerのqueryが空になるので生操作する
        const urlObject = new URL(window.location.href);
        const loginId = urlObject.searchParams.get('id') || '';
        const password = urlObject.searchParams.get('pass') || '';
        const refresh = () => {
            urlObject.searchParams.delete('id');
            urlObject.searchParams.delete('pass');
            // window.location.href = urlObject.href;
        };
        try {
            console.log({ loginId, password });
            if (loginId && password) {
                await this.execLogin(loginId, password);
            } else if (this.$store.state.token && this.$store.state.user) {
                console.log(await API_CHECK_TOKEN(this.$store.state.token));
                this.$store.commit('SET_config', await API_FETCH_CONFIG());
                this.is_logined = true;
            }
        } catch (e) {
            this.$store.commit('SET_token', '');
            return refresh();
        }
        this.is_initialized = true;
    },
    methods: {
        execLogin(id: string, pass: string) {
            return new Promise(async (resolve, reject) => {
                try {
                    const loginResult = await API_LOGIN(id, pass);
                    // ※ tokenはaxiosのintercepterが保存する
                    this.$store.commit('SET_user', loginResult.user);
                    this.$store.commit('SET_config', await API_FETCH_CONFIG());
                    this.is_logined = true;
                    resolve();
                } catch (e) {
                    alert(e.message);
                    reject(e);
                }
            });
        },
        login() {
            return this.execLogin(this.loginId, this.password);
        },
    },
});
</script>

<style lang="scss">
* {
    box-sizing: border-box;
}
html,
body,
#app {
    background: #fff; //#3c3c3c;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    font-size: 0;
    line-height: 1;
}
h1,
h2,
h3,
p,
ul {
    margin: 0;
    padding: 0;
}
li {
    list-style: none;
}
#app {
    position: relative;
    .errmsg {
        position: absolute;
        bottom: 4px;
        left: 4px;
        color: #d6c3b6;
        font-size: 10px;
    }
}

.btn {
    font-size: 16px;
    background-color: #555;
    color: #fff;
    display: table;
    padding: 0.4em;
    cursor: pointer;
    user-select: none;
    &:hover {
        background-color: #999;
    }
    > span {
        display: table-cell;
    }
}
.svgcontainer {
    pointer-events: none;
    user-select: none;
    position: absolute;
    width: 100vw;
    height: 0;
    padding-bottom: 56.25vw; // 16:9
    overflow: hidden;
    background-size: cover;
    background-repeat: no-repeat;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: 50%;
}
</style>
