import { keys } from 'ts-transformer-keys';
import { IProcessEnv } from '../frontend/src/Constants';

// 全体共通の定義ファイル (コンパイルエラーを避けるためフロント側に本体を置く)
export * from '../frontend/src/Constants';

// サーバーに必要な環境変数のキーをintefaceから得る (VueCLIのWEBPACKだと動かない)
export const SERVER_REQUIRED_ENV_KEY_ARRAY = keys<IProcessEnv>();
