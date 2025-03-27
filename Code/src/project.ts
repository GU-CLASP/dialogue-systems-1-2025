import { Actor, assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { NLU_KEY } from "./azure";
import { DMContext, DMEvents } from "./types";


const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
  };

const azureLanguageCredentials = {
    endpoint: "https://language-nerds-88.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview"      /** Azure CLU prediction URL */,
    key: NLU_KEY,                                                              /** Azure CLU key */
    deploymentName: "game",                                            /** Azure CLU deployment */
    projectName: "guessing_game",                                               /** Azure CLU project name */
  };
  

const settings = {
    azureLanguageCredentials: azureLanguageCredentials /** global activation of NLU */,
    azureCredentials: azureCredentials,
    azureRegion: "northeurope",
    asrDefaultCompleteTimeout: 0,
    asrDefaultNoInputTimeout: 5000,
    locale: "en-US",
    ttsDefaultVoice: "en-US-DavisNeural",
  };
          
interface GrammarEntry {
  [index: string]: string,
 }

type grammar= {
 [index: string]: GrammarEntry
}

//context: hospital
const hospital: grammar = {
  "person 6" : {answer: 'person 6'},
  "6" : {answer: "6"},
  person1 : {safety:'essentially', work: 'yes', stress: 'most probably', orders: 'often yes', collaboration: 'often', amusement: 'no', health:'essentially', creative: "it's not the most important"},  //doctor
  person2 : {safety:'yes', work: 'yes', stress: 'yes', orders: 'mostly guidelines', collaboration: 'yes', amusement: 'no', health: 'obligatorily, yes', creative: "not importantly"},      //nurse
  person3 : {safety:'yes', work: 'yes', stress: 'most probably', orders: 'no', collaboration: 'yes', amusement: 'no', health:"yes, it's important", creative: "no"},     //intern
  person4 : {safety:'no', work: 'no', stress: 'often', orders: 'no', collaboration: 'sometimes', amusement: 'no', health:'yes', creative: 'no'},        //patient
  person5 : {safety:'no', work: 'no', stress: 'likely', orders: 'no', collaboration: 'no', amusement: 'no', health:'yes', creative: 'no'},              //visitor
  person6 : {safety:'no', work: 'yes', stress: 'maybe', orders: 'no', collaboration: 'most probably', amusement: 'yes', health:'not the most important thing', creative: 'yes'},     //intruder: e.g. acrobat
  place : {place: "hospital"}
 };

 //context: theater
const theater: grammar = {
  "person 3" : {answer: 'person 3'},
  "3" : {answer: "3"},
  person1 : {safety:'no', work: 'yes', stress: 'probably', orders: 'no', collaboration: 'most often', amusement: 'yes', health:"it's not that important", creative: "it's important"},         //actress
  person2 : {safety:'no', work: 'no', stress: 'no', orders: 'no', collaboration: 'no', amusement: 'yes', health: "I wouldn't say so", creative: "mmm"},                        //spectator
  person3 : {safety:'yes', work: 'yes', stress: 'very often', orders: 'yes', collaboration: 'in a sense', amusement: 'no', health:'no', creative: "no"},           //intruder: e.g. pilot
  person4 : {safety:'yes', work: 'yes', stress: 'maybe', orders: 'sometimes', collaboration: 'perhaps', amusement: 'yes', health:'no', creative: "mmm"},       //guard
  person5 : {safety:'no', work: 'yes', stress: 'maybe', orders: 'no', collaboration: 'no', amusement: 'yes', health:"no, it's not important", creative: "mmm"},                    //ticket salesperson
  person6 : {safety:'no', work: 'yes', stress: "I would't say so", orders: 'no', collaboration: 'in a sense', amusement: 'yes', health:"no", creative: "mmm"},   //usher
  place : {place: "theater"}
 };

  //context: police station
 const police_station: grammar = {
  "person 1" : {answer: 'person 1'},
  "1" : {answer: "1"},
  person1 : {safety:'no', work: 'yes', stress: "I wouldn't say so", orders: 'no', collaboration: 'sometimes', amusement: 'maybe', health:"not importantly", creative: "maybe?"},   //intruder: e.g. street vendor
  person2 : {safety:'yes', work: 'yes', stress: 'maybe', orders: 'sometimes', collaboration: 'often', amusement: 'no', health:"no", creative: "no"},           //policeman
  person3 : {safety:'no', work: 'no', stress: 'surely', orders: 'no', collaboration: 'maybe', amusement: 'no', health:"no", creative: "certainly not"},                      //victim
  person4 : {safety:'no', work: 'yes', stress: 'probably not', orders: 'no', collaboration: 'perhaps', amusement: 'no', health:"no, it's not important", creative: "no"},          //secretary
  person5 : {safety:'no', work: 'no', stress: 'sometimes', orders: 'no', collaboration: 'no', amusement: 'no', health:'no', creative: "not at all"},                    //civilian
  person6 : {safety:'no', work: 'no', stress: 'probably', orders: 'most probably', collaboration: 'in a sense', amusement: 'no', health:'huh, no', creative: "for sure not"},    //arrested person
  place: {place: "police station"}
 };


