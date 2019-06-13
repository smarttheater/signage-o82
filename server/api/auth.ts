import { Request, Response, Router } from 'express';
import { genNewToken, checkUserAuth } from '../middleware/checkUserAuth';
import { authErrorLogger } from '../logger/winston';
import { errorResponseHandler } from '../misc/commonFunc';
import { ENUM_USER_LEVEL, IUser } from '../Constants';

const checkTokenContoller = (_: Request, res: Response) => {
    return res.json({ user: res.locals.authUserToken });
};

const loginContoller = (req: Request, res: Response) => {
    try {
        const loginId = req.body.loginId;
        const loginPassword = req.body.password;
        const isAdmin = loginId === process.env.AUTH_USER_ADMIN_ID;
        const isStb = loginId === process.env.AUTH_USER_STB_ID;
        const password = isAdmin ? process.env.AUTH_USER_ADMIN_PASSWORD : process.env.AUTH_USER_STB_PASSWORD;
        if ((!isAdmin && !isStb) || loginPassword !== password) {
            authErrorLogger.info(`[login][${req.ip}] ${loginId}:${password}`);
            return res.status(401).send('login failed: confirm id & password.');
        }
        const token = genNewToken({
            id: loginId,
            level: isAdmin ? ENUM_USER_LEVEL.ADMIN : ENUM_USER_LEVEL.STB,
        });
        res.setHeader('token', token);
        return res.json({
            user: {
                loginId,
                isAdmin,
            } as IUser,
            token,
        });
    } catch (e) {
        return errorResponseHandler(true, req, res, e);
    }
};

const router = Router();
router.post('/checkToken', checkUserAuth(), checkTokenContoller);
router.post('/login', loginContoller);
export const authApiRouter = router;
