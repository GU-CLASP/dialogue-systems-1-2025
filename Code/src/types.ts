import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  personName: String | null;
  meetingDate: string | null;
  meetingTime: string | null;
  response: string | null;
  confirmationMessage: string | null;
}

export type DMEvents =
  | SpeechStateExternalEvent
  | { type: "CLICK" }
  | { type: "ASRTTS_READY" }
  | { type: "SPEAK_COMPLETE" }
  | { type: "RECOGNISED"; value: Hypothesis[] }
  | { type: "ASR_NOINPUT" }
  | { type: "LISTEN_COMPLETE" };
