import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  person: any;
  time: any;
  date: any;
  userInput: any;
  nextUtterance: string; // Keeping both properties
}

export type DMEvents = SpeechStateExternalEvent | 
  { type: "CLICK" } | 
  { type: "DONE" }; // Keeping both event types
