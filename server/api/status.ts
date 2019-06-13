import * as dayjs from 'dayjs';
import { Request, Response, Router } from 'express';
import { writeFileSync } from 'fs';
import { checkUserAuth } from '../middleware/checkUserAuth';
import { errorResponseHandler } from '../misc/commonFunc';
import { cinerinoSearchScreeningEvents } from './cinerino/cinerino';
import { ENUM_LOCAL_EVENT_IDS, ENUM_LOCAL_EVENT_STATUS_TYPE, EventID_TICKET, ILocalEventJSON, PATH_DIST_JSON, EVENT_STATUSSTRING_VALUE_ARRAY } from '../Constants';

/**
 * ScreeningEventsから特定のイベントを引っ張り出するためのworkPerformedIdentifier(環境ごとで変わりうるので環境変数で持つ)
 */
const EVENT_IDENTIFIERS: { [key in EventID_TICKET]: string } = Object.keys(process.env).reduce(
    (ret, key: string) => {
        const matches = /^CINERINO_EVENT_IDENTIFIER_(.*)/.exec(key);
        if (matches && matches[1]) {
            ret[matches[1]] = process.env[key];
        }
        return ret;
    },
    {} as { [key in EventID_TICKET]: string },
);
// ScreeningEvents検索は混ざって返ってくるので仕分け用に辞書が必要
const EVENT_IDENTIFIER_KEY_BY_VALUE: {
    [key: string]: EventID_TICKET;
} = Object.keys(EVENT_IDENTIFIERS).reduce((ret, key) => {
    ret[EVENT_IDENTIFIERS[key]] = key;
    return ret;
}, {});

/**
 * チケット状況をCinerinoから取得して返す
 */
const fetchTicketsStatusContoller = async (req: Request, res: Response) => {
    try {
        let workPerformedIdentifiers = null;
        try {
            if (!req.query.startFrom || !req.query.startThrough || !req.query.requiredEventIdentifierKeyArray.length) {
                throw new Error('parameter missing.');
            }
            workPerformedIdentifiers = req.query.requiredEventIdentifierKeyArray.map((key: string) => {
                if (!EVENT_IDENTIFIERS[key]) {
                    throw new Error(`unexpected identifier: ${key} .`);
                }
                return EVENT_IDENTIFIERS[key];
            });
        } catch (e) {
            return res.status(400).send(`invalid request : ${e.message}`);
        }
        return res.json(
            (await cinerinoSearchScreeningEvents({
                workPerformedIdentifiers,
                startFrom: req.query.startFrom,
                startThrough: req.query.startThrough,
                locationBranchCode: req.query.locationBranchCode,
            })).data.reduce((a, b) => {
                // ※念のためフィルター
                if (workPerformedIdentifiers.indexOf(b.workPerformed.identifier) === -1) {
                    return a;
                }
                const key = EVENT_IDENTIFIER_KEY_BY_VALUE[b.workPerformed.identifier];
                a[key] = (a[key] || []) as typeof b[];
                a[key].push(b);
                return a;
            }, {}),
        );
    } catch (e) {
        console.log('[catched][fetchTicketsStatusContoller]', e);
        return errorResponseHandler(true, req, res, e);
    }
};

/**
 * ローカルJSONを初期化する(保存と同時にsocketにemit)
 */
const initLocalStatusJsonContoller = async (req: Request, res: Response) => {
    const jsonName = req.params.name;
    try {
        if (!jsonName || !(jsonName in ENUM_LOCAL_EVENT_IDS)) {
            return res.status(400).send('invalid target name.');
        }
        const data: ILocalEventJSON = {
            name: jsonName,
            type: ENUM_LOCAL_EVENT_STATUS_TYPE.TIME,
            statusString: 10,
            updateAt: Date.now(),
            updateAtString: dayjs().format('YYYY/MM/DD HH:mm:ss'),
        };
        writeFileSync(`${PATH_DIST_JSON}/${jsonName}.json`, JSON.stringify(data), {
            encoding: 'utf-8',
        });
        req.io.emitData(jsonName, data);
        return res.json(data);
    } catch (e) {
        return errorResponseHandler(true, req, res, e);
    }
};

/**
 * ローカルJSONファイルを更新(保存と同時にsocketにemit)
 */
const updateLocalStatusContoller = async (req: Request, res: Response) => {
    const jsonName = req.params.name;
    try {
        try {
            if (!jsonName || !(jsonName in ENUM_LOCAL_EVENT_IDS) || req.body.name !== jsonName) {
                throw new Error('invalid name.');
            }
            if (EVENT_STATUSSTRING_VALUE_ARRAY.indexOf(req.body.statusString) === -1) {
                throw new Error(`invalid request: ${JSON.stringify(req.body)}`);
            }
        } catch (e) {
            return res.status(400).send(e.message);
        }
        const data: ILocalEventJSON = {
            name: jsonName,
            type: typeof req.body.statusString === 'string' ? ENUM_LOCAL_EVENT_STATUS_TYPE.MESSAGE : ENUM_LOCAL_EVENT_STATUS_TYPE.TIME,
            statusString: req.body.statusString,
            updateAt: Date.now(),
            updateAtString: dayjs().format('YYYY/MM/DD HH:mm:ss'),
        };
        writeFileSync(`${PATH_DIST_JSON}/${jsonName}.json`, JSON.stringify(data), {
            encoding: 'utf-8',
        });
        req.io.emitData(jsonName, data);
        return res.json(data);
    } catch (e) {
        return errorResponseHandler(true, req, res, e);
    }
};

const router = Router();
router.get('/tickets', checkUserAuth({ isAdminRealm: false }), fetchTicketsStatusContoller);
router.post('/events/init/:name', checkUserAuth({ isAdminRealm: true }), initLocalStatusJsonContoller);
router.put('/events/update/:name', checkUserAuth({ isAdminRealm: true }), updateLocalStatusContoller);

export const statusApiRouter = router;
