// Lớp API DeepSeek — "vệ tinh dự phòng" thứ 2 bên cạnh OpenRouter.
// Cố tình giữ cấu trúc (KeyManager rotate nhiều key, fetch/fetchStream, retry/backoff)
// gần như GIỐNG HỆT src/services/api/openrouter.ts để dễ bảo trì song song và để
// các luồng gọi (streamTranslate/repair/aiValidation/smartFix) chỉ cần thêm 1 nhánh
// `startsWith('deepseek:')` bên cạnh nhánh `startsWith('openrouter:')` đã có.

export interface DeepSeekKeyStatus {
    key: string;
    index: number;
    maskedKey: string;
    status: 'Active' | 'Exhausted' | 'Error' | 'Pending';
    successCount: number;
}

export interface DeepSeekModelDef {
    id: string;          // id gửi lên API (vd: 'deepseek-v4-flash')
    label: string;        // tên hiển thị (vd: 'DeepSeek V4 Flash (1M context, output 384K)')
    contextLength: number;
    maxOutputTokens: number;
}

// Chỉ giữ 2 model theo yêu cầu (V4 Pro/Flash). Không cần fetch danh sách động như OpenRouter
// vì DeepSeek chỉ có ngần này lựa chọn được hỗ trợ trong app.
export const DEEPSEEK_MODELS: DeepSeekModelDef[] = [
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro (1M context, output 384K)', contextLength: 1_000_000, maxOutputTokens: 384_000 },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash (1M context, output 384K)', contextLength: 1_000_000, maxOutputTokens: 384_000 },
];

export const getDeepSeekModelInfo = (modelId: string): DeepSeekModelDef | null => {
    return DEEPSEEK_MODELS.find(m => m.id === modelId) || null;
};

// V4 Pro/Flash là model hybrid có chế độ "thinking" (suy luận ẩn) bật mặc định — tắt đi để
// tiết kiệm token/thời gian và tránh output lẫn phần suy luận không cần thiết cho tác vụ dịch/
// phân tích văn bản. KHÔNG áp dụng cho 'deepseek-chat' (V3, không có thinking) và cố tình
// KHÔNG áp dụng cho 'deepseek-reasoner' (R1 — bản chất là để suy luận sâu, tắt đi vô nghĩa).
const isThinkingToggleModel = (modelId: string): boolean => modelId === 'deepseek-v4-pro' || modelId === 'deepseek-v4-flash';

type EventCallback = () => void;

class DeepSeekKeyManager {
    private originalKeyStr: string = "";
    private keys: string[] = [];
    private currentIndex: number = 0;
    private keyStatuses: Map<string, DeepSeekKeyStatus> = new Map();
    private subscribers: Set<EventCallback> = new Set();
    private isRotating: boolean = false;

    public syncKeys(apiKeyStr: string) {
        if (this.originalKeyStr === apiKeyStr) return;
        this.originalKeyStr = apiKeyStr;
        const newKeys = apiKeyStr.split(/[,\n]/).map(k => k.trim()).filter(Boolean);

        this.keys = newKeys;
        this.keyStatuses.clear();
        this.keys.forEach((key, idx) => {
            const masked = key.length > 12 ? key.substring(0, 8) + '...' + key.substring(key.length - 4) : 'Invalid Key';
            this.keyStatuses.set(key, {
                key: key,
                index: idx,
                maskedKey: masked,
                status: idx === 0 ? 'Active' : 'Pending',
                successCount: 0
            });
        });
        this.currentIndex = 0;
        this.notify();
    }

    public getKeys(): string[] {
        return this.keys;
    }

    public getKeyStatuses(): DeepSeekKeyStatus[] {
        return this.keys.map(k => this.keyStatuses.get(k)!);
    }

    public getCurrentKeyInfo(): DeepSeekKeyStatus | null {
        if (this.keys.length === 0) return null;
        return this.keyStatuses.get(this.keys[this.currentIndex]) || null;
    }

    public getCurrentKey(): string {
        if (this.keys.length === 0) return "";
        return this.keys[this.currentIndex];
    }

    public switchToKey(index: number) {
        if (index >= 0 && index < this.keys.length) {
            const prevKey = this.keys[this.currentIndex];
            const prevStatus = this.keyStatuses.get(prevKey);
            if (prevStatus && prevStatus.status === 'Active') {
                prevStatus.status = 'Pending';
            }

            this.currentIndex = index;
            const newKey = this.keys[this.currentIndex];
            const newStatus = this.keyStatuses.get(newKey);
            if (newStatus) {
                newStatus.status = 'Active';
                newStatus.successCount = 0;
            }
            this.notify();
        }
    }

    public rotateToNext(): boolean {
        if (this.keys.length <= 1) return false;
        if (this.isRotating) return false;

        this.isRotating = true;
        const prevKey = this.keys[this.currentIndex];
        const prevStatus = this.keyStatuses.get(prevKey);
        if (prevStatus && prevStatus.status === 'Active') {
            prevStatus.status = 'Exhausted';
        }

        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        const newKey = this.keys[this.currentIndex];
        const newStatus = this.keyStatuses.get(newKey);

        let allExhausted = true;
        for (const [, st] of this.keyStatuses) {
            if (st.status !== 'Exhausted' && st.status !== 'Error') {
                allExhausted = false;
                break;
            }
        }

        if (allExhausted) {
            console.log("All DeepSeek keys exhausted. Resetting statuses.");
            for (const [, st] of this.keyStatuses) {
                st.status = 'Pending';
                st.successCount = 0;
            }
        }

        if (newStatus && newStatus.status !== 'Exhausted' && newStatus.status !== 'Error') {
            newStatus.status = 'Active';
        } else if (allExhausted && newStatus) {
            newStatus.status = 'Active';
        }

        this.isRotating = false;
        this.notify();
        return true;
    }

    public reportSuccess() {
        const currentKey = this.keys[this.currentIndex];
        const status = this.keyStatuses.get(currentKey);
        if (status) {
            status.successCount++;
            if (status.status !== 'Active') {
                status.status = 'Active';
            }
            this.notify();
        }
    }

    public reportError(errorMsg: string) {
        const currentKey = this.keys[this.currentIndex];
        const status = this.keyStatuses.get(currentKey);
        if (status) {
            const isQuotaError = errorMsg.includes("429") || errorMsg.toLowerCase().includes("rate limit") || errorMsg.toLowerCase().includes("insufficient balance") || errorMsg.toLowerCase().includes("too many requests");
            if (isQuotaError) {
                status.status = 'Exhausted';
                this.rotateToNext();
            } else {
                status.status = 'Error';
            }
            this.notify();
        }
    }

    public resetQuota() {
        this.currentIndex = 0;
        this.keys.forEach((key, idx) => {
            const st = this.keyStatuses.get(key);
            if (st) {
                st.status = idx === 0 ? 'Active' : 'Pending';
                st.successCount = 0;
            }
        });
        this.notify();
    }

    public subscribe(callback: EventCallback): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        this.subscribers.forEach(cb => cb());
    }
}

export const deepSeekKeyManager = new DeepSeekKeyManager();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const estimateOutputTokens = (promptLen: number, sysLen: number, modelInfo: DeepSeekModelDef | null): number => {
    const estInputTokens = Math.ceil(promptLen / 2.5) + Math.ceil(sysLen / 2.5);
    let estimatedOutputTokens = Math.min(Math.ceil(promptLen / 2.5) + 1000, 16000);
    if (modelInfo) {
        const remainingContext = modelInfo.contextLength - estInputTokens - 200;
        if (remainingContext > 0) {
            estimatedOutputTokens = Math.min(estimatedOutputTokens, remainingContext);
        }
        estimatedOutputTokens = Math.min(estimatedOutputTokens, modelInfo.maxOutputTokens);
    }
    return estimatedOutputTokens;
};

export const fetchDeepSeek = async (
    apiKeyStr: string,
    model: string,
    systemInstruction: string,
    prompt: string,
    jsonMode = false,
    onModelInfo?: (model: string) => void
): Promise<string> => {
    deepSeekKeyManager.syncKeys(apiKeyStr);

    const keys = deepSeekKeyManager.getKeys();
    if (keys.length === 0) {
        throw new Error("DeepSeek API Key not provided.");
    }

    const modelId = model.split(',')[0].trim() || 'deepseek-v4-flash';
    const modelInfo = getDeepSeekModelInfo(modelId);
    const estimatedOutputTokens = estimateOutputTokens(prompt.length, systemInstruction.length, modelInfo);

    const payload: any = {
        model: modelId,
        messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: estimatedOutputTokens
    };

    if (jsonMode) {
        payload.response_format = { type: 'json_object' };
    }

    if (isThinkingToggleModel(modelId)) {
        payload.thinking = { type: 'disabled' };
    }

    let lastError: Error | null = null;
    const maxRetries = 7;
    let attempt = 0;

    while (attempt < maxRetries) {
        const currentKey = deepSeekKeyManager.getCurrentKey();
        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${currentKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errObj = await response.json().catch(() => ({}));
                const errMsg = errObj.error?.message || `DeepSeek API error: ${response.status} ${response.statusText}`;
                throw new Error(errMsg);
            }

            const data = await response.json();
            if (onModelInfo) onModelInfo(modelId);
            deepSeekKeyManager.reportSuccess();
            return data.choices?.[0]?.message?.content || "";
        } catch (error: any) {
            lastError = error;
            deepSeekKeyManager.reportError(error.message);
            attempt++;

            if (attempt >= maxRetries) break;

            if (attempt === 1) {
                await delay(3000);
            } else if (attempt === 2) {
                await delay(5000);
            } else if (attempt === 3) {
                await delay(10000);
            } else {
                if (keys.length > 1) {
                    // already rotated by reportError if quota error
                } else {
                    await delay(30000);
                }
            }
        }
    }

    throw new Error(`DeepSeek failed after ${maxRetries} attempts. Last Error: ${lastError?.message}`);
};

