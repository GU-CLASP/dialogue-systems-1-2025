import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
	
  Answer: Hypothesis[] | null;
  Location: Hypothesis[] | null;
  //location: string | null | undefined;
  Duration: Hypothesis[] | null;
  //duration: string | null | undefined;
  Week: Hypothesis[] | null;
  //week: string | null | undefined;
	//time: string | null | undefined;
	//day: string | null | undefined;
  //person: string | null | undefined;
  //answer: string | null | undefined;
  spstRef: AnyActorRef;
  Person: Hypothesis[] | null;
  Day: Hypothesis[] | null;
  Time: Hypothesis[] | null;
  Return_state: Hypothesis[] | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
