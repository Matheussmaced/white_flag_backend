import type { DiaryEntry } from '@prisma/client';
import { fromDbDate } from '../../lib/date.js';
import { DIARY_MOODS } from './diary.schema.js';

const toMood = (mood: string | null) => DIARY_MOODS.find((candidate) => candidate === mood) ?? null;

export const toDiaryEntryResponse = (entry: DiaryEntry) => ({
  date: fromDbDate(entry.date),
  note: entry.note,
  starred: entry.starred,
  mood: toMood(entry.mood),
  togetherMoment: entry.togetherMoment,
  updatedAt: entry.updatedAt.toISOString(),
});
