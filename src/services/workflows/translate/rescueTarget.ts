// Helper dùng chung để quyết định "vệ tinh cứu hộ" (OpenRouter hay DeepSeek) sẽ đảm nhận
// 1 lượt thử lại của tệp bị nghi vấn vi phạm bộ lọc an toàn / lỗi nội dung, dựa trên
// retryCount hiện tại của tệp đó và các API Key đang có.
//
// Quy tắc: OpenRouter đảm nhận `perRescueBudget` lượt đầu tiên -> nếu vẫn lỗi, DeepSeek
// đảm nhận `perRescueBudget` lượt kế tiếp -> hết cả 2 thì cách ly (ERROR).
// Nếu chỉ có 1 trong 2 bên, bên đó đảm nhận toàn bộ `perRescueBudget` lượt (giữ nguyên
// hành vi cũ trước khi có DeepSeek). Nếu không có bên nào, trả về null ngay lập tức.
export type RescueTarget = 'openrouter' | 'deepseek' | null;

export const getRescueTarget = (
    retryCount: number,
    hasOpenRouter: boolean,
    hasDeepSeek: boolean,
    perRescueBudget: number
): RescueTarget => {
    if (hasOpenRouter && retryCount < perRescueBudget) return 'openrouter';
    const deepSeekWindow = perRescueBudget * (hasOpenRouter ? 2 : 1);
    if (hasDeepSeek && retryCount < deepSeekWindow) return 'deepseek';
    return null;
};

// Tổng số lượt cứu hộ khả dụng (dùng để hiển thị "x/y" trong errorMessage).
export const getRescueBudget = (
    hasOpenRouter: boolean,
    hasDeepSeek: boolean,
    perRescueBudget: number
): number => {
    return (hasOpenRouter ? perRescueBudget : 0) + (hasDeepSeek ? perRescueBudget : 0);
};

export const getRescueLabel = (target: RescueTarget): string => {
    if (target === 'openrouter') return 'OpenRouter';
    if (target === 'deepseek') return 'DeepSeek';
    return '';
};
