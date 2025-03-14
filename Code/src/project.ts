//GAME DESCRIPTION
/* Welcome to the "Guess the intruder" game! In this game, you'll have the chance to ask 6 people that are now in the same place about their role 
in this environment. Your goal is to guess which of these people does not belong in this environment. You can ask each person multiple questions, that 
will be answered with 'yes', 'no' or 'maybe'. Whenever you want to switch to ask the next person, just say: "next". Try to keep your questions the 
least pesonal as possible. For example, don't ask questions such as 'Do you like what you're doing?'; But you can ask if what they're doing is stressful  
or if where they are is a happy place or not. Good luck and enjoy! 
EXAMPLE BELOW:
.....................................................
*/

/* Welcome to the "Guess the context" game! In this game, you'll have the chance to ask 5 people that are now in the same place about their role 
in this environment. Your goal is to guess the place where these people are in. You can ask each person multiple questions, that will be answered with 
'yes', 'no' or 'maybe'. Whenever you want to switch to ask the next person, just say: "next". Try to keep your questions the least pesonal as possible. 
For example, don't ask questions such as 'Do you like what you're doing?'; But you can ask if what they're doing is stressfull or if where they are is 
a happy place or not. Good luck and enjoy! 
EXAMPLE BELOW:
.....................................................
*/


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
    endpoint: "https://language-nerds-88.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview"      /** your Azure CLU prediction URL */,
    key: NLU_KEY,                                                              /** reference to your Azure CLU key */
    deploymentName: "appointment",                                            /** your Azure CLU deployment */
    projectName: "Appointment",                                               /** your Azure CLU project name */
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
  safety?: string,
  work?: string,
  stress?: string,
  next?: boolean
  answer?: boolean
 }

const grammar: { [index: string]: GrammarEntry } = {
  hospital : {answer: true},
  doctor : {safety:'yes', work: 'yes',},

  next : {next:true}                                    
 };

const grammar2: { [index: string]: GrammarEntry } = {
  theater : {answer: true},
  actor : {safety:'no', work: 'yes', stress: 'maybe',},

  next : {next:true}
 };

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar,    // ',' or '||' ??
    utterance.toLowerCase() in grammar2
 }

 function GetAnswer(utterance: string) {
  return utterance.toLowerCase() in grammar,    // ',' or '||' ??
    utterance.toLowerCase() in grammar2
 }


