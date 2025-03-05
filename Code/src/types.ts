import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  data_dict : {[key:string] : {utterance :string };
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
