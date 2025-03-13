
import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | nluResponse | null;
  meetingWith: string;
  meetingDay: string | null;
  meetingTime: string | null;
  famousPerson: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" } ;
export interface Entity {
  
  category: string;
  text: string;
  offset: number;
  confidenceScore: number;  
}
export interface nluResponse {
  topIntent: string;
  projectKind: string;
  intents:{ category: string, confidenceScore: number} [];
  entities: Entity[];
}
