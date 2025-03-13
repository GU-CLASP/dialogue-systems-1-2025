import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

interface clue {letter: string, position: number}
export interface DMContext {
  spstRef: AnyActorRef;
  lastResult?: string | null;
  wordToFind?: string | null;
  givenAnswer?: string | null;
  clues?: clue[] | null;
  language?: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
