import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  personName: string | null;
  meetingDate: string | null;
  meetingTime: string | null;
  response: string | null;
  confirmationMessage: string | null;
}

// Assuming SpeechStateExternalEvent is defined or imported
export type DMEvents =
  | SpeechStateExternalEvent
  | { type: "CLICK" }
  | { type: "ASRTTS_READY" }
  | { type: "SPEAK_COMPLETE" }
  | { type: "RECOGNISED"; value: Hypothesis[] }
  | { type: "ASR_NOINPUT" }
  | { type: "LISTEN_COMPLETE" };
