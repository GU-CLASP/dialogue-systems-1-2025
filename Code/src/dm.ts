import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { DMContext, DMEvents } from "./types";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const settings: Settings = {
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

interface GrammarEntry {
  person?: string;
  day?: string;
  time?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  "10": { time: "10:00" },
  "10:30": { time: "10:30" },
  "11": { time: "11:00" },
  "11:30": { time: "11:30" },
  "12": { time: "12:00" },
  "12:30": { time: "12:30" },
  "1": { time: "13:00" },
  "1:30": { time: "13:30" },
  "2": { time: "14:00" },
  "2:30": { time: "14:30" },
  "3": { time: "15:00" },
  "3:30": { time: "15:30" },
  "4": { time: "16:00"},
  "4:30": { time: "16:30" },
  "5": { time: "17:00" },
  "5:30": { time: "17:30" },
};

const affirmativeResponses = ["yes", "affirmative"];
const negativeResponses = ["no", "negative"];

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

//function getPerson(utterance: string | undefined) {
//  return utterance ?(grammar[utterance.toLowerCase()] || {}).person : undefined; 
//}
// when I try the model and say the names that are in the grammar, it does not identify the name
// since it always says "UNDEFINED"

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person; 
}

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).time;
}

function isAffirmative(utterance: string) {
  return affirmativeResponses.includes(utterance.toLowerCase());
}

function isNegative(utterance: string) {
  return negativeResponses.includes(utterance.toLowerCase());
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
      }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    person: null,
    day: null,
    time: null,
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
      entry: {type: "spst.speak", params: {utterance: "Hello! I am your scheduling assistant. Let's set up a meeting."}},
      on: {SPEAK_COMPLETE: "AskPerson"},
    },

    AskPerson: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "ProcessPerson",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Who would you like to meet with" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: "I can't hear you!" },
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event })=> ({lastResult: 
                event.value})),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    ProcessPerson: {
      always: [
        {
         guard: ({context})=>!!getPerson(context.lastResult![0].utterance),
         actions: assign({ person:({context})=> getPerson(context.lastResult![0].utterance) }), 
         target: "AskDay"
        },
        {target: "AskPerson.Prompt"},
      ],
    },
    AskDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
          target: "ProcessDay",
          guard: ({context}) => !!context.lastResult,
          },
          {target: ".NoInput"},
        ],
      },
      states: {
        Prompt: {
          entry: {type: "spst.speak", params: {utterance: "What day would you like to schedule the meeting"} },
          on: {SPEAK_COMPLETE: "Listen"},  
        },
        NoInput: {
          entry: {type: "spst.speak", params: {utterance: "I can't hear you!"}},
          on: {SPEAK_COMPLETE: "Listen"},
        },
        Listen: {
          entry: {type: "spst.listen"},
          on: {
            RECOGNISED: {
              actions: assign(({event})=>({lastResult: event.value})),
            },
            ASR_NOINPUT: {
              actions: assign({lastResult: null}),
            },
          },
        },
      },
    },
    ProcessDay: {
      always: [
        {
          guard: ({ context }) => !!getDay(context.lastResult![0].utterance),
          actions: assign({ day: ({ context }) => getDay(context.lastResult![0].utterance) }),
          target: "AskTime",
        },
        { target: "AskDay.Prompt" },
      ],
    },
    AskTime: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "ProcessTime",
            guard: ({context})=> !!context.lastResult,
          },
          {target: ".NoInput"},
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: {utterance: "What time would like to schedule the meeting?"} },
          on: {SPEAK_COMPLETE: "Listen"},
        },
        NoInput: {
          entry: {type: "spst.speak", params: {utterance: "I can't hear you!"}},
          on: {SPEAK_COMPLETE: "Listen"},
        },
        Listen: {
          entry: {type: "spst.listen"},
          on: {
            RECOGNISED: {
              actions: assign(({event})=> ({lastResult: event.value})),
            },
            ASR_NOINPUT: {
              actions: assign({lastResult: null}),
            },
          },
        },
      },
    },
    ProcessTime: {
      always: [
        {
          guard: ({context})=> !!getTime(context.lastResult![0].utterance),
          actions: assign({time: ({context})=>getTime(context.lastResult![0].utterance) }),
          target: "ConfirmAppointment",
        },
        { target: "AskTime.Prompt"},
      ],
    },
    ConfirmAppointment: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "ProcessConfirmation",
            guard: ({context})=> !!context.lastResult,
          },
          {target: ".NoInput"},
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `I've scheduled a meeting with ${context.person} on ${context.day} at ${context.time}. Is this correct?`,
            }),
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        NoInput: {
          entry: { type: "spst.speak", params: { utterance: "I can't hear you!" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => ({ lastResult: event.value })),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    ProcessConfirmation: {
      always: [
        {
          guard: ({ context }) => isAffirmative(context.lastResult![0].utterance),
          target: "FinalConfirmation",
        },
        {
          guard: ({ context }) => isNegative(context.lastResult![0].utterance),
          target: "Greeting",
        },
        { target: "ConfirmAppointment.Prompt" },
      ],
    },
    FinalConfirmation: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Great! Your meeting with ${context.person} is confirmed for ${context.day} at ${context.time}.`,
        }),
      },
      on: { SPEAK_COMPLETE: "Done" },
    },
    Done: {
      on: {
        CLICK: "Greeting",
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
