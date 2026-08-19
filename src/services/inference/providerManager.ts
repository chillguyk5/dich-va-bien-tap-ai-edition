import { TaskType } from '../../types';
import { getAiClient, smartExecution, SAFETY_SETTINGS } from '../api/gemini';
import { fetchOpenRouterStream } from '../api/openrouter';
import { fetchDeepSeekStream } from '../api/deepseek';
import { getCandidateModelsForTask } from './taskRouter';

export interface InferenceOptions {
  taskName?: string;
  candidateModels?: string[];
  preferredModelId?: string;
  enabledModels?: string[];
  temperature?: number;
  maxOutputTokens?: number;
  jsonOutput?: boolean;
  onStreamChunk?: (chunk: string) => void;
  onLog?: (msg: string) => void;
  shouldAbort?: () => boolean;
  openRouterKey?: string;
  deepseekKey?: string;
}

export interface InferenceResult {
  text: string;
  usedModel: string;
  durationMs: number;
}

export async function executeTaskInference(
  task: TaskType,
  systemPrompt: string,
  userPrompt: string,
  options: InferenceOptions = {}
): Promise<InferenceResult> {
  const startTime = Date.now();
  const taskTitle = options.taskName || `Tác vụ ${task}`;

  const candidates = options.candidateModels && options.candidateModels.length > 0
    ? options.candidateModels
    : getCandidateModelsForTask(task, undefined, options.enabledModels);

  let actualUsedModel = candidates[0] || 'gemini';

  const resultText = await smartExecution<string>(
    candidates,
    async (modelId: string) => {
      actualUsedModel = modelId;
      if (options.shouldAbort && options.shouldAbort()) {
        throw new Error('Tác vụ đã bị người dùng dừng lại.');
      }

      // 1. OPENROUTER SATELLITE
      if (modelId.startsWith('openrouter:')) {
        const pureModel = modelId.replace('openrouter:', '');
        const stream = await fetchOpenRouterStream(
          pureModel,
          systemPrompt,
          userPrompt,
          options.openRouterKey || '',
          undefined,
          options.temperature || 0.3
        );
        let fullText = '';
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          if (options.shouldAbort && options.shouldAbort()) {
            reader.cancel();
            throw new Error('Đã dừng tác vụ.');
          }
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          if (options.onStreamChunk) options.onStreamChunk(chunk);
        }
        return fullText;
      }

      // 2. DEEPSEEK SATELLITE
      if (modelId.startsWith('deepseek:')) {
        const pureModel = modelId.replace('deepseek:', '');
        const stream = await fetchDeepSeekStream(
          pureModel,
          systemPrompt,
          userPrompt,
          options.deepseekKey || '',
          undefined,
          options.temperature || 0.3
        );
        let fullText = '';
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          if (options.shouldAbort && options.shouldAbort()) {
            reader.cancel();
            throw new Error('Đã dừng tác vụ.');
          }
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          if (options.onStreamChunk) options.onStreamChunk(chunk);
        }
        return fullText;
      }

      // 3. GEMINI NATIVE SDK (@google/genai)
      const ai = getAiClient();
      const config: any = {
        safetySettings: SAFETY_SETTINGS,
        systemInstruction: systemPrompt,
        temperature: options.temperature ?? 0.3,
      };

      if (options.maxOutputTokens) {
        config.maxOutputTokens = options.maxOutputTokens;
      }

      if (options.jsonOutput) {
        config.responseMimeType = 'application/json';
      }

      const responseStream = await ai.models.generateContentStream({
        model: modelId,
        contents: userPrompt,
        config,
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (options.shouldAbort && options.shouldAbort()) {
          throw new Error('Đã dừng tác vụ.');
        }
        const text = chunk.text || '';
        fullText += text;
        if (options.onStreamChunk) {
          options.onStreamChunk(text);
        }
      }

      if (!fullText || fullText.trim().length === 0) {
        throw new Error(`Model ${modelId} trả về kết quả rỗng.`);
      }

      return fullText;
    },
    taskTitle,
    options.onLog,
    options.preferredModelId
  );

  const durationMs = Date.now() - startTime;
  return {
    text: resultText,
    usedModel: actualUsedModel,
    durationMs,
  };
}
