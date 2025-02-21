import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  //name of the person who 
  meetingPartnerName: string | null; 
  //day of the meeting
  meetingDay: string | null;   
  //time of the meeting    
  meetingTime: string | null; 
  //whole day
  wholeDayAppointment: boolean;     
  //confirmation
  finalDecision: boolean;          
}


export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
