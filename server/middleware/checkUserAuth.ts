import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authErrorLogger, catchErrorLogger } from '../logger/winston';
import { ENUM_USER_LEVEL } from '../Constants';

interface IJwtUserData {
    id: string;
    level: ENUM_USER_LEVEL;
    exp?: number;
}
// JWT発行
export const genNewToken = (authUserToken: IJwtUserData) => {
    try {
        console.log('genNewToken');
        const expireIn = authUserToken.level === ENUM_USER_LEVEL.STB ? {} : { expiresIn: '1h' };
        return jwt.sign(
            {
                id: authUserToken.id,
                level: authUserToken.level,
            },
            process.env.AUTH_JWT_SECRET,
            expireIn,
        );
    } catch (e) {
        catchErrorLogger.error(`[checkUserAuth][genNewToken] ${e.message}`);
        throw e;
    }
};

// JWT照合
export const verifyToken = (token: string): IJwtUserData => {
    return jwt.verify(token, process.env.AUTH_JWT_SECRET) as IJwtUserData;
};

// 有効期限を見て更新したトークンを返す
export const refreshToken = (token: string): IJwtUserData => {
    return jwt.verify(token, process.env.AUTH_JWT_SECRET) as IJwtUserData;
};

// ExpressのResponseのlocalにユーザー情報を入れるので拡張
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type loginedResponse = Omit<Response, 'locals'> & {
    locals: {
        authUserToken: IJwtUserData;
    };
};
// JWT認証ミドルウェア (トークン文字列はGET/POSTでjwtとしても渡せる)
export const checkUserAuth = (_args?: { isAdminRealm?: boolean }) => {
    return async (req: Request, res: loginedResponse, next: NextFunction) => {
        let authUserToken: IJwtUserData = null;
        try {
            const args = _args || {};
            const token = (req.query.jwt || req.body.jwt || req.headers['token']) as string;
            try {
                if (!token) {
                    throw new Error('no token access.');
                }
                try {
                    authUserToken = verifyToken(token);
                } catch (e) {
                    throw new Error(`invalid token: ${e.message}`);
                }
                if (args.isAdminRealm && authUserToken.level !== ENUM_USER_LEVEL.ADMIN) {
                    throw new Error('permission denied.');
                }
            } catch (e) {
                authErrorLogger.info(`[checkUserAuth][${req.url}][${req.ip}] ${e.message}`);
                return res.status(401).send('401');
            }
            const isExpreIn10min = authUserToken.exp && authUserToken.exp * 1000 - Date.now() < 600000;
            res.setHeader('token', isExpreIn10min ? genNewToken(authUserToken) : token);
            res.locals.authUserToken = authUserToken;
            return next();
        } catch (error) {
            catchErrorLogger.error(`[checkUserAuth][${req.url}][${req.ip}] ${error.message}`);
            return res.status(500).send('internal server error: process token.');
        }
    };
};

export default checkUserAuth;
