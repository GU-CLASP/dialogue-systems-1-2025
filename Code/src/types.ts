import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  time?: string | null;
  person?: string | null;
  day?: string | null;
  personSaved?: boolean;
  timeSaved?: boolean;
  daySaved?: boolean;
  wholeDay?: boolean;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
