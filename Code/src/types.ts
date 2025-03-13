import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface nluResponse {
  topIntent: string;
  projectKind: string;
  intents: {category: string, confidenceScore: number}[];
  entities: {category: string, text: string, offset: number, confidenceScore: number}[];
}


export interface DMContext {
  spstRef: AnyActorRef;
  // lastResult: Hypothesis[] | null ;
  lastResult: Hypothesis[] | string | nluResponse| null; // string type is supported now.


  person: string | null;
  day: string | null;
  time: string | null;
  confirmation: string | null;


  utterance: string | null;

}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };

