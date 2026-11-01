import { type Context } from 'koishi';
import type { AutoMasClient } from './client';
import type { Config } from './config';
import type { Notifier } from './notify';
export interface CommandDependencies {
    ctx: Context;
    config: Config;
    client: AutoMasClient;
    notify: Notifier;
}
export declare function registerCommands(deps: CommandDependencies): void;
