// Define the structure of recognized entities from Azure NLU
export interface RecognizedEntities {
  meeting_title?: string;
  meeting_time?: string;
  participant_name?: string;
  meeting_location?: any;
  person_name?: string;
}

// Define the structure of the dialog manager context
export interface DMContext {
  spstRef: any; // Reference to SpeechState actor
  lastResult: {
    intent?: string;
    entities?: RecognizedEntities;
  } | null;
  selectedPerson?: string;
  selectedDay?: string;
  selectedTime?: string;
  userInput?: string;
}

// Define event types that can be sent to the state machine
export type DMEvents =
  | { type: "START" }
  | { type: "CLICK" }
  | { type: "SPEAK_COMPLETE" }
  | { type: "LISTEN_COMPLETE" }
  | { type: "RECOGNISED"; data: { nluValue: { intent: string; entities: RecognizedEntities } } }
  | { type: "ASRTTS_READY" };
