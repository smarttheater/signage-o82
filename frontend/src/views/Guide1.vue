<template>
    <div v-if="is_initialized" class="svgcontainer info">
        <timer @tick="fetchData"></timer>
        <h1 :class="`status status-body status-type-${statusMode}`">{{ statusTextData.body }}</h1>
        <div v-if="statusMode === 'MESSAGE'" class="cover"></div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import dayjs from 'dayjs';
import { ENUM_TICKET_EVENT_IDS, IScreeningEvent } from '../Constants';
import { API_FETCH_TICKET_STATUS } from '../misc/api';
import { getSocket } from '../misc/socketIo';
import { setErrMsg } from '../misc/util';

interface IStatusTextData {
    body: string;
    noEvent: boolean;
}
export default Vue.extend({
    name: 'Guide1',
    data() {
        return {
            is_initialized: false,
            busy_fetchData: false,
            statusTextData: {} as IStatusTextData,
        };
    },
    computed: {
        statusMode(): 'MESSAGE' | 'TIME' {
            return this.statusTextData.noEvent ? 'MESSAGE' : 'TIME';
        },
    },
    async created() {
        await this.fetchData();
        this.is_initialized = true;
        try {
            await getSocket({
                dataTargetArray: ['none'],
                jwt: this.$store.state.token,
            });
        } catch (e) {
            console.log(e);
        }
    },
    methods: {
        getDayJsObject(): dayjs.Dayjs {
            const CONFIG_FORCEDATE = (this.$route.query.yyyymmdd as string) || this.$store.state.config.CONFIG_FORCEDATE;
            let dayjs_now = dayjs();
            if (CONFIG_FORCEDATE && dayjs_now.isBefore(dayjs(CONFIG_FORCEDATE))) {
                dayjs_now = dayjs(`${CONFIG_FORCEDATE} ${dayjs_now.format('HH:mm:ss')}`);
            }
            return dayjs_now;
        },
        fetchData() {
            return new Promise(async (resolve) => {
                if (this.busy_fetchData) {
                    return resolve();
                }
                setErrMsg('');
                this.busy_fetchData = true;
                try {
                    const dayjs_now = this.getDayJsObject();
                    const eventArray = (await API_FETCH_TICKET_STATUS({
                        locationBranchCode: '001',
                        requiredEventIdentifierKeyArray: [ENUM_TICKET_EVENT_IDS.MYBABYSTAR],
                        startFrom: dayjs_now.subtract(12, 'hour').toDate(),
                        startThrough: dayjs_now.add(12, 'hour').toDate(),
                    })).MYBABYSTAR;
                    let currentEvent: IScreeningEvent | undefined;
                    if (eventArray && eventArray.length) {
                        currentEvent = eventArray.find((event) => {
                            const dayjs_doorTime = dayjs(event.doorTime).subtract(10, 'minute');
                            const dayjs_endDate = dayjs(event.endDate).subtract(10, 'minute');
                            return dayjs_now.isAfter(dayjs_doorTime) && dayjs_now.isBefore(dayjs_endDate);
                        });
                    }
                    const currentDoorTime = currentEvent ? dayjs(currentEvent.doorTime).format('HH:mm') : '';
                    this.statusTextData = {
                        body: currentDoorTime || this.$store.state.config.CONFIG_MESSAGE_GUIDE_NONEXT,
                        noEvent: !currentEvent,
                    };
                } catch (e) {
                    console.log(e);
                    setErrMsg(`[fetchData] ${e.message}`);
                }
                this.busy_fetchData = false;
                return resolve();
            });
        },
    },
});
</script>

<style lang="scss" scoped>
.info {
    background-image: url('/guide1.svg');
}
.status {
    position: absolute;
    width: 100%;
    text-align: center;
    left: 0;
    color: #c30d23;
}
.status-body {
    top: 28vw;
    font-size: 10.5vw;
    &.status-type-TIME {
        top: 24vw;
        font-size: 20vw;
        &::after {
            content: '～';
            font-size: 12vw;
            margin-left: 1vw;
        }
    }
}
.status-footer {
    top: 48vw;
    font-size: 3.6vw;
}
.cover {
    position: absolute;
    top: 48vw;
    margin-left: -15vw;
    left: 50%;
    width: 30vw;
    height: 5vw;
    background-color: #faecee;
}
</style>
