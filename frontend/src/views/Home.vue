<template>
    <div class="home">
        <h1>サイネージ</h1>
        <ul>
            <li v-for="route in routes" :key="route.name">
                <h2>
                    <router-link :to="route">[{{ route.path }}] {{ route.meta.title }}</router-link>
                </h2>
            </li>
        </ul>
        <hr />
        <template v-if="$store.state.user.isAdmin">
            <h1>管理画面</h1>
            <ul>
                <li v-for="eventId in adminEventIdArray" :key="eventId">
                    <h2>
                        <router-link :to="{ path: `/admin/${eventId}` }">[/admin/{{ eventId }}] {{ EVENT_NAME_DIC[eventId] }}</router-link>
                    </h2>
                </li>
            </ul>
            <p class="btn btn-reload" style="display:none;" @click="forceReload"><span>全画面強制リロード</span></p>
            <hr />
        </template>
        <p class="btn btn-logout" @click="logout"><span>ログアウト</span></p>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { RouteConfig } from 'vue-router';
import { API_FORCE_RELOAD } from '../misc/api';
import { ENUM_LOCAL_EVENT_IDS, EVENT_NAME_DIC } from '../Constants';

export default Vue.extend({
    name: 'Home',
    data() {
        return {
            EVENT_NAME_DIC,
        };
    },
    computed: {
        routes(): RouteConfig[] {
            return (this.$router as any).options.routes.filter((route: RouteConfig) => {
                return route.name !== 'home' && route.name !== 'admin';
            });
        },
        adminEventIdArray(): string[] {
            return [...Object.keys(ENUM_LOCAL_EVENT_IDS), 'ALL'];
        },
    },
    methods: {
        logout() {
            this.$store.dispatch('LOGOUT');
        },
        async forceReload() {
            if (!window.confirm('全画面にリロードを命令しますか？')) {
                return false;
            }
            try {
                await API_FORCE_RELOAD();
            } catch (e) {
                alert(e.error || e.message);
            }
            return true;
        },
    },
});
</script>

<style lang="scss" scoped>
.home {
    padding: 16px;
}
h1 {
    font-size: 24px;
}
hr {
    display: block;
    margin: 20px 0;
}
ul {
    font-size: 16px;
    line-height: 2;
    a {
        color: #000;
        text-decoration: none;
        &:hover {
            opacity: 0.8;
            text-decoration: underline;
        }
    }
}
</style>
