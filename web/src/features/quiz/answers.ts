import type { AnswerValue } from '../../lib/types';

export const isAnswered = (value: AnswerValue | undefined) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value && value.trim());
