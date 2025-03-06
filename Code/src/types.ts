import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;

  person: string | null;
  day: string | null;
  time: string | null;
  isFullDay: boolean | null;
  nextUtterance: string;

}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" } | {type: "DONE"};
