<template>
    <div v-if="is_initialized" class="svgcontainer info">
        <timer @tick="fetchData"></timer>
        <h1 :class="`status status-body status-${statusTextData.noEvent ? 'text' : 'time'}`">{{ statusTextData.body }}</h1>
        <h2 class="status status-footer">{{ statusTextData.footer }}</h2>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import dayjs from 'dayjs';
import { ENUM_TICKET_EVENT_IDS, IScreeningEvent } from '../Constants';
import { API_FETCH_TICKET_STATUS } from '../misc/api';
import { setErrMsg } from '../misc/util';

interface IStatusTextData {
    body: string;
    footer: string;
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
    async created() {
        await this.fetchData();
        this.is_initialized = true;
    },
    methods: {
        getDayJsObject(ymd?: Date): dayjs.Dayjs {
            let dayjs_now = dayjs(ymd);
            if (dayjs_now.isBefore(dayjs('2019-07-20'))) {
                dayjs_now = dayjs(`2019-07-20 ${dayjs_now.format('HH:mm:ss')}`);
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
                        startFrom: dayjs_now.subtract(3, 'hour').toDate(),
                        startThrough: dayjs_now.add(3, 'hour').toDate(),
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
                        body: currentDoorTime || '準備中です',
                        footer: currentDoorTime ? 'の方をご案内中です' : '',
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
    font-size: 17vw;
    &.status-time::after {
        content: '～';
        font-size: 12vw;
        margin-left: 1vw;
    }
}
.status-footer {
    top: 48vw;
    font-size: 3.6vw;
}
</style>