const dmMachine = setup({
  types: {
    /** you might need to extend these */
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    /** define your actions here */
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
        value: { nlu: true }
      }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBECyA6ACgJzABwENcBiAQQGUAlAFWvIH1KBRU5ATQG0AGAXUVDwB7WAEsALiMEA7fiAAeiAIwBOAGzo1XZQGYVAdgBMyg4e0AaEAE9EAFh3ouNgzb03tAVgMqDqgL6+LNHQAdQJxakFyMSIxYgBhABkASTiAaW4+JBAhUQlpWQUEOz10VT09LnctZWVFRU8LayL7R2dXDy9jPwCQIIBxXDAJKShiZPJqJgA5ejiAeVRMBKZJjNkc8UkZLMLi0vLK6tr6g0bEAA5FdG0DIwN3ZXPlPXOHvX9AjAGwIZERsaSE2mswWSxWTA4ikyAmEm3yO0QqjspW0XHuim0enc7lUinOZwQOO01wMaK4em0uhsXEU7x6-UGwygWGwggAtnhYuRMCxUiDFstVrx1rC8ttQIU6pT0Dj7tpVDpzk9XATVKpzqUVOqFRU9Ipup90N9fiN0FNBEkpHgAK5cnmkPnzAXgtZZDZigpKDHE2XueWK5U2AlEklkilUml0w3GpkhAAWgmI3N5-LBQuh2VFW09CHqXGJBkxlQxPi4aPMVkQ7he1wqilJqkcqlJ5w+vS+jL+zL6Q0wYGwsGkxGY8z6U0BTGQrphuWzCNzFXU6OpelqVQeBJs6vQ5xp7hcHhsSvcbYZP1jPbEfYHQ4olHoUzmSSmmAAqtRp5nZ-CJUo6+g7FuJ5cS3NxFAJTEDAAnx9wpV4sRcA12yNTtTUva9BykYhpE-d051-BdqQcRsyy4JVUW0c5VAg25NWpalXgY55Tw7c8u3jMApGQJN7UdUFBQhYU3SzH95EQZQXE1UltBsLUdDqAlvRKQ562UHF6j1Vt6VYk1uyGZACEsYcmFHcdyEnXCRPFMTc3qK4XBMUlPCAv1FNuEoj3qIk6nOeUWJQti0P0wyyCoB8nxfd9LO-azJUULd0D1eU0VuPEdUUjErkULhVGxVQZJMSoo2QmN2MvAyjJwoSZzhWKvVedADEuXQZOUNFcvAytczIq4jHox46kcHL-NK00AAlBAAdwSaRRmTB1UwE6LapzCSSlxaTZLUeTOqaR4bHQPFzluGoqMqAwRtQvSxFIKRYEm-tjNMicp2qr8VvnOp3HswxDHOlyKyac5XE1Z5SPzWkkUuwLrtu+7HrvcLnzfD83rw0S4oSpLG1uLwqOeAlyg1ZwXFImSmwu7SAt0o0hjhh7sGwqRlo9T68XcRrmoxOx2u+wmmoAm4VA8ctLkUaGaeCONOOoHiUydNNBIzdG6oQNapPzLaFV0XbbDVRr4sorEctk1EkLPGnL2oEQ2TAJ65jHF6Wfwmyvp+xz-qa1yuo8dQkXceDPA8TEbAli8hmt23QvvR9kaitGrJzOosYxHHUvxvQCVLRqKkD-cV3isOyojm27aq5XE7Zhqmsy1red1hAvC4ACA48bL3KcMii9NUhYAAa3tx3zNeiuYpzQwoP1HQnNJjrCZUGVySS3zOgVbvmV7gfEdjyLUdHj6CL1Dz25SrckR0VVC0Om5l-ynL1X8uJpYAYz7gYCDZNkiDlhaFaWhOx7zlklBTwZEbDAPJvcYMbUdyklJOGeKkZ-IJAILAMQT8wCvx-nxZ06YRSAIIrcA6ehGxOAbLSGkPhVQ4h3C1HElw1KUVDlTZA0g7aJBSOkABB8bLfRKMdTWmIbj5jKNQ9QvkMT0JUH6c4zCehSEEBAOAsg0D4J4YUAAtNRLqGiOY1H0eiPMdgcT+RwPgIgYA1GswIk4TcCpEqPEeOUR48pdwnipqEcIkRojYDEFYl2hR5QHS3FoOoXtjokM3PYaSTwbB+gxJUZh0Yrr+IxoiGkKI0TfUxHlPEbliSSLcPcLwcSvrrxZOyTkqTVbqw2prOSOtVRxNrM2Mssl1S1CSSVK6ZoLRWltNU1akk6kyQaQpLq+5m7kjKPA8o1Y9TlKloIQZn1hEARIc2LobgaTBmxIdHw+VqRVFXM2cp6F+yYRWQRKezc7KGw6kc-EEyKiHRIbBG41ITiLOllxK5NksTKB3N9DakiTqZy6rXHc99tlLxcF0i24cxAVT+XFDwtZnC+iojcU4EKbgaleLlWUu41D5XKRNaas0UWIABUC-U9ZQVGHBXtRsGhwHtCKe5c2OlEX037FS2yaLIJxObAHfKtwCTPD0RJBUNRTA5XcckmGHEpDUH5TS14dKvAdEZZuJwGhc7JWco8Ll1NEWR0scJAhrtJHouFfcLF4qupxI1GSeCgE1QkO0OUzeaqcrETakS0ZOKgakh3BEjEu4SwUkfi-N+2AP5f2wPyohiVSG3ByhQ+s2imjYiuNrHE5JHCuDsMg1B6DY38tsV1fKPpgZuPlPuZw-lWFSAtTVaxNlZJ5tcN9NwwNspHmzYiGhNQjDZX3DJVc-h-BAA */
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    //lastResult: null,
    answer: null,
    safety: null,
    work: null,
    stress: null,
    next: null
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
          entry: { type: "spst.speak", params: { utterance: `Welcome to the "Guess the intruder" game! Ask Person 1 your first question!` } },     //Welcome to the "Guess the context" game! Ask Person 1 your first question!
          on: { SPEAK_COMPLETE: "AskPerson1" },
        },
        AskPerson1: {
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED:[
                {
                guard: ({event}) => event.value[0].utterance === "next",
                actions: assign({ next:true })                                             //add grammar entries to types.ts
                },
                {
                actions: 
                assign({x: ({event}) => event.nluValue.entities[0].text
                  }),
                }], 
                LISTEN_COMPLETE: [
                  {
                  guard: ({ context }) => context.next !=null,
                  target: "NextConfirmation"                                                      
                  }, 
                  {
                  guard: ({ context }) => context.x !=null,
                  target: "AnswerPerson1",     ///NextConfirmation 
                  },
                  {target: "Prompt"}
                ],
                ASR_NOINPUT: {
                  actions: assign({ info: null }),
                },
              },
        },
        AnswerPerson1: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
             utterance: `${context.x}`,
            }),
            },  
            on: { SPEAK_COMPLETE: "AskPerson1"},
        },
        AskPerson2: {
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED:[
                {
                guard: ({event}) => event.value[0].utterance === "next",
                actions: assign({ next:true })                                             //add grammar entries to types.ts
                },
                {
                actions: 
                assign({x: ({event}) => event.nluValue.entities[0].text
                  }),
                }], 
                LISTEN_COMPLETE: [
                  {
                  guard: ({ context }) => context.next !=null,
                  target: "NextConfirmation"                                                      
                  }, 
                  {
                  guard: ({ context }) => context.x !=null,
                  target: "AnswerPerson2",     ///NextConfirmation 
                  },
                  {target: "Prompt"}
                ],
                ASR_NOINPUT: {
                  actions: assign({ info: null }),
                },
              },
        },
        AnswerPerson2: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
             utterance: `${context.x}`,
            }),
            },  
            on: { SPEAK_COMPLETE: "AskPerson2"},
        }, 
        AskPerson3: {
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED:[
                {
                guard: ({event}) => event.value[0].utterance === "next",
                actions: assign({ next:true })                                             //add grammar entries to types.ts
                },
                {
                actions: 
                assign({x: ({event}) => event.nluValue.entities[0].text
                  }),
                }], 
                LISTEN_COMPLETE: [
                  {
                  guard: ({ context }) => context.next !=null,
                  target: "NextConfirmation"                                                      
                  }, 
                  {
                  guard: ({ context }) => context.x !=null,
                  target: "AnswerPerson3",     ///NextConfirmation 
                  },
                  {target: "Prompt"}
                ],
                ASR_NOINPUT: {
                  actions: assign({ info: null }),
                },
              },
        },
        AnswerPerson3: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
             utterance: `${context.x}`,
            }),
            },  
            on: { SPEAK_COMPLETE: "AskPerson3"},
        },  
        AskPerson4: {
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED:[
                {
                guard: ({event}) => event.value[0].utterance === "next",
                actions: assign({ next:true })                                             //add grammar entries to types.ts
                },
                {
                actions: 
                assign({x: ({event}) => event.nluValue.entities[0].text
                  }),
                }], 
                LISTEN_COMPLETE: [
                  {
                  guard: ({ context }) => context.next !=null,
                  target: "NextConfirmation"                                                      
                  }, 
                  {
                  guard: ({ context }) => context.x !=null,
                  target: "AnswerPerson4",     ///NextConfirmation 
                  },
                  {target: "Prompt"}
                ],
                ASR_NOINPUT: {
                  actions: assign({ info: null }),
                },
              },
        },
        AnswerPerson4: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
             utterance: `${context.x}`,
            }),
            },  
            on: { SPEAK_COMPLETE: "AskPerson4"},
        },   
        AskPerson5: {
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED:[
                {
                guard: ({event}) => event.value[0].utterance === "next",
                actions: assign({ next:true })                                             //add grammar entries to types.ts
                },
                {
                actions: 
                assign({x: ({event}) => event.nluValue.entities[0].text
                  }),
                }], 
                LISTEN_COMPLETE: [
                  {
                  guard: ({ context }) => context.next !=null,
                  target: "NextConfirmation"                                                      
                  }, 
                  {
                  guard: ({ context }) => context.x !=null,
                  target: "AnswerPerson5",     ///NextConfirmation 
                  },
                  {target: "Prompt"}
                ],
                ASR_NOINPUT: {
                  actions: assign({ info: null }),
                },
              },
        },
        AnswerPerson5: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
             utterance: `${context.x}`,
            }),
            },  
            on: { SPEAK_COMPLETE: "AskPerson5"},
        },           
       Guess: {
        entry: {
          type: "spst.speak",
          params: { utterance: `Say the place you've guessed` } },
          on: { SPEAK_COMPLETE: "GetGuess"},
      },
      GetGuess: {
        entry: { type: "spst.listen" },
            on: {
              RECOGNISED: {
                guard: ({event}) => event.value[0].utterance===context.answer,
                actions: assign(({ event }) => {
                   return { agree: posiveAnswer(event.value[0].utterance),
                            disagree: negativeAnswer(event.value[0].utterance)};
            }),
            },
            LISTEN_COMPLETE: [
              {
              guard: ({ context }) => context.agree==null && context.disagree==null,
              target: "LastCheck",
              },
              {
              guard: ({ context }) => context.disagree != null,
              target: "Who",
              },  
              {target: "Confirmation"}
            ],
            ASR_NOINPUT: {
              actions: assign({ agree: null, disagree: null }),
            },
          },
      },
      Confirmation: {                                                                                      
          entry: { type: "spst.speak",
          params: { utterance: `Your appointment has been created.` } },
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

    

const dmActor = createActor(dmMachine, {
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {
  console.group("State update");
  console.log("State value:", state.value);
  console.log("State context:", state.context);
  console.groupEnd();
});

export function setupButton(element: HTMLButtonElement) {
  element.addEventListener("click", () => {
    dmActor.send({ type: "CLICK" });
  });
  dmActor.subscribe((snapshot) => {
    const meta: { view?: string } = Object.values(
      snapshot.context.spstRef.getSnapshot().getMeta(),
    )[0] || {
      view: undefined,
    };
    element.innerHTML = `${meta.view}`;
  });
}