var contexts:grammar[] = [hospital,theater,police_station]
let current_context: number=Math.floor(Math.random() * 3);
var person_n:GrammarEntry[] = [contexts[current_context].person1, contexts[current_context]?.person2, contexts[current_context].person3, contexts[current_context].person4, contexts[current_context].person5, contexts[current_context].person6]

function isInGrammar(entity: string | null, context:DMContext) {        
  if (entity != null){
    var person = person_n[context.count];
    return entity.toLowerCase() in person
 } else {
  return false
 }
}

function getAnswer(nlu_entity: string | null, context:DMContext) { 
  if (nlu_entity != null){               
  return (person_n[context.count][nlu_entity.toLowerCase()] || "");
} else {
  return "oops"
 }
}

function getGuess(utterance: string | null) {
  if (utterance != null){
  return ((contexts[current_context][utterance.toLowerCase()] || {}).answer);
} else {
  return "oops"
 }
}


const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    "spst.speak": ({ context }, params: { utterance: string }) =>
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
        },
      }),
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
        // completeTimeout: 8000,
        value: { nlu: true }
      }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBECyA6ACgJzABwENcBiAQQGUAlAFWvIH1KBRU5ATQG0AGAXUVDwB7WAEsALiMEA7fiAAeiAIwBOAGzo1XZQGYVAdgBMyg4e0AaEAE9EAFh3ouNgzb03tAVgMqDqgL6+LNHQAdQJxakFyMSIxYgBhABkASTiAaW4+JBAhUQlpWQUEOz10VT09LnctZWVFRU8LayL7R2dXDy9jPwCQIIBxXDAJKShiZPJqJgA5ejiAeVRMBKZJjNkc8UkZLMLi0vLK6tr6g0bEAA5FdG0DIwN3ZXPlPXOHvX9AjAGwIZERsaSE2mswWSxWTA4ikyAmEm3yO0QqjspW0XHuim0enc7lUinOZwQOO01wMaK4em0uhsXEU7x6-UGwygWGwggAtnhYuRMCxUiDFstVrx1rC8ttQIU6pT0Dj7tpVDpzk9XATVKpzqUVOqFRU9Ipup90N9fiN0FNBEkpHgAK5cnmkPnzAXgtZZDZigpKDHE2XueWK5U2AlEklkilUml0w3GpkhAAWgmI3N5-LBQuh2VFW09CHqXGJBkxlQxPi4aPMVkQ7he1wqilJqkcqlJ5w+vS+jL+zL6Q0wYGwsGkxGY8z6U0BTGQrphuWzCNzFXU6OpelqVQeBJs6vQ5xp7hcHhsSvcbYZP1jPbEfYHQ4olHoUzmSSmmAAqtRp5nZ-CJUo6+g7FuJ5cS3NxFAJTEDAAnx9wpV4sRcA12yNTtTUva9BykYhpE-d051-BdqQcRsyy4JVUW0c5VAg25NWpalXgY55Tw7c8u3jMApGQJN7UdUFBQhYU3SzH95EQZQXE1UltBsLUdDqAlvRKQ562UHF6j1Vt6VYk1uyGZACEsYcmFHcdyEnXCRPFMTc3qK4XBMUlPCAv1FNuEoj3qIk6nOeUWJQti0P0wyyCoB8nxfd9LO-azJUULd0D1eU0VuPEdUUjErkULhVGxVQZJMSoo2QmN2MvAyjJwoSZzhWKvVedADEuXQZOUNFcvAytczIq4jHox46kcHL-NK00AAlBAAdwSaRRmTB1UwE6LapzCSSlxaTZLUeTOqaR4bHQPFzluGoqMqAwRtQvSxFIKRYEm-tjNMicp2qr8VvnOp3HswxDHOlyKyac5XE1Z5SPzWkkUuwLrtu+7HrvcLnzfD83rw0S4oSpLG1uLwqOeAlyg1ZwXFImSmwu7SAt0o0hjhh7sGwqRlo9T68XcRrmoxOx2u+wmmoAm4VA8ctLkUaGaeCONOOoHiUydNNBIzdG6oQNapPzLaFV0XbbDVRr4sorEctk1EkLPGnL2oEQ2TAJ65jHF6Wfwmyvp+xz-qa1yuo8dQkXceDPA8TEbAli8hmt23QvvR9kaitGrJzOosYxHHUvxvQCVLRqKkD-cV3isOyojm27aq5XE7Zhqmsy1red1hAvC4ACA48bL3KcMii9NUhYAAa3tx3zNeiuYpzQwoP1HQnNJjrCZUGVySS3zOgVbvmV7gfEdjyLUdHj6CL1Dz25SrckR0VVC0Om5l-ynL1X8uJpYAYz7gYCDZNkiDlhaFaWhOx7zlklBTwZEbDAPJvcYMbUdyklJOGeKkZ-IJAILAMQT8wCvx-nxZ06YRSAIIrcA6ehGxOAbLSGkPhVQ4h3C1HElw1KUVDlTZA0g7aJBSOkABB8bLfRKMdTWmIbj5jKNQ9QvkMT0JUH6c4zCehSEEBAOAsg0D4J4YUAAtNRLqGiOY1H0eiPMdgcT+RwPgIgYA1GswIk4TcCpEqPEeOUR48pdwnipqEcIkRojYDEFYl2hR5QHS3FoOoXtjokM3PYaSTwbB+gxJUZh0Yrr+IxoiGkKI0TfUxHlPEbliSSLcPcLwcSvrrxZOyTkqTVbqw2prOSOtVRxNrM2Mssl1S1CSSVK6ZoLRWltNU1akk6kyQaQpLq+5m7kjKPA8o1Y9TlKloIQZn1hEARIc2LobgaTBmxIdHw+VqRVFXM2cp6F+yYRWQRKezc7KGw6kc-EEyKiHRIbBG41ITiLOllxK5NksTKB3N9DakiTqZy6rXHc99tlLxcF0i24cxAVT+XFDwtZnC+iojcU4EKbgaleLlWUu41D5XKRNaas0UWIABUC-U9ZQVGHBXtRsGhwHtCKe5c2OlEX037FS2yaLIJxObAHfKtwCTPD0RJBUNRTA5XcckmGHEpDUH5TS14dKvAdEZZuJwGhc7JWco8Ll1NEWR0scJAhrtJHouFfcLF4qupxI1GSeCgE1QkO0OUzeaqcrETakS0ZOKgakh3BEjEu4SwUkfi-N+2AP5f2wPyohiVSG3ByhQ+s2imjYiuNrHE5JHCuDsMg1B6DY38tsV1fKPpgZuPlPuZw-lWFSAtTVaxNlZJ5tcN9NwwNspHmzYiGhNQjDZX3DJVc-h-BAA */
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    next:null,
    answer:null,
    question:null,
    count: 0,
    place: contexts[current_context].place.place
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      on: { CLICK: "Greeting" },
    },
    Greeting: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { type: "spst.speak", 
            params: { utterance: `Welcome to the "Guess the intruder" game! Ask Person 1 your first question!` } },     
          on: { SPEAK_COMPLETE: "AskPerson" },
        },
        AskPerson: {
          entry: { type: "spst.listen" },
          exit: assign({ next: null }),
              on: {
                RECOGNISED:[
                {
                guard: ({event, context}) => event.value[0].utterance.toLowerCase() === "next" && context.count===5,
                actions: assign({ count: 0, next: true}),
                },
                { 
                guard: ({event, context}) => event.value[0].utterance.toLowerCase() === "next" && context.count<5, 
                actions: assign({count: ({ context }) => context.count + 1, next:true}),
                },                                         
                {
                guard: ({event}) => event.nluValue?.entities?.[0]?.category === "guess",
                actions: assign({ next: false })
                },
                {
                  actions: assign(({ event }) => ({
                    question: event.nluValue?.entities?.[0]?.category || "no entity"
                  })),
                },
              ], 
              LISTEN_COMPLETE: [
                {
                guard: ({ context }) => context.next===true,
                target: "NextConfirmation"                                                      
                },
                {
                guard: ({ context }) => context.next===false,
                target: "Guess"                                                      
                }, 
                {
                guard: ({ context }) => context.question==="no entity",
                target: "CheckGrammar"
                },
                {
                guard: ({ context }) => context.question!=null,
                target: "AnswerPerson" 
                },
                {
                guard: ({ context }) => context.question===null,
                target: "NoInput"
                }
              ],
                ASR_NOINPUT: {
                  actions: assign({ question: null }),
                },
              },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Sorry, I didn't hear you. Please repeat.` },
          },
          on: { SPEAK_COMPLETE: "AskPerson" },
        },
        CheckGrammar: {                                                                  
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `${isInGrammar(context.question, context) ? " " : "I don't know how to answer this. Please ask something else."}`,
            }),
          },
          on: { SPEAK_COMPLETE: {target:"AskPerson"} ,                                 
        }},                                                                                                                                       
        AnswerPerson: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
             utterance: `${getAnswer(context.question, context)}`,
            }),
            },  
            on: { SPEAK_COMPLETE: "AskPerson"},
        },
        NextConfirmation:{
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `You are now asking person ${context.count+1}.`,                        
            }),
            },
            on: { SPEAK_COMPLETE: "AskPerson"},    
        },                                                                  
       Guess: {
        entry: {
          type: "spst.speak",
          params: { utterance: `Say the person you've guessed` } },
          on: { SPEAK_COMPLETE: "GetGuess"},
      },
      GetGuess: {
        entry: { type: "spst.listen" },
        exit: assign({ next: false }),
            on: {
              RECOGNISED: {
              actions: assign(({ event }) => {
              return { answer: event.value[0].utterance};     
            }),
            },
            LISTEN_COMPLETE: [
              {
              guard: ({ context }) => context.answer != null,
              target: "Congrats",
              },
              {
              target: "Guess",
              },  
            ],
            ASR_NOINPUT: {
              actions: assign({ answer: null }),
            },
          },
      },
      Congrats: {                                                                                      
          entry: { type: "spst.speak",
            params: ({ context }) => ({
              utterance: `${getGuess(context.answer) ? "Congrats! You guessed correctly!" : "You lost! Better luck next time!"}`,             
            }),
          },
          on: { SPEAK_COMPLETE: "Done"},
      }, 
      Done: {
        on: {
          CLICK: "#DM.Greeting",
        },
      }, 
     },
    },
  },
  });


export const dmActor = createActor(dmMachine, {
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {
  console.group("State update");
  console.log("State value:", state.value);
  console.log("State context:", state.context);
  console.groupEnd();
});


export function setupPersonButton(element: HTMLButtonElement, currentCount:number) {
    if (currentCount+1 === Number(element.id)) {
      element.focus();
    } 
}

export function answer(element:HTMLParagraphElement, context:string | null, next:boolean | null) {                  
  if (next===false){
    if (context===element.id) {                 
      document.getElementById(element.id)!!.style.display="block";
      document.getElementById("personButtons")!!.style.display="none";
      document.getElementById("help")!!.style.display="none";                                                     
    }} else{document.getElementById(element.id)!!.style.display="none";}                                 
  }                                                                                                               
                                                                                                                  



