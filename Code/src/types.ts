import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  person: string | null | undefined;
  day: string | null | undefined;
  time: string | null | undefined;
  currentQuestion: boolean | null
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" } ;
