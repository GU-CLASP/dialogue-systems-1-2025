import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  appointment: {
    name: string | null;
    date: string | null;
    time: string | null;
    wholeDay: boolean | null;
    confirmation: boolean | null;
  };
}

export type DMEvents = 
  |SpeechStateExternalEvent 
  | { type: "CLICK" }  
  | { type: "ASRTTS_READY"}
  | {type: "SPEAK_COMPLETE"}
  | {type: "RECOGNISED"; value: Hypothesis[]}
  | {type: "ASR_NOINPUT"}
  | {type: "LISTEN_COMPLETE"}
  | {type: "DONE"};
