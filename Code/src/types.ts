import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult?: Hypothesis[] | null;
  person_reply?: Hypothesis[] | null;
  day_reply?: Hypothesis[] | null;
  time_reply?: Hypothesis[] | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
