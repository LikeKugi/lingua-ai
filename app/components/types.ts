import type { BlankSegment, TaskType } from "../lib";

export type Draft = {
  taskType: TaskType;
  words: string[];
  sentence: string;
  blankTask: BlankSegment[];
  userAnswer: string;
  correctAnswer: string;
};

export function isDraftWords(draft: Draft): boolean {
  return draft.taskType === "words";
}

export function isDraftSentence(draft: Draft): boolean {
  return draft.taskType === "sentence";
}

export function isDraftPasteBlank(draft: Draft): boolean {
  return draft.taskType === "paste-blank";
}

export type Toast = { text: string; kind: "success" | "error" | "info" };
