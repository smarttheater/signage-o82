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
            socket.on('connect', () => {
                console.log(`[socket.io] Connected.`);
                // 購読情報を申告
                socket.emit(ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE, {
                    dataTargetArray: args.dataTargetArray,
                    jwt: args.jwt,
                } as ISocketSubscribeRequst);
                // 成功
                socket.on(ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE_GRANTED, () => {
                    console.log(`[socket.io] Subscribe Granted ([${args.dataTargetArray.join(', ')}]).`);
                    resolve(socket);
                });
                // 認証失敗(closeする)
                socket.on(ENUM_SOCKETIO_EVENT_NAMES.CONNECTION_REJECTED, (msg: string) => {
                    const errmsg = `[socket.io] Rejected. ${msg}`;
                    console.log(errmsg);
                    socket.close();
                    reject(new Error('`[socket.io] connenction rejected.`'));
                    API_LOGGER(errmsg).catch();
                });
                // 切断
                socket.on(ENUM_SOCKETIO_EVENT_NAMES.DISCONNECTED, () => {
                    console.log(`[socket.io] Disconnected.`);
                });
            });
        } catch (e) {
            console.error(e);
            return reject(new Error(`[catched][socket.io] fatal error. ${e.message}`));
        }
    });
};
