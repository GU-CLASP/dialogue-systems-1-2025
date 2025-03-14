import { assign, createActor, setup } from "xstate";
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
  info?: string;
  person?: string;
  day?: string;
  time?: string;
  agree?: boolean;
  disagree?: boolean;
  appointment?: boolean;
}

const grammar: { [index: string]: GrammarEntry } = {
  "dolly parton": {info: "Dolly Rebecca Parton (born January 19, 1946) is an American country music singer."},            
  "taylor swift": {info: "Taylor Alison Swift (born December 13, 1989) is an American singer, following a career mostly in country and pop music."},
  "emma watson": {info: "Emma Charlotte Duerre Watson (born April 15, 1990) is an English actress, mostly known for her role as Hermione Granger in the Harry Potter movie series."},
  "ryan gosling": {info: "Ryan Thomas Gosling (born November 12, 1980) is a Canadian actor, mostly known for his roles in drama/romantic movies."},
  "keira knightley": {info: "Keira Christina Knightley (born March 26, 1985) is an English actress, known for her roles in a variety of adventure, drama and period piece movies."},
  "noam chomsky": {info: "Avram Noam Chomsky (born December 7, 1928) is an American linguist, political activist, and philosopher."},
  appointment: {appointment:true},
//note: I have kept the values of positive and negative answer in my grammar, instead of having entities for them, because the model was encountering problems recognizing those entities  
  sure : {agree:true},
  yes : {agree:true},
  good : {agree:true},
  no : {disagree:true},
  negative: {disagree:true}
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function posiveAnswer(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).agree; 
}
  
function negativeAnswer(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).disagree; 
} 

function getCelebrityInfo(utterance: string) {                                                
  return (grammar[utterance.toLowerCase()]|| {}).info;
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
    lastResult: null,
    person: null,
    day: null,
    time: null,
    agree: null,
    disagree: null,
    change: null,
    info:null,
    appointment:null,
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
          entry: { type: "spst.speak", params: { utterance: `Hello there!` } },
          on: { SPEAK_COMPLETE: "Intent" },
        },
        Intent: {
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED:[
                {
                guard: ({event}) => event.nluValue.topIntent === "CreateAppointment",
                actions: assign({ appointment:true }) 
                },
                {
                guard: ({event}) => event.nluValue.topIntent === "FindX", // && isInGrammar(event.nluValue.entities[0].text),
                actions: assign(({ event }) => {
                  return { info: getCelebrityInfo(event.nluValue.entities[0].text)};
                }),
                }], 
                LISTEN_COMPLETE: [
                  {
                  guard: ({ context }) => context.appointment !=null,
                  target: "Who"
                  }, 
                  {
                  guard: ({ context }) => context.info !=null,
                  target: "GetCelebrity",
                  },
                  {target: "Prompt"}
                ],
                ASR_NOINPUT: {
                  actions: assign({ info: null }),
                },
              },
        },
        GetCelebrity: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
             utterance: `${context.info}`,
            }),
            },  
            on: { SPEAK_COMPLETE: "Done"},
        },
        Who: {
          entry: { type: "spst.speak",
          params: { utterance: `Who are you meeting with?` } },
          on: { SPEAK_COMPLETE: "GetPerson"},
        },
        GetPerson: {
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED:{
                  actions:
                  assign({person: ({event}) => event.nluValue.entities[0].text
                  }),
                },
                LISTEN_COMPLETE: [
                  {
                  guard: ({ context }) => context.day!=null,
                  target: "HowLong",
                  },
                  {target: "WhenD"}
                ],
                ASR_NOINPUT: {
                  actions: assign({ day: null }),
                },
              },
      },
        WhenD: {
            entry: { type: "spst.speak",
            params: { utterance: `On which day is your meeting?` } },
            on: { SPEAK_COMPLETE: "GetDay"},
        },
        GetDay:{
          entry: { type: "spst.listen" },
              on: {
                RECOGNISED: {
                  actions:
                assign({day: ({event}) => event.nluValue.entities[0].text
                }),
                  },
                  LISTEN_COMPLETE: [
                    {
                    guard: ({ context }) => context.day!=null,
                    target: "HowLong",
                    },
                    {target: "WhenD"}
                  ],
                  ASR_NOINPUT: {
                    actions: assign({ day: null }),
                  },
                },
        },
        HowLong: {                                                                                       
              entry: { type: "spst.speak",
              params: { utterance: `Will it take the whole day?` } },
              on: { SPEAK_COMPLETE: "GetAnswer"},
        },
        GetAnswer: {
              entry: { type: "spst.listen" },
                  on: {
                    RECOGNISED:  {
                        guard: ({event}) => isInGrammar(event.value[0].utterance),
                        actions: assign(({ event }) => {
                           return { agree: posiveAnswer(event.value[0].utterance),
                                    disagree: negativeAnswer(event.value[0].utterance)};
                    }),
                    },
                       LISTEN_COMPLETE: [
                        {
                        guard: ({ context }) => context.agree==null && context.disagree==null,
                        target: "HowLong",
                        },
                        {
                        guard: ({ context }) => context.disagree==true,
                        target: "WhenT",
                        },
                        {
                        guard: ({ context }) => context.agree==true,
                        target: "LastCheck",
                        }
                      ],              
                      ASR_NOINPUT: {
                        actions: assign({ agree: null, disagree: null }),
                      },
                    },
       },
       WhenT: {
          entry: { type: "spst.speak" ,
          params: { utterance: `What time is your meeting?` } },
          on: { SPEAK_COMPLETE: "GetTime"},
       },
       GetTime: {
        entry: { type: "spst.listen" },
            on: {
              RECOGNISED: {
                actions:
                assign({time: ({event}) => event.nluValue.entities[0].text
                }),
             },
             LISTEN_COMPLETE: [
              {
              guard: ({ context }) => context.time!=null,
              target: "LastCheck",
              },
              {target: "WhenT"}
            ],
            ASR_NOINPUT: {
              actions: assign({ time: null }),
            },
          },
       },                 
       LastCheck: {
        entry: {
          type: "spst.speak",
          params: ({ context }) => ({
           utterance: `Do you want me to create an appointment with ${context.person} on ${context.day} ${context.agree ? "for the whole day" : `at ${context.time}`}?`,
          }),
          },
          exit: assign({ agree: null, disagree: null }),   
          on: { SPEAK_COMPLETE: "GetAnswer2"},
      },
      GetAnswer2: {
        entry: { type: "spst.listen" },
            on: {
              RECOGNISED: {
                guard: ({event}) => isInGrammar(event.value[0].utterance),
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
