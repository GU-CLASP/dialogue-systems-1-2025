import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents, entities, intents, nluResponse } from "./types";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://dialoguesystems.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointment" /** your Azure CLU deployment */,
  projectName: "Lab4" /** your Azure CLU project name */,
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

function getEntities(array: entities[], context: DMContext) {
  let found = false
  for ( let i = 0; i < array.length; i++) {
    if (array[i]["category"]) {
      if (array[i]["category"] == "meetingPerson") {
        context.person = array[i]["text"]
        context.personSaved = true
        found = true
      }
      else if (array[i]["category"] == "meetingDay") {
        context.day = array[i]["text"]
        context.daySaved = true
        found = true
      }
      else if (array[i]["category"] == "meetingTime") {
        context.time = array[i]["text"]
        context.timeSaved = true
        found = true
      }
      else if (array[i]["category"] == "whoPerson") {
        context.whoPerson = array[i]["text"]
        found = true
      }
    };
  };
  return found
};

const FamousPeople = {
  "Jennifer Lawrence" : "a famous American actress known for her role in the Hunger Games trilogy",
  "Lucia": "an up and coming programmer from Italy",
  "Boris" : "just a guy",
  "Tyler Joseph" : "the lead vocalist and songwriter of the musical duo Twenty One Pilots",
  "Phoebe Bridgers" : "is a singer/song-writer known for her melancholic sound",
  "Anton": "unfortunately not in our database due to GDPR regulations"
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
        value: { nlu: true }
      }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
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
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckIntent",
            guard: ({ context }) => !!context.lastResult,
            actions: assign(({}) => {
              return { personSaved: false, timeSaved: false, daySaved: false, wholeDay: false, whoPerson: undefined}
            })
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Bonjour, how can I help you?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                console.log(event)
                return { lastResult: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    MeetingPerson: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckEntities",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Who would you like to meet?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    MeetingDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckEntities",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `On which day is your meeting?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    WholeDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "MeetingConfirm",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == 'Yes',
            actions: assign({
              timeSaved: true,
              wholeDay: true,
            }),
          },
          {
            target: "MeetingTime",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == 'No'
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Will the meeting take the whole day?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    MeetingTime: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckEntities",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `At what time is your meeting?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    MeetingConfirm: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "MeetingConfirmed",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] === 'Yes'
          },
          {
            target: "MeetingCancelled",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] === 'No'
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          initial: "a",
          on: { SPEAK_COMPLETE: "Ask" },

          states: {
            a: {
              always: [
                {
                target: "ConfirmWholeDay",
                guard: ({ context }) => !!context.wholeDay
              },
              {
                target: "Confirm",
                guard: ({ context }) => !context.wholeDay
              },
              ]
            },
            ConfirmWholeDay: {
              entry: { type: "spst.speak", params: ({ context }) => ({ 
                utterance: `So, you'd like to have a meeting with ${context.person} 
                on ${context.day} for the whole day?` })},
            },

            Confirm: {
              entry: { type: "spst.speak", params: ({ context }) => ({ 
                utterance: `So, you'd like to have a meeting with ${context.person} 
                on ${context.day} at ${context.time}?` 
              })},
            },
          },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    WhoIs: {
      initial: "b",
      on: { SPEAK_COMPLETE: "GiveInfo" },
      states: {
        b: {
          entry: {
          type: "spst.speak",
          params: { utterance: "" }
        }
      },
    },
  },
    GiveInfo: {
      always: [{ 
        guard: ({ context }) => !!context.whoPerson && !!FamousPeople[context.whoPerson],
        target: "Answer",
      },
      {
        guard: ({ context }) => !context.whoPerson || !FamousPeople[context.whoPerson],
        target: "NotFound",
      }
    ]    
    },
    Answer: {
      entry: { 
        type: "spst.speak", 
        params: ({ context }) => ({ 
          utterance: `${context.whoPerson} is ${FamousPeople[context.whoPerson]}` 
        })
      },
      on: {SPEAK_COMPLETE: "Done"}
    },
    NotFound: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `I'm sorry, I don't know who ${context.whoPerson} is.`
      }),
    },
    on: {SPEAK_COMPLETE: "Done"}
  },
    CheckIntent: {
      initial: "Prompt",
      on: {
        SPEAK_COMPLETE: [
          {
            guard: ({ context }) => context.lastResult!["topIntent"] == "CreateMeeting",
            target: "CheckEntities"
          },
          {
            guard: ({ context }) => context.lastResult!["topIntent"] == "WhoIs",
            target: "CheckPerson"
          }
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({
              utterance: "Hmm"
            }),
          },
        },
      },
    },
    CheckPerson: {
      entry: ({ context }) => {
        let found = getEntities(context.lastResult?.entities || [], context);
      },
      always: [
        {
          target: "Greeting",
          guard: ({ context }) => !context.whoPerson
      },
        {
          target: "WhoIs",
          guard: ({ context }) => !!context.whoPerson
        }]
    },
    CheckEntities: {
      entry: ({ context }) => {
        let found = getEntities(context.lastResult?.entities || [], context);
      },
      always: [
        { target: "MeetingPerson", guard: ({ context }) => !context.personSaved },
        { target: "MeetingDay", guard: ({ context }) => !context.daySaved },
        { target: "WholeDay", guard: ({ context }) => !context.timeSaved },
        { target: "MeetingTime", guard: ({ context }) => !context.timeSaved },
        { target: "MeetingConfirm" },
      ],
    },
    MeetingConfirmed: {
      entry: { type: "spst.speak", params: { utterance: "Appointment created!" }},
      on: { SPEAK_COMPLETE: "Done" },
    },

    MeetingCancelled: {
      entry: { type: "spst.speak", params: { utterance: "Appointment cancelled!" }},
      on: { SPEAK_COMPLETE: "Done" },
    },

    Done: {
      on: {
        CLICK: "WaitToStart"
      },
    },
  },
},
);

const dmActor = createActor(dmMachine, {
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {
  console.group("State update");
  console.log("State value:", state.value);
  console.log("NLU: ", state.context.lastResult)
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
