import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: nluResponse | null;
  plainResult: Hypothesis[] | null;
  confidenceResult: Hypothesis[] | null;
  confidence: boolean;
  meetingWith: string | null;
  meetingDay: string | null;
  meetingTime: string | null; 
  famousPerson: string | null;
  reprompt: number;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };

export interface nluResponse {
  topIntent: string;
  projectKind: string;
  intents: {category: string, confidenceScore: number}[];
  entities: {category: string, text: string, offset: number, confidenceScore: number}[];
}
