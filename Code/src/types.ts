import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  // lastResult: Hypothesis[] | null;
  question: string | null;
  /* person: string | null;
  day: string | null;
  time: string | null;
  agree: Boolean | null;
  disagree: Boolean | null;
  change: string | null;
  info: string | null; */
  answer: string | null;
  next: boolean | null;
  count: number;
  place: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
