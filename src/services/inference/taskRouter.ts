import { TaskType } from '../../types';

export interface TaskModelMapping {
  translate: string[];
  review: string[];
  edit: string[];
  qa_repair: string[];
  style_forge: string[];
  character_extract: string[];
  title: string[];
}

export const DEFAULT_TASK_MODELS: TaskModelMapping = {
  translate: [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
  ],
  review: [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'deepseek:deepseek-v4-flash',
  ],
  edit: [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
  ],
  qa_repair: [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it',
  ],
  style_forge: [
    'gemini-3.1-pro-preview',
    'gemini-3.7-flash',
  ],
  character_extract: [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemma-4-31b-it',
  ],
  title: [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemma-4-31b-it',
  ],
};

export type InferencePreset = 'max_quality' | 'balanced' | 'quota_saver';

export function getPresetMapping(preset: InferencePreset): TaskModelMapping {
  switch (preset) {
    case 'max_quality':
      return {
        translate: ['gemini-3.7-flash', 'gemini-3.6-flash'],
        review: ['gemini-3.7-flash', 'deepseek:deepseek-v4-flash'],
        edit: ['gemini-3.7-flash', 'gemini-3.6-flash'],
        qa_repair: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
        style_forge: ['gemini-3.1-pro-preview'],
        character_extract: ['gemini-3.7-flash', 'gemini-3.5-flash-lite'],
        title: ['gemini-3.5-flash-lite'],
      };
    case 'quota_saver':
      return {
        translate: ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite'],
        review: ['gemini-3.5-flash', 'gemini-3.5-flash-lite'],
        edit: ['gemini-3.5-flash', 'gemini-3-flash-preview'],
        qa_repair: ['gemini-3.1-flash-lite', 'gemma-4-26b-a4b-it'],
        style_forge: ['gemini-3.7-flash'],
        character_extract: ['gemini-3.1-flash-lite', 'gemma-4-26b-a4b-it'],
        title: ['gemini-3.1-flash-lite'],
      };
    case 'balanced':
    default:
      return { ...DEFAULT_TASK_MODELS };
  }
}

export function getCandidateModelsForTask(
  task: TaskType,
  customMapping?: Partial<TaskModelMapping>,
  enabledModels?: string[]
): string[] {
  const configured = (customMapping && customMapping[task]) || DEFAULT_TASK_MODELS[task] || DEFAULT_TASK_MODELS.translate;
  if (!enabledModels || enabledModels.length === 0) {
    return configured;
  }
  // Filter by enabled models (while preserving satellite models like openrouter / deepseek)
  const filtered = configured.filter(m => 
    m.startsWith('openrouter:') || 
    m.startsWith('deepseek:') || 
    enabledModels.includes(m)
  );
  return filtered.length > 0 ? filtered : configured;
}
