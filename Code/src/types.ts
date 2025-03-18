import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface Entity { // This is the type of the entities array in the NLUObject. 
  category: string;
  text: string;
  confidenceScore: number;
  offset: number;
  length: number;
}

export interface Intent { // This is the type of the intents array in the NLUObject.
  category: string;
  confidenceScore: number;
}

export interface NLUObject { // This is the type of the interpretation in the DMContext.
  entities: Entity[];
  intents: Intent[];
  projectKind: string;
  topIntent: string;
}


export interface DMContext { // This is the type of the context in the DM machine.
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  confirm: boolean | null;
  Person: string | null;
  Day: string | null;
  Hour: string | null;
  interpreatation: NLUObject | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
