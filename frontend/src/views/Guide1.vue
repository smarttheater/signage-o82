<template>
    <div v-if="is_initialized" class="svgcontainer info">
        <timer @tick="fetchData"></timer>
        <h1 :class="`status status-body status-type-${statusMode} ${is_allEventEndend ? 'status-allended' : ''}`">
            <template v-if="!is_allEventEndend">
                {{ statusTextData.body }}
                <span v-if="statusTextData.noEvent && statusTextData.nextDoorTime" class="nextTime">(次は {{ statusTextData.nextDoorTime }}～ です)</span>
            </template>
            <span v-else>{{ MESSAGE_TIMETABLE_ALL_ENDED }}</span>
        </h1>
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
    nextDoorTime: string;
}
export default Vue.extend({
    name: 'Guide1',
    data() {
        return {
            is_initialized: false,
            is_allEventEndend: false,
            busy_fetchData: false,
            statusTextData: {} as IStatusTextData,
        };
    },
    computed: {
        statusMode(): 'MESSAGE' | 'TIME' {
            return this.statusTextData.noEvent ? 'MESSAGE' : 'TIME';
        },
        MESSAGE_TIMETABLE_ALL_ENDED(): string {
            return this.$store.state.config.CONFIG_MESSAGE_TIMETABLE_ALL_ENDED.replace('\\n', '\n');
        },
        CONFIG_GUIDE_MARGIN_MINUTES(): number {
            return parseInt(this.$store.state.config.CONFIG_GUIDE_MARGIN_MINUTES || 10, 10);
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
        async fetchData(): Promise<void> {
            if (this.busy_fetchData) {
                return;
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
                eventArray.sort((a: IScreeningEvent, b: IScreeningEvent) => {
                    if (!b.doorTime || (a.doorTime && a.doorTime < b.doorTime)) {
                        return -1;
                    }
                    if (!a.doorTime || (b.doorTime && a.doorTime > b.doorTime)) {
                        return 1;
                    }
                    return 0;
                });
                let currentEvent: IScreeningEvent | undefined;
                let nextEvent: IScreeningEvent | undefined;
                if (eventArray && Array.isArray(eventArray) && eventArray.length) {
                    currentEvent = eventArray.find((event) => {
                        const dayjs_doorTime = dayjs(event.doorTime).subtract(this.CONFIG_GUIDE_MARGIN_MINUTES, 'minute');
                        const dayjs_endDate = dayjs(event.endDate).subtract(this.CONFIG_GUIDE_MARGIN_MINUTES, 'minute');
                        return dayjs_now.isAfter(dayjs_doorTime) && dayjs_now.isBefore(dayjs_endDate);
                    });
                    nextEvent = !currentEvent
                        ? eventArray.find((event) => {
                              return dayjs_now.isBefore(dayjs(event.doorTime));
                          })
                        : undefined;
                }
                this.is_allEventEndend = !currentEvent && !nextEvent;
                const currentDoorTime = currentEvent ? dayjs(currentEvent.doorTime).format('HH:mm') : '';
                const nextDoorTime = nextEvent ? dayjs(nextEvent.doorTime).format('HH:mm') : '';
                this.statusTextData = {
                    body: currentDoorTime || this.$store.state.config.CONFIG_MESSAGE_GUIDE_NONEXT,
                    noEvent: !currentEvent,
                    nextDoorTime,
                };
            } catch (e) {
                console.log(e);
                setErrMsg(`[Guide1][fetchData] ${e.message}`);
            }
            this.busy_fetchData = false;
            return;
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
    .nextTime {
        font-size: 5.25vw;
        display: block;
        margin-top: 1vw;
    }
    &.status-type-TIME {
        top: 24vw;
        font-size: 20vw;
        &::after {
            content: '～';
            font-size: 12vw;
            margin-left: 1vw;
        }
    }
    &.status-allended {
        font-size: 8vw;
        line-height: 1.5;
        margin-top: -6vw;
        white-space: pre;
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
