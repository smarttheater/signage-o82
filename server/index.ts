import { config } from 'dotenv';
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
    config();
    console.log('dotenv loaded.');
}
import * as https from 'https';
import * as express from 'express';
import { redirectToHTTPS } from 'express-http-to-https';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as history from 'connect-history-api-fallback';
import { readFileSync } from 'fs';
import { IMySocketServer, createSocketIoServer } from './socketIo';
import { expressErrorLogger } from './logger/winston';
import { checkUserAuth } from './middleware/checkUserAuth';
import { ApiRouter } from './api';
import { SERVER_REQUIRED_ENV_KEY_ARRAY, PORT_LOCAL_SERVER, LOCAL_FRONT_URL, PATH_DIST_JSON, IProcessEnv } from './Constants';

// d.tsだとimportが無効かエラー(ts1147)になるのでここで定義する
declare global {
    namespace Express {
        interface Request {
            io: IMySocketServer;
        }
    }
    namespace NodeJS {
        interface ProcessEnv extends IProcessEnv {}
    }
}

const port = process.env.PORT || PORT_LOCAL_SERVER;
const corsOptions: cors.CorsOptions = {
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Origin', 'X-Requested-With', 'token', 'Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['token'],
    credentials: true,
};
if (isDev) {
    corsOptions.origin = [LOCAL_FRONT_URL];
}
const app = express();
const server = isDev
    ? https.createServer(
          {
              key: readFileSync('./localhost.key'),
              cert: readFileSync('./localhost.crt'),
          },
          app,
      )
    : https.createServer(app);
const socketIoServer: IMySocketServer = createSocketIoServer(server);

/**
 *  必要な環境変数が欠けていたら500表示
 */
const missingEnvKeyArray = SERVER_REQUIRED_ENV_KEY_ARRAY.filter((REQUIRED_ENV_KEY) => {
    return process.env[REQUIRED_ENV_KEY] == null;
});
app.use((_, res, next) => {
    if (missingEnvKeyArray.length) {
        return res.status(500).send(`[FATAL] server env missing: ${missingEnvKeyArray.join(', ')}`);
    }
    return next();
});

// アクセス設定
app.use(redirectToHTTPS())
    .use(cors(corsOptions))
    .use(helmet())
    .use(bodyParser.json());

// JSONファイル置き場
app.use('/json', checkUserAuth(), express.static(PATH_DIST_JSON));

// API (各コントローラからsocketにemitできるようにreqに埋め込む)
app.use(
    '/api',
    (req, _, next) => {
        req.io = socketIoServer;
        return next();
    },
    ApiRouter,
);

// [/json, /api, /socket.io]以外はVueRouterが受け持つ
app.use(history()).use(express.static('./frontend/dist'));

app.use(expressErrorLogger);

server.listen(port);

console.log(`[app] server started on port ${port}...`);
