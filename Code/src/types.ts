import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";
/* import { clue, connection, definition, puzzle } from "dm_project" */

interface clue {letter: string, position: number}
interface connection { [word: string]: clue }
interface definition { [language: string]: string }
interface puzzle { [word: string]: {definition: definition, connections: connection, location: string, across: boolean }}
export interface DMContext {
  spstRef: AnyActorRef;
  language?: string | null;
  level?: string | null;
  words?: puzzle | null;
  lastResult?: string | null;
  wordToFind?: string | null;
  givenAnswer?: string | null;
  clues?: clue[] | null;
  
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
