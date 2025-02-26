import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  appdata: {
    person: string | null;
    day: string | null;
    time: string | null;
    confirmation: string | null;
    person_confirmed: string | null;
    day_confirmed: string | null;
    time_confirmed: string | null;
  }
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
