/** 渲染选项：只暴露宽度，其余排版值在这里统一维护 */
export interface ImageRenderOptions {
    width?: number;
}
/**
 * 把 AUTO-MAS 推送里的 HTML 渲染成一张 PNG。
 * 只处理通知会用到的排版（标题、段落、列表、内嵌图片、分隔线），不追求完整 HTML 语义。
 */
export declare function renderNotificationImage(html: string, options?: ImageRenderOptions): Promise<Buffer | undefined>;
