import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  confirmation?: Hypothesis[] | null;
  deny?: Hypothesis[] | null;
  person?: string | null;
  day: string | null;
  starttime?: string | null;
  endtime?: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
