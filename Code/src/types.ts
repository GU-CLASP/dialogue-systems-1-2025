import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  aPerson?: string | null;
  aDay?: string | null;
  aTime?: string | null;
  aFullDay? : boolean | null;
  aConfirm? :  boolean | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
