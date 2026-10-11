import type { TaskType } from "../lib";

export type Draft = {
  taskType: TaskType;
  words: string[];
  sentence: string;
  userAnswer: string;
  correctAnswer: string;
};

export function isDraftWords(draft: Draft): boolean {
  return draft.taskType === "words";
}

export function isDraftSentence(draft: Draft): boolean {
  return draft.taskType === "sentence";
}

export type Toast = { text: string; kind: "success" | "error" | "info" };
