<template>
    <div v-if="is_initialized">
        <div v-for="json in eventStatuses" :key="json.name" :class="`control control-${json.name}`">
            <h1>{{ EVENT_NAME_DIC[json.name] }}</h1>
            <h2>最終更新: {{ json.updateAtString }}</h2>
            <div class="inner">
                <div>
                    <select v-model="json.statusString">
                        <option v-for="option in statusOptionsArray" :key="option.value" :value="option.value"> {{ option.text }} </option>
                    </select>
                    <p class="btn btn-submit" @click="submitStatus(json.name)"><span>更新</span></p>
                </div>
                <p v-if="results[json.name]" class="result">{{ results[json.name] }}</p>
            </div>
        </div>
        <div v-if="ALLMODE" class="control control-ALL">
            <h1>一括操作</h1>
            <div class="inner">
                <select v-model="allValue">
                    <option v-for="option in statusOptionsArray" :key="option.value" :value="option.value"> {{ option.text }} </option>
                </select>
                <p class="btn btn-submit" @click="allUpdate()"><span>更新</span></p>
            </div>
            <p v-if="results.ALL" class="result">{{ results.ALL }}</p>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import dayjs from 'dayjs';
import { getSocket } from '../misc/socketIo';
import { LocalJsonFetcher, validateLocalEventName } from '../misc/util';
import { API_UPDATE_LOCAL_EVENT_JSON, API_INIT_LOCAL_EVENT_JSON } from '../misc/api';
import {
    ENUM_LOCAL_EVENT_IDS,
    EVENT_NAME_DIC,
    ENUM_SOCKETIO_EVENT_NAMES,
    ENUM_LOCAL_EVENT_STATUS_TYPE,
    typeEventStatusString,
    IStatusDataDic,
    EVENT_STATUSSTRING_VALUE_ARRAY,
    ILocalEventJSON,
} from '../Constants';

export default Vue.extend({
    name: 'UpdateStatus',
    data() {
        return {
            is_initialized: false,
            busy_fetchData: false,
            socket: null as null | SocketIOClient.Socket,
            target: this.$route.params.target as ENUM_LOCAL_EVENT_IDS | 'ALL',
            eventStatuses: {} as IStatusDataDic,
            results: {} as { [key: string]: string },
            allValue: EVENT_STATUSSTRING_VALUE_ARRAY[0] as typeEventStatusString,
            EVENT_NAME_DIC,
        };
    },
    computed: {
        ALLMODE(): boolean {
            return this.target === 'ALL';
        },
        REQUIRED_JSONID_ARRAY(): ENUM_LOCAL_EVENT_IDS[] {
            return this.target === 'ALL' ? [ENUM_LOCAL_EVENT_IDS.CRUNCH, ENUM_LOCAL_EVENT_IDS.FURIFURI, ENUM_LOCAL_EVENT_IDS.ATHLETIC] : [this.target];
        },
        statusOptionsArray() {
            return EVENT_STATUSSTRING_VALUE_ARRAY.map((value) => {
                return {
                    value,
                    text: typeof value !== 'number' ? value : `${value}分待ち`,
                };
            });
        },
    },
    async created() {
        try {
            if (!this.$store.state.user.isAdmin) {
                throw new Error('permission denied.');
            }
            const eventStatuses = await new LocalJsonFetcher(this.REQUIRED_JSONID_ARRAY).fetchData();
            this.REQUIRED_JSONID_ARRAY.forEach(async (jsonId) => {
                if (!eventStatuses[jsonId]) {
                    alert(`${jsonId}の情報が破損しているため再構築します。`);
                    try {
                        eventStatuses[jsonId] = await API_INIT_LOCAL_EVENT_JSON(jsonId);
                    } catch (e) {
                        throw new Error(`${jsonId}の再構築に失敗しました`);
                    }
                }
            });
            this.eventStatuses = eventStatuses;
            const socket = await getSocket({
                dataTargetArray: this.REQUIRED_JSONID_ARRAY,
                jwt: this.$store.state.token,
            });
            socket.on(ENUM_SOCKETIO_EVENT_NAMES.DATA_UPDATED, (updatedData: IStatusDataDic) => {
                this.eventStatuses = { ...this.eventStatuses, ...updatedData };
            });
            this.socket = socket;
            this.is_initialized = true;
        } catch (e) {
            alert(e.message);
            this.$router.replace({ name: 'home' });
        }
    },
    methods: {
        getValueText(value: number | string) {
            if (typeof value === 'number') {
                return `${value}分待ち`;
            }
            return value;
        },
        submitStatus(jsonName: ENUM_LOCAL_EVENT_IDS) {
            return new Promise(async (resolve) => {
                let msg = '';
                try {
                    await API_UPDATE_LOCAL_EVENT_JSON(this.eventStatuses[jsonName]);
                    msg = `更新しました: (${dayjs().format('YYYY/MM/DD HH:mm:ss')})`;
                } catch (e) {
                    msg = `${EVENT_NAME_DIC[jsonName]}の更新に失敗しました: ${e.message}`;
                    alert(msg);
                }
                this.results = { ...this.results, [jsonName]: msg };
                resolve();
            });
        },
        allUpdate() {
            return new Promise(async (resolve) => {
                if (!window.confirm('一括更新を実行しますか？')) {
                    return resolve();
                }
                let msg = '';
                try {
                    await Promise.all(
                        this.REQUIRED_JSONID_ARRAY.map((id) => {
                            this.eventStatuses[id].statusString = this.allValue;
                            return this.submitStatus(id);
                        }),
                    );
                    msg = `一括更新を実行しました: (${dayjs().format('YYYY/MM/DD HH:mm:ss')})`;
                } catch (e) {
                    msg = `一括更新でエラーが発生しました: ${e.message}`;
                    alert(msg);
                }
                this.results = { ...this.results, ALL: msg };
                resolve();
            });
        },
    },
});
</script>

<style lang="scss" scoped>
.control {
    padding: 20px;
    h1,
    h2 {
        color: #fff;
    }
    h1 {
        font-size: 32px;
    }
    h2 {
        margin-top: 8px;
        font-size: 12px;
        font-weight: normal;
    }
    .inner {
        margin-top: 16px;
    }
    select {
        cursor: pointer;
        font-size: 28px;
        padding: 8px;
        margin-right: 1em;
    }
    .btn {
        display: inline-block;
        font-size: 24px;
        line-height: 28px;
        vertical-align: top;
        background-color: #fff;
        color: #000;
        &:hover {
            color: #333;
        }
    }
    .result {
        margin-top: 1em;
        font-size: 14px;
        color: #fff;
    }
    &.control-ALL {
        margin-top: 48px;
        background-color: #000;
        .inner {
            color: #000;
        }
    }
    &.control-CRUNCH {
        background-color: #864e2b;
        .inner {
            color: #864e2b;
        }
    }
    &.control-FURIFURI {
        background-color: #f28b00;
        .inner {
            color: #f28b00;
        }
    }
    &.control-ATHLETIC {
        background-color: #69c314;
        .inner {
            color: #69c314;
        }
    }
}
</style>
