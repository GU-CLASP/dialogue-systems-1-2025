import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

interface Appointment {
  person?: string;
  meetingDay?: string;
  meetingTime?: string;
  meetingDuration?: string;
}

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  demandedEntity?: string;
  slots?: any;
  currentAppointment?: Appointment;
  appointments?: any;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
