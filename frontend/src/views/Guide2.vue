<template>
    <div v-if="is_initialized" class="svgcontainer guide2">
        <timer v-if="!socket" @tick="fetchJsonData"></timer>
        <h1 v-for="eventName in REQUIRED_JSONID_ARRAY" :key="eventName" :class="`status status-${eventName} status-type-${statusDataDic[eventName].type}`">
            <span>{{ statusDataDic[eventName].statusString }}</span>
        </h1>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getSocket } from '../misc/socketIo';
import { LocalJsonFetcher, setErrMsg } from '../misc/util';
import { ENUM_LOCAL_EVENT_IDS, ENUM_SOCKETIO_EVENT_NAMES, IStatusDataDic } from '../Constants';

const REQUIRED_JSONID_ARRAY = [ENUM_LOCAL_EVENT_IDS.FURIFURI, ENUM_LOCAL_EVENT_IDS.CRUNCH];

export default Vue.extend({
    name: 'Guide2',
    data() {
        return {
            is_initialized: false,
            busy_fetchJsonData: false,
            jsonFetcher: new LocalJsonFetcher(REQUIRED_JSONID_ARRAY),
            socket: null as null | SocketIOClient.Socket, // これがnullなら1分おきのタイマーがfetchJsonDataを叩く
            REQUIRED_JSONID_ARRAY,
            statusDataDic: {} as IStatusDataDic,
        };
    },
    async created() {
        try {
            this.statusDataDic = await this.jsonFetcher.fetchData();
        } catch (e) {
            // JSONが取れないのは論外なので即死
            return alert(e.message);
        }
        // ソケット通信で更新を試みる(無理ならjsonFetcherが働く)
        this.socket = await this.connectSocket();
        this.is_initialized = true;
    },
    methods: {
        // 更新受信用のソケットを確立
        connectSocket(): Promise<SocketIOClient.Socket | null> {
            return new Promise(async (resolve) => {
                try {
                    const socket = await getSocket({
                        dataTargetArray: this.REQUIRED_JSONID_ARRAY,
                        jwt: this.$store.state.token,
                    });
                    socket.on(ENUM_SOCKETIO_EVENT_NAMES.DATA_UPDATED, (updatedData: IStatusDataDic) => {
                        this.statusDataDic = { ...this.statusDataDic, ...updatedData };
                    });
                    socket.on(ENUM_SOCKETIO_EVENT_NAMES.DISCONNECTED, () => {
                        this.socket = null;
                    });
                    resolve(socket);
                } catch (e) {
                    resolve(null);
                }
            });
        },
        // ソケットが確立できなかった時だけ動く定期取得用関数
        fetchJsonData() {
            return new Promise(async (resolve) => {
                if (this.busy_fetchJsonData) {
                    return resolve();
                }
                setErrMsg('');
                this.busy_fetchJsonData = true;
                try {
                    this.statusDataDic = await this.jsonFetcher.fetchData();
                    this.connectSocket().catch(); // ソケット通信の確立を再試行させる
                } catch (e) {
                    console.log(e);
                    setErrMsg(`[fetchJsonData] ${e.message}`);
                }
                this.busy_fetchJsonData = false;
                return resolve();
            });
        },
    },
});
</script>

<style lang="scss" scoped>
.guide2 {
    background-image: url('/guide2.svg');
    .status {
        width: 50vw;
        text-align: center;
        margin: 0;
        padding: 0;
        position: absolute;
    }
}
.status-CRUNCH {
    color: #864e2b;
    left: 0;
}
.status-FURIFURI {
    color: #f28b00;
    right: 0;
}
.status-type-MESSAGE {
    top: 32vw;
    > span {
        font-size: 13vw;
    }
}
.status-type-TIME {
    top: 29vw;
    > span {
        font-size: 18vw;
        &::after {
            font-size: 12vw;
            content: '分';
        }
    }
}
</style>
