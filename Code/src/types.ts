import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null; // 
  person: any; //
  time: any; //
  date: any; //
  userInput: any; //
  // userUtterance: string; // Adiciona a nova propriedade corretamente tipada 
  // //Eu posso criar qualquer variable aqui e eu especifico se esse elemento existo no DM Context. Eu defino as chaves deste elemento e eu posso definor os tipos de casa um destes elementos.
  // criar uma variavel para cada pessoa, data, hora

}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };