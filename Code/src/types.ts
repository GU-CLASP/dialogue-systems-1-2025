import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: nluResponse | null;
  time?: string | null;
  person?: string | null;
  day?: string | null;
  personSaved?: boolean;
  timeSaved?: boolean;
  daySaved?: boolean;
  wholeDay?: boolean;
  whoPerson?: string | null;
}

export interface nluResponse {
  topIntent: string;
  projectKind: string;
  intents: intents[]
  entities: entities[]
}

export type entities = {
  category: string;
  confidenceScore: number;
  length: number;
  offset: number;
  text: string;
}

export type intents = {
  category: string;
  confidenceScore: number;
  length: number;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
