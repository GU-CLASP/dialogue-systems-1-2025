import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface clue {letter: string, position: number}
export interface connection { [word: string]: clue }
export interface definition { [language: string]: string }
export interface puzzle { [word: string]: {definition: definition, connections: connection, location: string, across: boolean }}
export interface DMContext {
  spstRef: AnyActorRef;
  language?: string| null;
  level?: string | null;
  words?: puzzle | null;
  lastResult?: any | null;
  wordToFind?: string | null;
  givenAnswer?: string | null;
  clues?: clue[] | null;
  
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
