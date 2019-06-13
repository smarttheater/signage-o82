import { v1 as uuidV1 } from 'uuid';
import { factory, service, auth } from '@cinerino/api-nodejs-client';
import { ISearchResult } from '@cinerino/api-abstract-client/lib/service';
import { catchErrorLogger } from '../../logger/winston';

interface IAuthOptions {
    endpoint: string;
    auth: auth.ClientCredentials;
}
/**
 * Cinerino認証 (※リフレッシュ不可で期限も取れないのでリクエストの度に実行してトークンを発行する)
 */
export const getCinerinoAuthedOptions = (): Promise<IAuthOptions> => {
    return new Promise(async (resolve, reject) => {
        try {
            const authOptions = {
                endpoint: process.env.CINERINO_API_ENDPOINT,
                auth: new auth.ClientCredentials({
                    domain: process.env.CINERINO_AUTHORIZE_SERVER_DOMAIN,
                    clientId: process.env.CINERINO_CLIENT_ID,
                    clientSecret: process.env.CINERINO_CLIENT_SECRET,
                    state: uuidV1(),
                    scopes: [],
                }),
            };
            authOptions.auth.setCredentials({
                access_token: await authOptions.auth.getAccessToken(),
            });
            return resolve(authOptions);
        } catch (e) {
            const msg = `[cinerino][getCinerinoAuthedOptions] ${e.message}`;
            catchErrorLogger.error(msg);
            return reject(new Error(msg));
        }
    });
};

/**
 * Cinerinoで screeningEvent を検索して結果をそのまま返す
 */
export const cinerinoSearchScreeningEvents = (params: {
    workPerformedIdentifiers: string[];
    startFrom: Date;
    startThrough: Date;
    locationBranchCode: string;
}): Promise<ISearchResult<factory.chevre.event.screeningEvent.IEvent[]>> => {
    return new Promise(async (resolve, reject) => {
        let authOptions: IAuthOptions;
        try {
            authOptions = await getCinerinoAuthedOptions();
        } catch (e) {
            return reject(e);
        }
        try {
            const result = await new service.Event(authOptions).searchScreeningEvents({
                typeOf: factory.chevre.eventType.ScreeningEvent,
                eventStatuses: [factory.chevre.eventStatusType.EventScheduled],
                superEvent: {
                    workPerformedIdentifiers: params.workPerformedIdentifiers,
                    locationBranchCodes: [params.locationBranchCode],
                },
                startFrom: params.startFrom,
                startThrough: params.startThrough,
            });
            return resolve(result);
        } catch (e) {
            const msg = `[cinerino][cinerinoSearchScreeningEvents] ${e.message}`;
            catchErrorLogger.error(msg);
            return reject(new Error(msg));
        }
    });
};
