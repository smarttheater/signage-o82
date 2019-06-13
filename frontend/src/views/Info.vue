<template>
    <div v-if="is_initialized" class="svgcontainer info">
        <timer @tick="fetchData"></timer>
        <h1 v-for="eventName in REQUIRED_JSONID_ARRAY" :key="eventName" :class="`status status-${eventName} status-type-${eventStatus[eventName].type}`">
            <span>{{ eventStatus[eventName].statusString }}</span>
        </h1>

        <div v-for="ticketName in REQUIRED_TICKETID_ARRAY" :key="ticketName" :class="`timetable timetable-${ticketName}`">
            <ul>
                <li v-for="status in ticketStatus[ticketName]" :key="status.id" :class="`ticketstatus-${status.status}`">
                    <span>{{ status.startDate }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import dayjs from 'dayjs';
import { getSocket } from '../misc/socketIo';
import { setErrMsg, LocalJsonFetcher, judgeStatusOfScreeningEvent } from '../misc/util';
import { API_FETCH_TICKET_STATUS } from '../misc/api';
import { ENUM_LOCAL_EVENT_IDS, ENUM_TICKET_EVENT_IDS, ENUM_SOCKETIO_EVENT_NAMES, IStatusDataDic, IScreeningEvent, TypeTicketsStatuses } from '../Constants';

const REQUIRED_JSONID_ARRAY = [ENUM_LOCAL_EVENT_IDS.CRUNCH, ENUM_LOCAL_EVENT_IDS.FURIFURI, ENUM_LOCAL_EVENT_IDS.ATHLETIC];
const REQUIRED_TICKETID_ARRAY = [ENUM_TICKET_EVENT_IDS.FACTORYTOUR, ENUM_TICKET_EVENT_IDS.MYBABYSTAR];

export default Vue.extend({
    name: 'Info',
    data() {
        return {
            socket: null as null | SocketIOClient.Socket,
            is_initialized: false,
            busy_fetchData: false,
            ticketStatus: {} as TypeTicketsStatuses,
            eventStatus: {} as IStatusDataDic,
            ENUM_TICKET_EVENT_IDS,
            REQUIRED_JSONID_ARRAY,
            REQUIRED_TICKETID_ARRAY,
        };
    },
    async created() {
        try {
            this.eventStatus = await new LocalJsonFetcher(REQUIRED_JSONID_ARRAY).fetchData();
            const socket = await getSocket({
                dataTargetArray: REQUIRED_JSONID_ARRAY,
                jwt: this.$store.state.token,
            });
            socket.on(ENUM_SOCKETIO_EVENT_NAMES.DATA_UPDATED, (updatedData: IStatusDataDic) => {
                this.eventStatus = { ...this.eventStatus, ...updatedData };
            });
            this.socket = socket;
        } catch (e) {
            return alert(e.message);
        }
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
        getManipuldatedTicketStatusArray(eventArray: IScreeningEvent[]): any {
            try {
                if (!eventArray) {
                    return [];
                }
                const dayjs_now = this.getDayJsObject();
                const unFinishedEventArray = eventArray.filter((event) => {
                    if (!event.offers || dayjs().isAfter(dayjs(event.offers.availabilityStarts))) {
                        return false;
                    }
                    return this.getDayJsObject(event.endDate).isBefore(dayjs_now);
                });
                if (unFinishedEventArray.length > 8) {
                    unFinishedEventArray.length = 8;
                }
                return unFinishedEventArray.map((event: IScreeningEvent) => {
                    return {
                        id: event.id,
                        startDate: dayjs(event.startDate).format('HH:mm'),
                        endDate: dayjs(event.endDate).format('HH:mm'),
                        status: judgeStatusOfScreeningEvent(event),
                    };
                });
            } catch (e) {
                setErrMsg(`[getManipuldatedTicketStatusArray] ${e.message}`);
                console.log('[getManipuldatedTicketStatusArray]', e);
                return [];
            }
        },
        fetchData() {
            return new Promise(async (resolve) => {
                if (this.busy_fetchData) {
                    return resolve();
                }
                this.busy_fetchData = true;
                try {
                    const dayjs_now = this.getDayJsObject();
                    const ticketStatus = await API_FETCH_TICKET_STATUS({
                        locationBranchCode: '001',
                        requiredEventIdentifierKeyArray: REQUIRED_TICKETID_ARRAY,
                        startFrom: dayjs_now
                            .set('hour', 0)
                            .set('minute', 0)
                            .toDate(),
                        startThrough: dayjs_now
                            .set('hour', 23)
                            .set('minute', 59)
                            .toDate(),
                    });
                    this.ticketStatus = {
                        [ENUM_TICKET_EVENT_IDS.FACTORYTOUR]: this.getManipuldatedTicketStatusArray(ticketStatus[ENUM_TICKET_EVENT_IDS.FACTORYTOUR]),
                        [ENUM_TICKET_EVENT_IDS.MYBABYSTAR]: this.getManipuldatedTicketStatusArray(ticketStatus[ENUM_TICKET_EVENT_IDS.MYBABYSTAR]),
                    };
                } catch (e) {
                    setErrMsg(`[fetchData] ${e.message}`);
                    console.log(e);
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
    background-image: url('/info.svg');
    .status {
        margin: 0;
        padding: 0;
        position: absolute;
        font-size: 7vw;
        width: 31.9vw;
        right: 0.4vw;
        text-align: center;
    }
    .status-type-TIME {
        &::after {
            content: '分待ち';
            font-size: 4vw;
        }
    }
    .status-CRUNCH {
        color: #864e2b;
        top: 9vw;
    }
    .status-FURIFURI {
        color: #f28b00;
        top: 28vw;
    }
    .status-ATHLETIC {
        color: #69c314;
        top: 47vw;
    }
    .timetable {
        margin: 0;
        padding: 0;
        position: absolute;
        top: 12vw;
        width: 33.6vw;
        text-align: center;
        ul {
            padding: 0;
            margin: 0;
            li {
                list-style: none;
                > span {
                    font-size: 3.5vw;
                    line-height: 1.5;
                    font-weight: bold;
                    &::after {
                        content: '～';
                        font-size: 60%;
                        margin-left: 0.5vw;
                        line-height: 5.5vw;
                        vertical-align: bottom;
                    }
                }
                &::after {
                    display: inline-block;
                    width: 3vw;
                    height: 3vw;
                    margin-left: 1vw;
                    content: '';
                }
                &.ticketstatus-circle {
                    > span {
                        color: #c30d23;
                    }
                    &::after {
                        background-image: url('/icon_status_circle.svg');
                    }
                }
                &.ticketstatus-triangle {
                    > span {
                        color: #f2971b;
                    }
                    &::after {
                        background-image: url('/icon_status_triangle.svg');
                    }
                }
                &.ticketstatus-cross {
                    > span {
                        color: #cfbfb5;
                    }
                    &::after {
                        background-image: url('/icon_status_cross.svg');
                    }
                }
            }
        }
    }
    .timetable-FACTORYTOUR {
        left: 0;
    }
    .timetable-MYBABYSTAR {
        left: 33.6vw;
    }
}
</style>
