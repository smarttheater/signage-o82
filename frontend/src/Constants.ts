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
    CONFIG_STATUS_THRESHOLD_TYPE: ENUM_CONFIG_STATUS_THRESHOLD_TYPE; // チケット状況を〇から△にする閾値
    CONFIG_STATUS_THRESHOLD_VALUE_CROWDED: string; // チケット状況を〇から△にする閾値  数値だが環境変数なのでstring
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
    CONNECTION_REJECTED = 'connenctionRejected',
    DATA_UPDATED = 'dataUpdated',
    CONNECT = 'connect',
    CONNECTION = 'connection',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
}

export interface ISocketSubscribeRequst {
    dataTargetArray: EventID[];
    jwt: string;
}

export interface ISearchEventRequest {
    startFrom: Date;
    startThrough: Date;
    locationBranchCode: string;
    requiredEventIdentifierKeyArray: ENUM_TICKET_EVENT_IDS[];
}

export enum ENUM_EVENT_STATUSSTRING {
    INPREPARATION = '準備中',
    CLOSE = 'お休み',
    END = '本日終了',
}

const range = (start: number, stop: number, step: number): number[] => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
export const EVENT_STATUSSTRING_VALUE_ARRAY = [ENUM_EVENT_STATUSSTRING.INPREPARATION, ...range(0, 120, 5), ENUM_EVENT_STATUSSTRING.CLOSE, ENUM_EVENT_STATUSSTRING.END];

export type typeEventStatusString = ENUM_EVENT_STATUSSTRING.INPREPARATION | ENUM_EVENT_STATUSSTRING.CLOSE | number;

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
