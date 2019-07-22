import { AxiosPromise } from 'axios';
import axios from './axios';
import store from '../store';
import { LOCAL_API_URL, ISearchEventRequest, TypeTicketsStatuses, ILocalEventJSON, ENUM_LOCAL_EVENT_IDS, IAppConfig, IUser } from '../Constants';

const API_ENDPOINT = process.env.NODE_ENV !== 'production' ? `${LOCAL_API_URL}/api` : '/api';

const APIREQ = async (reqName: string, axiosPromise: AxiosPromise): Promise<any> => {
    try {
        const res = await axiosPromise;
        if (!res || !res.data) {
            throw new Error('server response empty');
        }
        return res.data;
    } catch (e) {
        let msg = `[API][${reqName}] ${e.message}`;
        if ((e.status !== 500 || e.status !== 404) && e.response && e.response.data) {
            msg = e.response.data;
        }
        throw new Error(msg);
    }
};

// クライアント用ロガー (失敗してもresolve)
export const API_LOGGER = async (message: string): Promise<{ success: boolean }> => {
    let success = false;
    try {
        await axios().post(`${API_ENDPOINT}/util/logger`, { message: `[${store.state.user.loginId}]${message}` });
        success = true;
    } catch (e) {
        console.log('[API_LOGGER]', e);
    }
    return { success };
};

// 環境変数のCONIG値取得
export const API_FETCH_CONFIG = (): Promise<IAppConfig> => {
    return APIREQ('FETCH_CONFIG', axios().post(`${API_ENDPOINT}/util/getEnvConfig`));
};

// socketで強制リロード命令
export const API_FORCE_RELOAD = (): Promise<IAppConfig> => {
    return APIREQ('FORCE_RELOAD', axios().post(`${API_ENDPOINT}/util/forceReload`));
};

// ログイン
export const API_LOGIN = (loginId: string, password: string): Promise<{ token: string; user: IUser }> => {
    if (process.env.NODE_ENV === 'development') {
        console.log('API_LOGIN', loginId, password);
    }
    return APIREQ('LOGIN', axios().post(`${API_ENDPOINT}/auth/login`, { loginId, password }));
};

// トークチェック
export const API_CHECK_TOKEN = (token: string): Promise<{ isAdmin: boolean }> => {
    return APIREQ('CHECK_TOKEN', axios().post(`${API_ENDPOINT}/auth/checkToken`, { token }));
};

// チケット状況をキーごとに取得
export const API_FETCH_TICKET_STATUS = (params: ISearchEventRequest): Promise<TypeTicketsStatuses> => {
    return APIREQ('FETCH_TICKET_STATUS', axios().get(`${API_ENDPOINT}/status/tickets`, { params: params }));
};

// イベントJSONを更新
export const API_UPDATE_LOCAL_EVENT_JSON = (json: ILocalEventJSON): Promise<ILocalEventJSON> => {
    return APIREQ('UPDATE_LOCAL_EVENT_JSON', axios().put(`${API_ENDPOINT}/status/events/update/${json.name}`, json));
};

// イベントJSONを初期化
export const API_INIT_LOCAL_EVENT_JSON = (targetId: ENUM_LOCAL_EVENT_IDS): Promise<ILocalEventJSON> => {
    return APIREQ('INIT_LOCAL_EVENT_JSON', axios().post(`${API_ENDPOINT}/status/events/init/${targetId}`));
};
