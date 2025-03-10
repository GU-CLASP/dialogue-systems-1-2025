import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: nluResponse | null;
  meetingWith: string | null;
  meetingDay: string | null;
  meetingTime: string | null;
  famousPerson: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };

export interface nluResponse {
  topIntent: string;
  projectKind: string;
  intents: {category: string, confidenceScore: number}[];
  entities: {category: string, text: string, offset: number, confidenceScore: number}[];
}
