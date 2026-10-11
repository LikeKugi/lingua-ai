import type { TaskType } from "../lib";

export type Draft = {
  taskType: TaskType;
  words: string[];
  sentence: string;
  userAnswer: string;
  correctAnswer: string;
};

export type Toast = { text: string; kind: "success" | "error" | "info" };
