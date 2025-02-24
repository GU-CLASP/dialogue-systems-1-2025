import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  personName: string | null;
  meetingDate: string | null;
  meetingTime: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };