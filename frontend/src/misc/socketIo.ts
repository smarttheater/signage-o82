import io from 'socket.io-client';
import { API_LOGGER } from '../misc/api';
import { LOCAL_API_URL, ENUM_SOCKETIO_EVENT_NAMES, ISocketSubscribeRequst } from '../Constants';

export interface IGetSocketArgs extends ISocketSubscribeRequst {
    options?: SocketIOClient.ConnectOpts;
}

// socket通信を確立してsocketを返す
export const getSocket = (args: IGetSocketArgs): Promise<SocketIOClient.Socket> => {
    if (process.env.NODE_ENV === 'development') {
        console.log('[socket.io][getSocket]', args);
    }
    return new Promise((resolve, reject) => {
        try {
            if (!args.dataTargetArray.length) {
                throw new Error('invalid request: dataTargetArray is empty');
            }
            if (process.env.NODE_ENV !== 'production') {
                args.options = args.options || {};
                args.options.host = LOCAL_API_URL;
            }
            const socket = io(args.options);
            // 切断
            socket.on(ENUM_SOCKETIO_EVENT_NAMES.DISCONNECTED, () => {
                console.log(`[socket.io] Disconnected.`);
            });
            socket.once('connect', () => {
                console.log(`[socket.io] Connected.`);
                // 購読情報を申告
                socket.emit(ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE, {
                    dataTargetArray: args.dataTargetArray,
                    jwt: args.jwt,
                } as ISocketSubscribeRequst);
                // 成功
                socket.once(ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE_GRANTED, () => {
                    console.log(`[socket.io] Subscribe Granted ([${args.dataTargetArray.join(', ')}]).`);
                    socket.removeAllListeners();
                    resolve(socket);
                });
                // 成功済み
                socket.once(ENUM_SOCKETIO_EVENT_NAMES.ALREADY_GRANTED, () => {
                    console.log(`[socket.io] Subscribe Already Granted ([${args.dataTargetArray.join(', ')}]).`);
                    socket.removeAllListeners();
                    // 強制リロード命令
                    socket.on(ENUM_SOCKETIO_EVENT_NAMES.RELOAD_REQUIRED, () => {
                        // tslint:disable-next-line
                        return window.location.reload(true);
                    });
                    resolve(socket);
                });
                // 認証失敗(closeする)
                socket.once(ENUM_SOCKETIO_EVENT_NAMES.CONNECTION_REJECTED, (msg: string) => {
                    const errmsg = `[socket.io] Rejected. ${msg}`;
                    console.log(errmsg);
                    socket.removeAllListeners();
                    socket.close();
                    API_LOGGER(errmsg).catch();
                    reject(new Error('`[socket.io] connenction rejected.`'));
                });
            });
        } catch (e) {
            console.error(e);
            return reject(new Error(`[catched][socket.io] fatal error. ${e.message}`));
        }
    });
};
