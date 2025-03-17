// Define the structure of recognized entities from Azure NLU
export interface RecognisedEntities {
    meetingTitle?: string;
    time?: string;
    personMeeting?: string;
    place?: string;
    meetingDay?: string;
    famousPerson?: string;
  }
  
  export interface DMContext {
    spstRef: any;
    lastResult: {
      intent?: string;
      entities?: RecognisedEntities;
    } | null;
    selectedPerson?: string;
    selectedDay?: string;
    selectedTime?: string;
    userInput?: string;
  }
  
 
  export type DMEvents =
    | { type: "START" }
    | { type: "CLICK" }
    | { type: "SPEAK_COMPLETE" }
    | { type: "LISTEN_COMPLETE" }
    | { type: "EVENT" }
    | { type: "RECOGNISED"; data: { nluValue: { intent: string; entities: RecognisedEntities } } }
    | { type: "ASRTTS_READY" };
  