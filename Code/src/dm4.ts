import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents, Intent, Entity, NLUObject } from "./types";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint: //"https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
    "https://erkoo.cognitiveservices.azure.com/sts/v1.0/issuetoken", // insert your own endpoint
  key: KEY, // insert your own key in azure.ts
};

const azureLanguageCredentials = {
  endpoint: "https://erkk.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointment" /** your Azure CLU deployment */,
  projectName: "appointment" /** your Azure CLU project name */,
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

interface FamousPersonEntry {
  info: string;
}

const famousPersons : {[index : string] : FamousPersonEntry} = {
  "frank zappa" : {info: "frank zappa was a composer and guitarist who made awesome music in the 70s"},
  "robert fripp" : {info: "robert fripp is a guitarist and song writer, most famous for being the only constant member of the band King Crimson since the late 60s"},
}

// Search for entity of type entityType in the entityList, as given in interpretation
function getEntity(entityType: string, entityList : Entity[]){
  for (let e in entityList){
    if (entityList[e].category == entityType){
      return entityList[e].text.toLowerCase();
    }
  }
  return null;
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
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    interpretation: null,
    person: null,
    day: null,
    time: null,
  }),
  id: "DM",
  initial: "Prepare",
  
  on: {
    RECOGNISED: {
      actions: assign(({ event }) => {
        return { lastResult: event.value, interpretation: event.nluValue };
      }),
    },
    ASR_NOINPUT: {
      actions: assign({ lastResult: null, interpretation: null}),
    },
  },
  
  states: {

    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },

    WaitToStart: {
      on: { CLICK: "Menu" },
    },

    Menu : {
      initial: "InitialMessage",
      
      states: {
        InitialMessage: {
          entry: {type: "spst.speak", params: {utterance: `Hi! What can I help you with?`}},
          on: { SPEAK_COMPLETE: "GetIntent"}
        },
        GetIntent: {
          entry: { type: "spst.listen" },
            on: {
              
              LISTEN_COMPLETE: [
                {target: "#DM.AskAboutPerson", 
                  guard: ({context}) => !!context.interpretation && context.interpretation.topIntent == "AskAboutPerson",
                  actions: assign(({ context }) => {
                    return { person: getEntity("person", context.interpretation!.entities)}
                  })
                },
                {target: "#DM.Booking", 
                  guard: ({context}) => !!context.interpretation && context.interpretation.topIntent == "CreateMeeting",
                },
                {target: "NoResult"}
              ]
            }
        },
        NoResult: {
          entry: {type: "spst.speak",
            params: ({context}) => ({utterance: `${
              !!context.lastResult ? "I don't think I can do that for you." : "I did not hear you."}`})
          },
          on: {SPEAK_COMPLETE: "InitialMessage"},
        }
      }
    },

    AskAboutPerson: {
      entry: {type: "spst.speak", params: ({context}) => ({utterance: `${!!context.person && !!famousPersons[context.person] ? `${famousPersons[context.person].info}` : "Sorry, I don't know anything about that person."}`})},
      on: {SPEAK_COMPLETE: "Restart"}
    },

    Booking: {
      initial: "Who",
      states: {

        // Ask the user who to book the meeting with
        Who : {
          initial : "Prompt",
          states:{
            Prompt : {
              entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
              on: { SPEAK_COMPLETE: "HandleInput" },
            },
            HandleInput : {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.Day",
                    guard: ({ context }) => !!context.lastResult && !!context.interpretation && !!getEntity("person", context.interpretation!.entities),
                    actions: assign(({ context }) => {
                      return { person: getEntity("person", context.interpretation!.entities)}
                    })
                  },
                  // If last utterance cannot be parsed as a person, inform the user of this and let them speak again
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              // Depending on if the system recognized something at all, give a different response
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "That is not a person I know." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },
        
        // Ask the user for the day of the meeting
        Day : {
          initial: "Prompt",
          states : {
            Prompt : {
              entry: { type: "spst.speak", params: { utterance: `On which day is your meeting?` } },
              on: { SPEAK_COMPLETE: "HandleInput" },
            },
            HandleInput : {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.WholeDay",
                    guard: ({ context }) => !!context.lastResult && !!context.interpretation && !!getEntity("day", context.interpretation!.entities),
                    actions: assign(({ context }) => {
                      return { day: getEntity("day", context.interpretation!.entities)}
                    })
                  },
                  {
                    target: "DayAgain",
                  }
                ],
              },
            },
            DayAgain : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "That is not a day I know. Please specify a day of the week." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },

        // Ask the user if the meeting is the whole day or a specific time
        WholeDay : {
          initial: "Prompt",
          states: {
            Prompt : {
              entry: {type: "spst.speak", params: { utterance: `Will it take the whole day?`}},
              on: { SPEAK_COMPLETE: "HandleInput"}
            },
    
            HandleInput : {
              entry: {type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  // Go to Time or Confirm depending on if the answer is yes or no.
                  {
                    target: "#DM.Booking.Time",
                    guard: ({ context }) => !!context.interpretation?.entities && !!getEntity("no", context.interpretation!.entities)  //&& decisions[getEntity("decision", context.interpretation?.entities)!].decision == `no`,
                  },
                  {
                    target: "#DM.Booking.Confirm",
                    guard: ({ context }) => !!context.interpretation?.entities && !!getEntity("yes", context.interpretation!.entities) //&& decisions[getEntity("decision", context.interpretation?.entities)!].decision == `yes`,
                  },
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "I did not understand what you said." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },

        // Ask the user about the time of the meeting
        Time : {
          initial: "Prompt",
          states: {
            Prompt : {
              entry: {type: "spst.speak", params: {utterance: `What time is your meeting`}},
              on: {SPEAK_COMPLETE: "HandleInput"},
            },
    
            HandleInput : {
              entry: {type: "spst.listen"},
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.Confirm",
                    guard: ({ context }) => !!context.lastResult && !!context.interpretation && !!getEntity("time", context.interpretation!.entities),
                    actions: assign(({ context }) => {
                      return { time: getEntity("time", context.interpretation!.entities)}
                    })
                  },
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "I don't recognize that time." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },

        // Ask the user for confirmation, to finally "book" the meeting
        Confirm : {
          initial: "Prompt",
          states: {
            Prompt : {
              entry: {
                type: "spst.speak", 
                params: ({ context }) => ({
                  utterance: `Do you want me to create an appointment with ${context.person} on ${context.day} ${!!context.time ? "at " + context.time : "for the whole day"}?`,
                }),
              },
              on : {SPEAK_COMPLETE: "HandleInput"},
            },
            HandleInput : {
              entry: {type: "spst.listen"},
              on: {
                LISTEN_COMPLETE: [
                  // Start over if the user is not happy.
                  {
                    target: "StartOver",
                    guard: ({ context }) => !!context.interpretation?.entities && !!getEntity("no", context.interpretation?.entities) //&& decisions[getEntity("decision", context.interpretation?.entities)!].decision == `no`,
                  },
                  // If the user says yes, go to Done
                  {
                    target: "#DM.Booking.Done",
                    guard: ({ context }) => !!context.interpretation?.entities && !!getEntity("yes", context.interpretation?.entities) //&& decisions[getEntity("decision", context.interpretation?.entities)!].decision == `yes`,
                  },
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "I did not understand what you just said." : "I cannot hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
            StartOver: {
              entry: {type: "spst.speak", params: {utterance: `Alright.`}},
              on: {SPEAK_COMPLETE: {
                target: "#DM.Menu",
                actions: assign({ time: null, person: null, day: null}),
                }
              }
            },
          }
        },

        Done : {
          entry: {type: "spst.speak", params: {utterance: `Your appointment has been created!`}},
          // If the button is clicked, make a new appointment
          on : {
            CLICK: {
                target: "#DM.Menu",
                actions: assign({ time: null, person: null, day: null}),
              }
          }
        }
      },
    },

    Restart: {
      on: {CLICK: {
        target : "Menu",
        actions: assign({ time : null, person : null, day : null})
      }
      }
    }

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
