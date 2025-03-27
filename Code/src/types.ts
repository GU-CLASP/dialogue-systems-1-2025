import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: string;
  intent: any,
  confirmation?: Hypothesis[] | null;
  deny?: Hypothesis[] | null;
  person: string;
  day: string | null;
  time?: string | null;
  isWholeDay: boolean,
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
