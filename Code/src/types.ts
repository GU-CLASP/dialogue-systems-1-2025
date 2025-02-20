import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  meetingWith: string | null;  
  meetingDay: string | null; 
  meetingTime: string | null;
  beeninWith: boolean;
  beeninDay: boolean;
  beeninTime: boolean;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
