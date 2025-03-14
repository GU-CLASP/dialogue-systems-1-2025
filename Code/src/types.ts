import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  person: string | null;
  day: string | null;
  time: string | null;
  agree: Boolean | null;
  disagree: Boolean | null;
  change: string | null;
  info: string | null;
  appointment: Boolean | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