export const fetchDeepSeekStream = async (
    apiKeyStr: string,
    model: string,
    systemInstruction: string,
    prompt: string,
    onChunk: (text: string) => void,
    onModelInfo?: (model: string) => void,
    onLog?: (msg: string) => void
): Promise<string> => {
    deepSeekKeyManager.syncKeys(apiKeyStr);

    const keys = deepSeekKeyManager.getKeys();
    if (keys.length === 0) {
        throw new Error("DeepSeek API Key not provided.");
    }

    const modelId = model.split(',')[0].trim() || 'deepseek-v4-flash';
    const modelInfo = getDeepSeekModelInfo(modelId);

    let lastError: Error | null = null;
    const maxRetries = 7;
    let attempt = 0;
    let fullText = "";

    let currentPrompt = prompt;
    let continuationAttempts = 0;
    const MAX_CONTINUATIONS = 6;

    while (attempt < maxRetries) {
        const currentKey = deepSeekKeyManager.getCurrentKey();
        try {
            const estimatedOutputTokens = estimateOutputTokens(currentPrompt.length, systemInstruction.length, modelInfo);

            const response = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${currentKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: currentPrompt }
                    ],
                    stream: true,
                    temperature: 0.2,
                    max_tokens: estimatedOutputTokens,
                    ...(isThinkingToggleModel(modelId) ? { thinking: { type: 'disabled' } } : {})
                })
            });

            if (!response.ok) {
                const errObj = await response.json().catch(() => ({}));
                throw new Error(errObj.error?.message || `DeepSeek API error: ${response.status} ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error("No response body from DeepSeek.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let modelReported = false;
            let needsContinuation = false;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let newlineIdx;

                while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.substring(0, newlineIdx).trim();
                    buffer = buffer.substring(newlineIdx + 1);
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(dataStr);

                            if (onModelInfo && !modelReported) {
                                onModelInfo(modelId);
                                modelReported = true;
                            }

                            const content = data.choices?.[0]?.delta?.content;
                            if (content) {
                                fullText += content;
                                onChunk(fullText);
                            }

                            if (data.choices?.[0]?.finish_reason === 'length') {
                                if (continuationAttempts < MAX_CONTINUATIONS) {
                                    continuationAttempts++;
                                    currentPrompt = `${prompt}\n\n[ĐÃ DỊCH ĐƯỢC MỘT PHẦN LÀ:\n${fullText}\n]\n\nBẠN HÃY VIẾT TIẾP CHÍNH XÁC TỪ CHỖ BỊ CẮT. KHÔNG LẶP LẠI PHẦN ĐÃ DỊCH, KHÔNG MỞ LẠI THẺ START NỮA.`;
                                    attempt = 0;
                                    deepSeekKeyManager.reportSuccess();
                                    needsContinuation = true;
                                    if (onLog) onLog(`🔄 DeepSeek bị cắt ngang (max_tokens). Tự động nối tiếp phần ${continuationAttempts}/${MAX_CONTINUATIONS}...`);
                                    break;
                                } else {
                                    throw new Error("Lỗi DeepSeek: Đã đạt giới hạn số lần nối tự động do max_tokens.");
                                }
                            }

                        } catch (e: any) {
                            if (e.message === 'ABORTED' || (e.message && e.message.includes('Lỗi AI lặp từ')) || e.message.includes('Lỗi DeepSeek:')) {
                                throw e;
                            }
                            // Ignore parse errors
                        }
                    }
                }
                if (needsContinuation) break;
            }

            if (needsContinuation) {
                continue;
            }

            deepSeekKeyManager.reportSuccess();
            return fullText;
        } catch (error: any) {
            if (error.message === 'ABORTED' || (error.message && error.message.includes('Lỗi AI lặp từ'))) {
                throw error;
            }
            lastError = error;
            deepSeekKeyManager.reportError(error.message);
            attempt++;

            if (attempt >= maxRetries) break;

            if (attempt === 1) {
                await delay(3000);
            } else if (attempt === 2) {
                await delay(5000);
            } else if (attempt === 3) {
                await delay(10000);
            } else {
                if (keys.length > 1) {
                    // rotated
                } else {
                    await delay(30000);
                }
            }
        }
    }

    throw new Error(`DeepSeek stream failed after ${maxRetries} attempts. Last Error: ${lastError?.message}`);
};
