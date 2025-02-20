import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  meetingWith: string | null;  
  meetingDay: string | null; 
  meetingTime: string | null;
  beeninWith: boolean;
  beeninTime: boolean;
  beeninDay: boolean;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
