import * as expressWinston from 'express-winston';
import { createLogger, format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logdataDir = 'log/';

/**
 * express-winston
 */
export const expressErrorLogger = expressWinston.errorLogger({
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: `${logdataDir}%DATE%-ERROR-EXPRESS.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
        }),
    ],
});

/**
 * DBエラーロガー
 */
export const dbErrorLogger = createLogger({
    level: 'error',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: `${logdataDir}%DATE%-ERROR-DB.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
        }),
    ],
});

/**
 * 認証エラーロガー
 */
export const authErrorLogger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: `${logdataDir}%DATE%-INFO-AUTHFAIL.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
        }),
    ],
});

/**
 * catchロガー
 */
export const catchErrorLogger = createLogger({
    level: 'error',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: `${logdataDir}%DATE%-CATCHED.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
        }),
    ],
});

/**
 * クライアントロガー (postされたメッセージを記録)
 */
export const clientLogger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: `${logdataDir}%DATE%-CLIENT.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
        }),
    ],
});
