<template>
    <div v-if="is_initialized" :class="infoClassName">
        <timer @tick="fetchData"></timer>
        <h1 v-for="eventName in REQUIRED_JSONID_ARRAY" :key="eventName" :class="getStatusClassName(eventStatus[eventName])">
            <span>{{ getStatusStringText(eventStatus[eventName].statusString) }}</span>
        </h1>

        <template v-if="isNoFactory">
            <div class="timetable">
                <template v-if="colsStatusArray.length">
                    <ul v-for="(colsStatus, index) in colsStatusArray" :key="`colsStatus-${index}`" :class="`col-${index + 1}`">
                        <li v-for="status in colsStatus" :key="status.id" :class="`ticketstatus-${status.status}`">
                            <span>{{ status.startDate }}</span>
                        </li>
                    </ul>
                </template>
                <h1 v-else-if="is_allEnded.MYBABYSTAR" class="allEndedMessage" v-html="CONFIG_MESSAGE_TIMETABLE_ALL_ENDED"></h1>
            </div>
        </template>

        <template v-else>
            <div v-for="ticketId in requiredTicketIdArray" :key="ticketId" :class="`timetable timetable-${ticketId}`">
                <template v-if="ticketStatus[ticketId].length">
                    <ul>
                        <li v-for="status in ticketStatus[ticketId]" :key="status.id" :class="`ticketstatus-${status.status}`">
                            <span>{{ status.startDate }}</span>
                        </li>
                    </ul>
                </template>
                <h1 v-else-if="is_allEnded[ticketId]" class="allEndedMessage" v-html="CONFIG_MESSAGE_TIMETABLE_ALL_ENDED"></h1>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import dayjs from 'dayjs';
import { getSocket } from '../misc/socketIo';
import { setErrMsg, LocalJsonFetcher, judgeStatusOfScreeningEvent, getStatusStringText, getStatusClassName, splitArray } from '../misc/util';
import { API_FETCH_TICKET_STATUS } from '../misc/api';
import { ENUM_LOCAL_EVENT_IDS, ENUM_TICKET_EVENT_IDS, ENUM_SOCKETIO_EVENT_NAMES, IStatusDataDic, IScreeningEvent, TypeTicketsStatuses } from '../Constants';

const REQUIRED_JSONID_ARRAY = [ENUM_LOCAL_EVENT_IDS.CRUNCH, ENUM_LOCAL_EVENT_IDS.FURIFURI, ENUM_LOCAL_EVENT_IDS.ATHLETIC];

type BoolsByTicketEventId = {
    [key in ENUM_TICKET_EVENT_IDS]?: boolean;
};
export default Vue.extend({
    name: 'Info',
    props: {
        isNoFactory: {
            type: Boolean,
            required: false,
            default: false,
        },
        requiredTicketIdArray: {
            type: Array as PropType<ENUM_TICKET_EVENT_IDS[]>,
            required: true,
        },
    },
    data() {
        return {
            socket: null as null | SocketIOClient.Socket,
            is_initialized: false,
            is_allEnded: {} as BoolsByTicketEventId,
            busy_fetchData: false,
            ticketStatus: {} as TypeTicketsStatuses,
            colsStatusArray: [[]] as Array<IScreeningEvent[]>,
            eventStatus: {} as IStatusDataDic,
            ENUM_TICKET_EVENT_IDS,
            REQUIRED_JSONID_ARRAY,
        };
    },
    computed: {
        isVertical(): boolean {
            return this.$route.meta.vertical;
        },
        infoClassName(): string {
            const orientation = this.isVertical ? '-vertical' : '-horizontal';
            let className = 'svgcontainer infobase ';
            className += this.isNoFactory ? 'info-nofactory' : 'info';
            className += orientation;
            return className;
        },
        CONFIG_MESSAGE_TIMETABLE_ALL_ENDED(): string {
            return this.$store.state.config.CONFIG_MESSAGE_TIMETABLE_ALL_ENDED;
        },
    },
    async created() {
        try {
            if (!this.requiredTicketIdArray || !this.requiredTicketIdArray.length) {
                return alert('[FATAL] prop requiredTicketIdArray is invalid.');
            }
            this.eventStatus = await new LocalJsonFetcher(REQUIRED_JSONID_ARRAY).fetchData();
            const socket = await getSocket({
                dataTargetArray: REQUIRED_JSONID_ARRAY,
                jwt: this.$store.state.token,
            });
            socket.on(ENUM_SOCKETIO_EVENT_NAMES.DATA_UPDATED, (updatedData: IStatusDataDic) => {
                this.eventStatus = { ...this.eventStatus, ...updatedData };
            });
            socket.on(ENUM_SOCKETIO_EVENT_NAMES.DISCONNECTED, () => {
                this.socket = null;
            });
            this.socket = socket;
        } catch (e) {
            return alert(e.message);
        }
        await this.fetchData();
        this.is_initialized = true;
    },
    methods: {
        getStatusStringText,
        getStatusClassName,
        getDayJsObject(): dayjs.Dayjs {
            const CONFIG_FORCEDATE = (this.$route.query.yyyymmdd as string) || this.$store.state.config.CONFIG_FORCEDATE;
            let dayjs_now = dayjs();
            if (CONFIG_FORCEDATE && dayjs_now.isBefore(dayjs(CONFIG_FORCEDATE))) {
                dayjs_now = dayjs(`${CONFIG_FORCEDATE} ${dayjs_now.format('HH:mm:ss')}`);
            }
            return dayjs_now;
        },
        getManipuldatedTicketStatusArray(eventArray: IScreeningEvent[]): any {
            try {
                if (!eventArray) {
                    return [];
                }
                const dayjs_now = this.getDayJsObject();
                const CONFIG_STATUS_DEADLINE_BEFORESTARTMINUTES = parseInt(this.$store.state.config.CONFIG_STATUS_DEADLINE_BEFORESTARTMINUTES, 10);
                const unFinishedEventArray = eventArray.filter((event) => {
                    if (!event.offers || dayjs_now.isAfter(dayjs(event.offers.availabilityStarts))) {
                        return false;
                    }
                    return dayjs(dayjs_now).isBefore(dayjs(event.startDate).subtract(CONFIG_STATUS_DEADLINE_BEFORESTARTMINUTES, 'minute'));
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
                        requiredEventIdentifierKeyArray: this.requiredTicketIdArray,
                        startFrom: dayjs_now
                            .set('hour', 0)
                            .set('minute', 0)
                            .toDate(),
                        startThrough: dayjs_now
                            .set('hour', 23)
                            .set('minute', 59)
                            .toDate(),
                    });
                    const todayScheduleWasFound = Object.keys(ENUM_TICKET_EVENT_IDS).reduce(
                        (ret, id: string) => {
                            const status = ticketStatus[id as ENUM_TICKET_EVENT_IDS];
                            ret[id as ENUM_TICKET_EVENT_IDS] = status && status.length > 0;
                            return ret;
                        },
                        {} as BoolsByTicketEventId,
                    );
                    if (this.isNoFactory) {
                        const statusArray = this.getManipuldatedTicketStatusArray(ticketStatus[ENUM_TICKET_EVENT_IDS.MYBABYSTAR]);
                        this.is_allEnded[ENUM_TICKET_EVENT_IDS.MYBABYSTAR] = todayScheduleWasFound[ENUM_TICKET_EVENT_IDS.MYBABYSTAR] && !statusArray.length;
                        const colNum = this.isVertical ? 4 : 3;
                        this.colsStatusArray = splitArray(statusArray, colNum);
                    } else {
                        this.ticketStatus = this.requiredTicketIdArray.reduce(
                            (ret, id: ENUM_TICKET_EVENT_IDS) => {
                                const statusArray = this.getManipuldatedTicketStatusArray(ticketStatus[id]);
                                this.is_allEnded[id] = todayScheduleWasFound[id] && !statusArray.length;
                                ret[id] = statusArray;
                                return ret;
                            },
                            {} as TypeTicketsStatuses,
                        );
                    }
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
.infobase {
    .status {
        margin: 0;
        padding: 0;
        white-space: pre;
        position: absolute;
        text-align: center;
        &.status-type-multiline {
            line-height: 1.4;
        }
    }
    .status-type-TIME {
        &::after {
            content: '分待ち';
        }
    }
    .status-CRUNCH {
        color: #864e2b;
    }
    .status-FURIFURI {
        color: #f28b00;
    }
    .status-ATHLETIC {
        color: #69c314;
    }
    .timetable {
        margin: 0;
        padding: 0;
        text-align: center;
        ul {
            padding: 0;
            margin: 0;
            li {
                list-style: none;
                > span {
                    font-weight: bold;
                    color: #6d3a0a;
                    &::after {
                        content: '～';
                        vertical-align: bottom;
                    }
                }
                &::after {
                    display: inline-block;
                    content: '';
                }
                &.ticketstatus-circle {
                    &::after {
                        background-image: url('/icon_status_circle.svg');
                    }
                }
                &.ticketstatus-triangle {
                    &::after {
                        background-image: url('/icon_status_triangle.svg');
                    }
                }
                &.ticketstatus-cross {
                    &::after {
                        background-image: url('/icon_status_cross.svg');
                    }
                }
            }
        }
    }
}
.info-horizontal {
    background-image: url('/info.svg');
    .status {
        font-size: 7vw;
        width: 31.9vw;
        right: 0.4vw;
        &.status-value-ENGAWAROOMDEKAISAICHU {
            margin-top: -2vw;
            font-size: 4vw;
        }
    }
    .status-type-TIME {
        &::after {
            font-size: 4vw;
        }
    }
    .status-CRUNCH {
        top: 9vw;
    }
    .status-FURIFURI {
        top: 28vw;
    }
    .status-ATHLETIC {
        top: 47vw;
    }
    .timetable {
        position: absolute;
        top: 11vw;
        width: 33.6vw;
        .allEndedMessage {
            position: absolute;
            top: 4vw;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 2vw;
            line-height: 1.75;
            color: #6d3a0a;
        }
        ul {
            li {
                > span {
                    font-size: 4vw;
                    line-height: 1.4;
                    &::after {
                        font-size: 60%;
                        margin-left: 0.5vw;
                        line-height: 5.5vw;
                    }
                }
                &::after {
                    width: 3.5vw;
                    height: 3.5vw;
                    margin-left: 1vw;
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
.info-vertical {
    background-image: url('/info_v.svg');
    .status {
        font-size: 7vw;
        width: 27.6vw;
        right: 0.4vw;
        &.status-length-4 {
            font-size: 6vw;
            margin-top: 1vw;
        }
        &.status-value-ENGAWAROOMDEKAISAICHU {
            margin-top: -1vw;
            font-size: 3.6vw;
        }
    }
    .status-type-TIME {
        &::after {
            font-size: 4vw;
        }
    }
    .status-CRUNCH {
        top: 65vw;
    }
    .status-FURIFURI {
        top: 78vw;
    }
    .status-ATHLETIC {
        top: 90.5vw;
    }
    .timetable {
        position: absolute;
        top: 11.5vw;
        width: 50vh;
        .allEndedMessage {
            position: absolute;
            top: 4vw;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 2vw;
            line-height: 1.75;
            color: #6d3a0a;
        }
        ul {
            li {
                > span {
                    font-size: 4vw;
                    line-height: 1.6;
                    &::after {
                        font-size: 60%;
                        margin-left: 0.5vw;
                        line-height: 6.5vw;
                    }
                }
                &::after {
                    width: 3.5vw;
                    height: 3.5vw;
                    margin-left: 1vw;
                }
            }
        }
    }
    .timetable-FACTORYTOUR {
        left: 0;
    }
    .timetable-MYBABYSTAR {
        right: 0;
    }
}
.info-nofactory-horizontal {
    background-image: url('/info_nofactory.svg');
    .status {
        top: 47vw;
        font-size: 7vw;
        width: 31.9vw;
        &.status-value-ENGAWAROOMDEKAISAICHU {
            margin-top: -2.4vw;
            font-size: 4vw;
        }
    }
    .status-type-TIME {
        &::after {
            font-size: 4vw;
        }
    }
    .status-CRUNCH {
        left: 0.4vw;
    }
    .status-FURIFURI {
        left: 50%;
        margin-left: -15.95vw;
    }
    .status-ATHLETIC {
        right: 0.4vw;
    }
    .timetable {
        margin: 0;
        padding: 0;
        position: relative;
        .allEndedMessage {
            position: absolute;
            top: 16vw;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 4vw;
            line-height: 1.75;
            color: #6d3a0a;
        }
        ul {
            position: absolute;
            text-align: center;
            top: 13vw;
            width: 33.6vw;
            &.col-1 {
                left: 4vw;
            }
            &.col-2 {
                left: 50%;
                margin-left: -16.8vw;
            }
            &.col-3 {
                right: 4vw;
            }
            li {
                list-style: none;
                > span {
                    font-size: 4.5vw;
                    line-height: 1.75;
                    &::after {
                        margin-left: 1vw;
                        line-height: 6.5vw;
                    }
                }
                &::after {
                    width: 4vw;
                    height: 4vw;
                    margin-left: 1vw;
                }
            }
        }
    }
}
.info-nofactory-vertical {
    background-image: url('/info_v_nofactory.svg');
    .status {
        font-size: 7vw;
        width: 27.6vw;
        right: 0.4vw;
        &.status-length-4 {
            font-size: 6vw;
            margin-top: 1vw;
        }
        &.status-value-ENGAWAROOMDEKAISAICHU {
            margin-top: -1vw;
            font-size: 3.6vw;
        }
    }
    .status-type-TIME {
        &::after {
            font-size: 4vw;
        }
    }
    .status-CRUNCH {
        top: 56vw;
    }
    .status-FURIFURI {
        top: 72.5vw;
    }
    .status-ATHLETIC {
        top: 88.5vw;
    }
    .timetable {
        width: 100vh;
        height: 100vw;
        margin: 0;
        padding: 0;
        position: relative;
        .allEndedMessage {
            position: absolute;
            top: 16vw;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 4vw;
            line-height: 1.75;
            color: #6d3a0a;
        }
        ul {
            position: absolute;
            text-align: center;
            top: 19vw;
            width: 50%;
            &.col-1 {
                left: 0.4vw;
            }
            &.col-2 {
                right: 0.4vw;
            }
            li {
                list-style: none;
                > span {
                    font-size: 4.5vw;
                    line-height: 1.5;
                    &::after {
                        margin-left: 0.5vw;
                        line-height: 6.5vw;
                    }
                }
                &::after {
                    width: 4vw;
                    height: 4vw;
                    margin-left: 1vw;
                }
            }
        }
    }
    .timetable-FACTORYTOUR {
        left: 0;
    }
    .timetable-MYBABYSTAR {
        right: 0;
    }
}
</style>
