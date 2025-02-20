import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;

  appointment: {
    person: string | null;
    day: string | null;
    time: string | null;
    confirmation: string | null;
    // confirmation2: string | null; // Whether the information for meeting is right
  };
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
