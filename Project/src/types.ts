import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface Intent {
  category: string;
  confidenceScore: number;
}

export interface Entity {
  category: string;
  text: string;
  confidenceScore: number;
  offset: number;
  length: number;
}

export interface NLUObject {
  entities : Entity[];
  intents: Intent[];
  projectKind: string;
  topIntent: string;
}

export interface room {
  idx : number,
  name : string,
  preposition : string,
  coord : [number, number],
  n : number,
  s : number,
  e : number,
  w : number,
  catDirection : string | null,
  person: string | null,
}

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  interpretation: NLUObject | null;
  dir : string | null;
  place : string | null;
  catColor: string | null;
  catEyeColor: string | null;
  catAccessory: string | null;
  currentRoom: room | null;
  greeting: string;
  intentAsking: string;
  catAsking: string;
  confirmation: string;
  goodBye: string;
  noAnswerCount: number;
  visitedRooms: Set<number>;
  imageSource: string | null;
  menu: Boolean;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
