import axios from './axios';
import store from '../store';
import dayjs from 'dayjs';
import { API_LOGGER } from '../misc/api';
import {
    ENUM_LOCAL_EVENT_IDS,
    IStatusDataDic,
    IScreeningEvent,
    ILocalEventJSON,
    ENUM_CONFIG_STATUS_THRESHOLD_TYPE,
    ENUM_TIKECT_STATUS,
    ENUM_LOCAL_EVENT_STATUS_TYPE,
    EVENT_ENUM_EVENT_STATUSSTRING_DIC,
    ENUM_EVENT_STATUSSTRING_ID,
} from '../Constants';

// PHPなどのsleepと同じ
export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// エラーメッセージを現在時刻付きでstoreへ
export const setErrMsg = (msg: string): void => {
    const logmsg = msg ? `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]${msg}` : '';
    if (logmsg) {
        API_LOGGER(logmsg).catch();
    }
    return store.commit('SET_errMsg', logmsg);
};

// Promiseにタイムアウトを付ける
export const promiseTimeoutWrapper = (ms: number, promise: Promise<any>) => {
    return Promise.race([
        new Promise((resolve, reject) =>
            setTimeout(() => {
                return reject(new Error(`Timeout Error (${ms}ms)`));
            }, ms),
        ),
        promise,
    ]);
};

// 配列を指定した要素数ずつに分割
export const splitArray = (array: [], chunkSize: number): [[]] => {
    let i = 0;
    const length = array.length;
    const ret: any = [];
    for (i = 0; i < length; i += chunkSize) {
        ret.push(array.slice(i, i + chunkSize));
    }
    return ret;
};

// 現在時刻から次の更新時刻までのsetTimeout用msを得る
export const getNextTickUnixtime = (): number => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0).getTime() - now.getTime();
};

// EVENTIDチェック
export const validateLocalEventName = (name: string): void => {
    if (!name || !(name in ENUM_LOCAL_EVENT_IDS)) {
        throw new Error('invalid name.');
    }
};

// ローカルイベントJSONのステータステキストを得る
export const getStatusStringText = (value: number | string): string => {
    return typeof value === 'number' ? String(value) : EVENT_ENUM_EVENT_STATUSSTRING_DIC[value as ENUM_EVENT_STATUSSTRING_ID];
};

// ローカルイベントJSONからclassNameを作る
export const getStatusClassName = (eventJSON: ILocalEventJSON): string => {
    const text = getStatusStringText(eventJSON.statusString);
    let className = `status status-${eventJSON.name} status-type-${eventJSON.type} status-value-${eventJSON.statusString} status-length-${text.length} `;
    if (text.length > 3) {
        className += 'status-hide-now ';
    }
    if (eventJSON.type === ENUM_LOCAL_EVENT_STATUS_TYPE.MESSAGE) {
        className += 'status-hide-waiting ';
    }
    if (text.indexOf('\n') !== -1) {
        className += 'status-type-multiline ';
    }
    return className;
};

// チケットのステータスから〇△×を決定する
export const judgeStatusOfScreeningEvent = (screeningEvent: IScreeningEvent): ENUM_TIKECT_STATUS => {
    const CONFIG_STATUS_THRESHOLD_TYPE = store.state.config.CONFIG_STATUS_THRESHOLD_TYPE;
    const CONFIG_STATUS_THRESHOLD_VALUE_CROWDED = parseInt(store.state.config.CONFIG_STATUS_THRESHOLD_VALUE_CROWDED, 10);
    if (!CONFIG_STATUS_THRESHOLD_TYPE || !CONFIG_STATUS_THRESHOLD_VALUE_CROWDED) {
        throw new Error('both of env CONFIG_STATUS_THRESHOLD_TYPE & CONFIG_STATUS_THRESHOLD_VALUE_CROWDED required');
    }
    const { remainingAttendeeCapacity, maximumAttendeeCapacity } = screeningEvent;
    if (!remainingAttendeeCapacity || !maximumAttendeeCapacity) {
        return ENUM_TIKECT_STATUS.SOLDOUT;
    }
    // 割合(PERCENTAGE) || 判定か絶対数(NUMBER)で判定
    if (CONFIG_STATUS_THRESHOLD_TYPE === ENUM_CONFIG_STATUS_THRESHOLD_TYPE.PERCENTAGE) {
        const remainPercentage = (remainingAttendeeCapacity / maximumAttendeeCapacity) * 100;
        if (remainPercentage <= CONFIG_STATUS_THRESHOLD_VALUE_CROWDED) {
            return ENUM_TIKECT_STATUS.CROWDED;
        }
    } else if (CONFIG_STATUS_THRESHOLD_TYPE === ENUM_CONFIG_STATUS_THRESHOLD_TYPE.NUMBER) {
        if (remainingAttendeeCapacity <= CONFIG_STATUS_THRESHOLD_VALUE_CROWDED) {
            return ENUM_TIKECT_STATUS.CROWDED;
        }
    } else {
        throw new Error(`invalid CONFIG_STATUS_THRESHOLD_TYPE: ${CONFIG_STATUS_THRESHOLD_TYPE}`);
    }
    return ENUM_TIKECT_STATUS.CAPABLE;
};

// JSONファイル取得インスタンスを立てる
export class LocalJsonFetcher {
    public requiredNameArray: string[];

    constructor(requiredNameArray: ENUM_LOCAL_EVENT_IDS[]) {
        requiredNameArray.forEach((name) => {
            validateLocalEventName(name);
        });
        this.requiredNameArray = requiredNameArray;
    }

    public fetchData(): Promise<IStatusDataDic> {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await Promise.all(
                    this.requiredNameArray.map((name: string) => {
                        validateLocalEventName(name);
                        return axios().get(`/json/${name}.json?${Date.now()}`);
                    }),
                );
                resolve(
                    this.requiredNameArray.reduce((a: any, b: string, index: number) => {
                        if (typeof res[index].data !== 'object') {
                            return a;
                        }
                        a[b] = res[index].data;
                        return a;
                    }, {}),
                );
            } catch (e) {
                setErrMsg(`[LocalJsonFetcher] ${e.message}`);
                console.log(e);
                reject(e);
            }
        });
    }
}
