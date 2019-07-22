import { factory } from '@cinerino/api-nodejs-client';

export const PORT_LOCAL_SERVER = 3082;
export const LOCAL_API_URL = `https://localhost:${PORT_LOCAL_SERVER}`;

export const PORT_LOCAL_FRONT = 3029;
export const LOCAL_FRONT_URL = `https://localhost:${PORT_LOCAL_FRONT}`;

export const PATH_DIST_JSON = './dist/jsondata';

export const PATH_API = '/api';

export const PATH_JSON = '/json';

export const PATH_SOCKET = '/socket.io';

export type OmitType<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type ValueOf<T> = T[keyof T];

export enum ENUM_CONFIG_STATUS_THRESHOLD_TYPE {
    PERCENTAGE = 'PERCENTAGE',
    NUMBER = 'NUMBER',
}

// サーバに環境変数で設定、API経由で取得してstore.state.configにセットして利用
export interface IAppConfig {
    CONFIG_FORCEDATE: string; // 将来の日付のチケットを表示するためのYYYY-MM-DD (リリース後に削除予定)
    CONFIG_GUIDE_MARGIN_MINUTES: string; // マイベビースターのガイドを時間割に対して何分余裕を持って入れ替えるか
    CONFIG_STATUS_DEADLINE_BEFORESTARTMINUTES: string; // チケット状況を開始何分前から消すか 数値だが環境変数なのでstring
    CONFIG_STATUS_THRESHOLD_TYPE: ENUM_CONFIG_STATUS_THRESHOLD_TYPE; // チケット状況を〇から△にする閾値
    CONFIG_STATUS_THRESHOLD_VALUE_CROWDED: string; // チケット状況を〇から△にする閾値  数値だが環境変数なのでstring
    CONFIG_MESSAGE_GUIDE_NONEXT: string; // 案内中表示画面で次の枠が無かった時のメッセージテキスト
    CONFIG_MESSAGE_TIMETABLE_ALL_ENDED: string; // チケットのその日のスケジュールが全て終わった時に出すメッセージテキスト
}

export interface IProcessEnv extends IAppConfig {
    NODE_ENV: 'development' | 'production';
    MPIP: string; // MPの固定IP
    CINERINO_API_ENDPOINT: string;
    CINERINO_AUTHORIZE_SERVER_DOMAIN: string;
    CINERINO_CLIENT_ID: string;
    CINERINO_CLIENT_SECRET: string;
    CINERINO_EVENT_IDENTIFIER_FACTORYTOUR: string;
    CINERINO_EVENT_IDENTIFIER_MYBABYSTAR: string;
    AUTH_JWT_SECRET: string;
    AUTH_USER_STB_ID: string; // STB用認証ID
    AUTH_USER_STB_PASSWORD: string; // STB用認証パスワード
    AUTH_USER_ADMIN_ID: string; // 管理用ID
    AUTH_USER_ADMIN_PASSWORD: string; // 管理用パスワード
}

export interface IUser {
    loginId: string;
    isAdmin: boolean;
}

export enum ENUM_TIKECT_STATUS {
    CAPABLE = 'circle',
    CROWDED = 'triangle',
    SOLDOUT = 'cross',
}

export enum ENUM_USER_LEVEL {
    STB = 'STB',
    ADMIN = 'ADMIN',
}

export enum ENUM_LOCAL_EVENT_IDS {
    FURIFURI = 'FURIFURI',
    CRUNCH = 'CRUNCH',
    ATHLETIC = 'ATHLETIC',
}

export enum ENUM_TICKET_EVENT_IDS {
    MYBABYSTAR = 'MYBABYSTAR',
    FACTORYTOUR = 'FACTORYTOUR',
}

export type EventID_TICKET = keyof typeof ENUM_TICKET_EVENT_IDS;

export type EventID = ENUM_LOCAL_EVENT_IDS | ENUM_TICKET_EVENT_IDS;

export const ENUM_EVENT_IDS = {
    ...ENUM_TICKET_EVENT_IDS,
    ...ENUM_LOCAL_EVENT_IDS,
};

export const EVENT_NAME_DIC = {
    [ENUM_EVENT_IDS.CRUNCH]: 'ベビースターチョコクランチ作り体験',
    [ENUM_EVENT_IDS.FURIFURI]: 'フリフリベビースター体験',
    [ENUM_EVENT_IDS.ATHLETIC]: '超ドデカイアスレチック',
    ALL: '全て',
};

export enum ENUM_LOCAL_EVENT_STATUS_TYPE {
    MESSAGE = 'MESSAGE',
    TIME = 'TIME',
}

export enum ENUM_SOCKETIO_EVENT_NAMES {
    SUBSCRIBE = 'subscribe',
    SUBSCRIBE_GRANTED = 'subscribeGranted',
    ALREADY_GRANTED = 'alreadyGranted',
    CONNECTION_REJECTED = 'connenctionRejected',
    DATA_UPDATED = 'dataUpdated',
    RELOAD_REQUIRED = 'reloadRequired',
    CONNECT = 'connect',
    CONNECTION = 'connection',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
}

