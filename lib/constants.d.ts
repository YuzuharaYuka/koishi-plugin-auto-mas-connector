export declare const PLUGIN_NAME = "auto-mas-connector";
export declare const LOGGER_NAME = "auto-mas";
export declare const DEFAULT_BASE_URL = "http://127.0.0.1:36163";
export declare const DEFAULT_LISTEN_PATH = "/AUTO_MAS";
export declare const DEFAULT_STANDALONE_PORT = 5150;
export declare const DEFAULT_GAME_WINDOW = "\u660E\u65E5\u65B9\u821F";
export declare const DEFAULT_IMAGE_WIDTH = 720;
export declare const MAX_MESSAGE_LENGTH = 2000;
/** Koishi 默认的 HTTP 端口，用于推断 AUTO-MAS 应填写的推送地址 */
export declare const DEFAULT_KOISHI_PORT = 5140;
/** 通知类别：AUTO-MAS 的推送没有结构化分类，只能按正文关键词归类 */
export declare const NOTIFICATION_CATEGORIES: Record<string, string>;
export declare const POWER_SIGNALS: readonly ["NoAction", "Shutdown", "ShutdownForce", "Reboot", "Hibernate", "Sleep", "KillSelf", "RestartSelf", "Logoff"];
export declare const POWER_ALIASES: Record<string, string>;
export declare const HELP_TEXT = "\nAUTO-MAS \u63A7\u5236\u53F0\n\n\u67E5\u8BE2\n\u00B7 mas\u72B6\u6001 \u2014 \u540E\u7AEF\u72B6\u6001\u3001\u8FD0\u884C\u4EFB\u52A1\u4E0E\u63A8\u9001\u72B6\u6001\n\u00B7 mas\u4EFB\u52A1 [\u4EFB\u52A1ID] \u2014 \u4EFB\u52A1\u5217\u8868\uFF1B\u5E26 ID \u67E5\u7ED3\u679C\n\u00B7 mas\u961F\u5217 \u2014 \u8C03\u5EA6\u961F\u5217\n\u00B7 mas\u811A\u672C [-v] \u2014 \u811A\u672C\u914D\u7F6E\uFF1B-v \u663E\u793A\u5B8C\u6574 ID\n\u00B7 mas\u7528\u6237 [\u811A\u672C] \u2014 \u811A\u672C\u4E0B\u7684\u7528\u6237\n\u00B7 mas\u5386\u53F2 [\u5929\u6570] \u2014 \u6267\u884C\u5386\u53F2\uFF0C\u9ED8\u8BA4 1 \u5929\n\n\u63A7\u5236\uFF08\u4EC5\u7BA1\u7406\u5458\uFF09\n\u00B7 mas\u542F\u52A8 [\u540D\u79F0] \u2014 \u542F\u52A8\u811A\u672C\u6216\u961F\u5217\uFF1B-c \u5FAA\u73AF\u6267\u884C\u961F\u5217\n\u00B7 mas\u5F00\u961F [\u961F\u5217] [\u7528\u6237...] \u2014 \u6307\u5B9A\u7528\u6237\u542F\u52A8\u961F\u5217\n\u00B7 mas\u505C\u6B62 [\u4EFB\u52A1ID] \u2014 \u505C\u6B62\u4EFB\u52A1\n\u00B7 mas\u7535\u6E90 [\u64CD\u4F5C] -y \u2014 \u5173\u673A\u3001\u91CD\u542F\u3001\u4F11\u7720\u7B49\n\u00B7 mas\u622A\u56FE [\u7A97\u53E3] [-a] \u2014 \u6309\u914D\u7F6E\u622A\u56FE\uFF1B-a \u7528 ADB\n\n\u5176\u4ED6\n\u00B7 mas\u6D4B\u8BD5 \u2014 \u7ED9\u804A\u5929\u76EE\u6807\u53D1\u6D4B\u8BD5\u901A\u77E5\n\u00B7 mas\u63A8\u9001 [-e|-d|-t] \u2014 \u67E5\u770B\u6216\u4FEE\u6539 AUTO-MAS \u63A8\u9001\u8BBE\u7F6E\n\u00B7 mas\u6211\u662F\u8C01 \u2014 \u67E5\u770B\u81EA\u5DF1\u7684\u5E73\u53F0\u6807\u8BC6\n\n\u540D\u79F0\u652F\u6301\u6A21\u7CCA\u5339\u914D\uFF0CID \u652F\u6301\u524D\u7F00\uFF1B\u67E5\u8BE2\u7C7B\u6240\u6709\u4EBA\u53EF\u7528\u3002\nAUTO-MAS \u7684\u4EFB\u52A1\u901A\u77E5\u9ED8\u8BA4\u5728\u6574\u6279\u4EFB\u52A1\u7ED3\u675F\u540E\u7EDF\u4E00\u6295\u9012\u3002\n";
