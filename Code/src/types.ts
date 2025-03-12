import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  person: string;
  day: string;
  time: string;
  question: string;
  intent: string;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
