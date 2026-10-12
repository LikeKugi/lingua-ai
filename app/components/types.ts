import type { BlankSegment, TaskType } from "../lib";
import { isPasteBlankTask, isSentenceTask, isTestTask, isWordsTask } from "../lib";

export type Draft = {
  taskType: TaskType;
  words: string[];
  wordsDescription: string;
  sentence: string;
  blankTask: BlankSegment[];
  testText: string;
  testVariants: string[];
  userAnswer: string;
  correctAnswer: string;
};

export function isDraftWords(draft: Draft): draft is Draft & { taskType: "words" } {
  return isWordsTask(draft.taskType);
}

export function isDraftSentence(draft: Draft): draft is Draft & { taskType: "sentence" } {
  return isSentenceTask(draft.taskType);
}

export function isDraftPasteBlank(draft: Draft): draft is Draft & { taskType: "paste-blank" } {
  return isPasteBlankTask(draft.taskType);
}

export function isDraftTest(draft: Draft): draft is Draft & { taskType: "test" } {
  return isTestTask(draft.taskType);
}

export type Toast = { text: string; kind: "success" | "error" | "info" };
