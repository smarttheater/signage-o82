<template>
    <div v-if="is_initialized" id="app" :class="$route.meta.vertical ? 'verticalrender' : ''">
        >
        <router-view v-if="is_logined" />
        <form v-else class="loginform" @submit.prevent>
            <h2>ID</h2>
            <input v-model="loginId" type="text" name="userId" :disabled="busy_login" @keyup.enter="login" />

            <h2>Password</h2>
            <input v-model="password" type="password" name="password" :disabled="busy_login" @keyup.enter="login" />

            <button type="submit" class="btn btn-login" @click="login">login</button>
            <p v-if="$store.state.errMsg" class="errmsg">{{ $store.state.errMsg }}</p>
        </form>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { API_LOGIN, API_CHECK_TOKEN, API_FETCH_CONFIG } from './misc/api';

export default Vue.extend({
    name: 'App',
    data() {
        return {
            busy_login: false,
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
            if (loginId && password) {
                await this.execLogin(loginId, password);
                this.$store.commit('SET_config', await API_FETCH_CONFIG());
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
                    if (this.busy_login) {
                        return resolve();
                    }
                    this.busy_login = true;
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
                this.busy_login = false;
                return true;
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
        position: fixed;
        bottom: 4px;
        left: 4px;
        color: #d6c3b6;
        font-size: 10px;
        background: #fff;
    }
}

.loginform {
    max-width: 640px;
    padding: 48px;
    margin: 96px auto;
    background: #fafafa;
    h2 {
        margin-bottom: 8px;
        font-size: 24px;
        user-select: none;
    }
    input {
        display: block;
        border-radius: 4px;
        border: 1px solid #ccc;
        margin-bottom: 24px;
        width: 100%;
        font-size: 20px;
        padding: 10px;
    }
    .btn-login {
        display: table;
        border: none;
        margin: 20px auto;
        width: 160px;
        height: 48px;
        font-size: 24px;
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
    text-align: center;
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
    overflow: hidden;
    background-size: cover;
    background-repeat: no-repeat;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: 50%;
    width: 100vw;
    height: 0;
    padding-bottom: 56.25vw; // 16:9
}
.verticalrender {
    .svgcontainer {
        width: 56.25vw;
        height: 0;
        padding-bottom: 100vw; // 16:9
        top: -100vw;
        left: 43.75vw;
        transform: rotate(-90deg) !important;
        transform-origin: bottom right !important;
    }
}
</style>