export type SubscribableID = EventID | 'none';
export interface ISocketSubscribeRequst {
    dataTargetArray: SubscribableID[];
    jwt: string;
}

export interface ISearchEventRequest {
    startFrom: Date;
    startThrough: Date;
    locationBranchCode: string;
    requiredEventIdentifierKeyArray: ENUM_TICKET_EVENT_IDS[];
}

export enum ENUM_EVENT_STATUSSTRING_ID {
    INPREPARATION = 'INPREPARATION',
    CLOSE = 'CLOSE',
    END = 'END',
    FURI_CRUNCH_ENGAWAROOMDEKAISAICHU = 'FURI_CRUNCH_ENGAWAROOMDEKAISAICHU',
    FURI_CRUNCH_JIKANSHITEIKENHAIFUCHU = 'FURI_CRUNCH_JIKANSHITEIKENHAIFUCHU',
    FURI_CRUNCH_HONJITSUBUNKANBAI = 'FURI_CRUNCH_HONJITSUBUNKANBAI',
    ATHLETIC_1F_ENDED = 'ATHLETIC_1F_ENDED',
    ATHLETIC_23F_ENDED = 'ATHLETIC_23F_ENDED',
}
export type EVENT_STATUSSTRING_ID = keyof typeof ENUM_EVENT_STATUSSTRING_ID;

export const EVENT_ENUM_EVENT_STATUSSTRING_DIC = {
    [ENUM_EVENT_STATUSSTRING_ID.INPREPARATION]: '準備中',
    [ENUM_EVENT_STATUSSTRING_ID.FURI_CRUNCH_ENGAWAROOMDEKAISAICHU]: 'えんがわルーム\nで開催中',
    [ENUM_EVENT_STATUSSTRING_ID.FURI_CRUNCH_JIKANSHITEIKENHAIFUCHU]: '時間指定券\n配布中',
    [ENUM_EVENT_STATUSSTRING_ID.FURI_CRUNCH_HONJITSUBUNKANBAI]: '本日分、完売',
    [ENUM_EVENT_STATUSSTRING_ID.ATHLETIC_1F_ENDED]: '1階終了',
    [ENUM_EVENT_STATUSSTRING_ID.ATHLETIC_23F_ENDED]: '2階・3階\n終了',
    [ENUM_EVENT_STATUSSTRING_ID.CLOSE]: 'お休み',
    [ENUM_EVENT_STATUSSTRING_ID.END]: '本日終了',
};

export const EVENT_STATUS_HIDE_NOW_ARRAY = [
    ENUM_EVENT_STATUSSTRING_ID.ATHLETIC_1F_ENDED,
    ENUM_EVENT_STATUSSTRING_ID.ATHLETIC_23F_ENDED,
    ENUM_EVENT_STATUSSTRING_ID.END,
    ENUM_EVENT_STATUSSTRING_ID.FURI_CRUNCH_HONJITSUBUNKANBAI,
];

const range = (start: number, stop: number, step: number): number[] => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
export const EVENT_STATUSSTRING_VALUE_ARRAY: Array<number | ENUM_EVENT_STATUSSTRING_ID> = [
    ENUM_EVENT_STATUSSTRING_ID.INPREPARATION,
    ...range(0, 120, 5),
    ENUM_EVENT_STATUSSTRING_ID.FURI_CRUNCH_ENGAWAROOMDEKAISAICHU,
    ENUM_EVENT_STATUSSTRING_ID.FURI_CRUNCH_JIKANSHITEIKENHAIFUCHU,
    ENUM_EVENT_STATUSSTRING_ID.FURI_CRUNCH_HONJITSUBUNKANBAI,
    ENUM_EVENT_STATUSSTRING_ID.CLOSE,
    ENUM_EVENT_STATUSSTRING_ID.ATHLETIC_1F_ENDED,
    ENUM_EVENT_STATUSSTRING_ID.ATHLETIC_23F_ENDED,
    ENUM_EVENT_STATUSSTRING_ID.END,
];

export const EVENT_STATUS_OPTION_ARRAY = EVENT_STATUSSTRING_VALUE_ARRAY.map((value) => {
    return {
        value,
        text: typeof value !== 'number' ? EVENT_ENUM_EVENT_STATUSSTRING_DIC[value] : `${value}分待ち`,
    };
});

export type typeEventStatusString = EVENT_STATUSSTRING_ID | number;

export interface ILocalEventJSON {
    name: ENUM_LOCAL_EVENT_IDS;
    type: ENUM_LOCAL_EVENT_STATUS_TYPE;
    statusString: typeEventStatusString;
    updateAt?: number;
    updateAtString?: string;
}

export interface IStatusDataDic {
    [key: string]: ILocalEventJSON;
}

export type TypeTicketsStatuses = { [key in EventID_TICKET]: IScreeningEvent[] };

export interface IScreeningEvent extends factory.chevre.event.screeningEvent.IEvent {}
