import * as socketIo from 'socket.io';
import { catchErrorLogger, authErrorLogger } from './logger/winston';
import { verifyToken } from './middleware/checkUserAuth';
import { ENUM_SOCKETIO_EVENT_NAMES, ISocketSubscribeRequst, EventID, IStatusDataDic } from './Constants';

export interface IMySocketServer extends socketIo.Server {
    emitData?: Function;
}

// const subscribers: { [key:string]: string[]; } = {};

export const createSocketIoServer = (server: any): IMySocketServer => {
    const io: IMySocketServer = socketIo(server);
    io.on(ENUM_SOCKETIO_EVENT_NAMES.CONNECTION, (socket) => {
        socket.on(ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE, (subscribeRequst: ISocketSubscribeRequst) => {
            if (Object.keys(socket.rooms).length === subscribeRequst.dataTargetArray.length) {
                return socket.emit(ENUM_SOCKETIO_EVENT_NAMES.ALREADY_GRANTED, socket.rooms);
            }
            try {
                try {
                    verifyToken(subscribeRequst.jwt);
                } catch (e) {
                    socket.emit(ENUM_SOCKETIO_EVENT_NAMES.CONNECTION_REJECTED, e.message);
                    socket.disconnect();
                    return authErrorLogger.error(`[socketIo][${ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE}][${subscribeRequst.dataTargetArray.join(', ')}] auth failed: ${e.message}`);
                }
                subscribeRequst.dataTargetArray.forEach(() => {
                    socket.join(subscribeRequst.dataTargetArray);
                });
                return socket.emit(ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE_GRANTED, subscribeRequst.dataTargetArray);
            } catch (e) {
                socket.emit(ENUM_SOCKETIO_EVENT_NAMES.CONNECTION_REJECTED, e.message);
                return catchErrorLogger.error(`[socketIo][${ENUM_SOCKETIO_EVENT_NAMES.SUBSCRIBE}] ${e.message}`);
            }
        });
    });
    io.emitData = (targetId: EventID, data: any) => {
        try {
            io.to(targetId).emit(ENUM_SOCKETIO_EVENT_NAMES.DATA_UPDATED, {
                [targetId]: data,
            } as IStatusDataDic);
        } catch (e) {
            catchErrorLogger.error(`[socketIo][emitData][${targetId}] ${e.message}`);
        }
    };
    return io;
};
