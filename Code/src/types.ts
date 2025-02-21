import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;

  person: Hypothesis[] | null;
  day: Hypothesis[] | null;
  wholeDay: Hypothesis[] | null;
  time: Hypothesis[] | null;
  response: Hypothesis[] | null;
  

}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };