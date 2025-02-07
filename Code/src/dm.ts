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
  caroline: {person: "Caroline Grand-Clement"},
  matteo: { person: "Matteo" },
  roxana: { person: "Roxana" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "11 30": { time: "11:30" },
  "13": { time: "13:00" },
  "14": { time: "14:00" },
  "15 30": { time: "15:30" },
};

const yesGrammar = [
  "yes", "of course", "sure", "yeah", "yep"
]

const noGrammar = [
  "no", "hell no", "no way", "nah"
]

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).time;
}

function isYes(utterance: string){
  return utterance.toLowerCase() in yesGrammar;
}

function isNo(utterance: string) {
  return utterance.toLowerCase() in noGrammar;
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
    "save_person": ({ context }) =>
      context.person = getPerson(context.lastResult![0].utterance) ,
    "save_day": ({ context }) =>
      context.day = getDay(context.lastResult![0].utterance) ,
    "save_time": ({ context }) =>
      context.time = getTime(context.lastResult![0].utterance) ,

  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    person: null,
    day: null,
    time: null
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
      entry: { type: "spst.speak", params: { utterance: `Let's create an appointment!` } },
      on: { SPEAK_COMPLETE: "PersonQuestion"}
    },
    PersonQuestion: {
      initial: "PersonPrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckPerson",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        PersonPrompt: {
          entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
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
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    CheckPerson: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
            isInGrammar(context.lastResult![0].utterance) ? "is" : "is not"
          } in the grammar.`,
        }),
      },
      on: { SPEAK_COMPLETE: [
        {
          target: "SavePerson",
          guard: ({ context }) => isInGrammar(context.lastResult![0].utterance),
        },
        { target: "PersonQuestion" }]
      },
    },
    SavePerson: {
      entry: {
        type: "save_person"
      },
      on: {
        CLICK: "DayQuestion"
      }
    },
    DayQuestion: {
      initial: "DayPrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckDay",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        DayPrompt: {
          entry: { type: "spst.speak", params: { utterance: "On which day is your meeting?" } },
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
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    CheckDay: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
            isYes(context.lastResult![0].utterance) || isNo(context.lastResult![0].utterance) ? "is" : "is not"
          } in the grammar.`,
        }),
      },
      on: { SPEAK_COMPLETE: [
          {
            target: "SaveDay",
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance),
          },
          { target: "DayQuestion" }]
        },
    },
    SaveDay: {
        entry: {
          type: "save_day"
        },
        on: {
          CLICK: "WholeDayQuestion"
        }
      },
    WholeDayQuestion: {
      initial: "WholePrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckWholeDay",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        WholePrompt: {
          entry: { type: "spst.speak", params: { utterance: "Will it take the whole day?" } },
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
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    CheckWholeDay: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
            isInGrammar(context.lastResult![0].utterance) ? "is" : "is not"
          } in the grammar.`,
        }),
      },
      on: { SPEAK_COMPLETE: [
        {
          target: "TimeQuestion",
          guard: ({ context }) => isNo(context.lastResult![0].utterance),
        },
        {
          target: "ConfirmDay",
          guard: ({ context }) => isYes(context.lastResult![0].utterance),
        },
        { target: "WholeDayQuestion" }]
      },
    }, 
    TimeQuestion: {
      initial: "TimePrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckTime",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        TimePrompt: {
          entry: { type: "spst.speak", params: { utterance: "Which time is your meeting?" } },
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
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    CheckTime: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
            isInGrammar(context.lastResult![0].utterance) ? "is" : "is not"
          } in the grammar.`,
        }),
      },
      on: { SPEAK_COMPLETE: [
          {
            target: "SaveTime",
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance),
          },
          { target: "TimeQuestion" }]
        },
    },
    SaveTime: {
      entry: {
        type: "save_day"
      },
      on: {
        CLICK: "ConfirmDayTime"
      }
    },
    ConfirmDay:{ 
      initial: "ConfirmPrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckConfirmDay",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        ConfirmPrompt: {
          entry: { type: "spst.speak", 
            params: ({ context }) => ({
              utterance: `Do you want to create an appointment with ${context.person} on ${context.day} for the whole day?`,
            }),
          on: { SPEAK_COMPLETE: "Ask" },
        },},
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
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    CheckConfirmDay: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
            isYes(context.lastResult![0].utterance) || isNo(context.lastResult![0].utterance) ? "is" : "is not"
          } in the grammar.`,
        }),
      },
      on: { SPEAK_COMPLETE: [
        {
          target: "TimeQuestion",
          guard: ({ context }) => isNo(context.lastResult![0].utterance),
        },
        {
          target: "ConfirmDay",
          guard: ({ context }) => isYes(context.lastResult![0].utterance),
        },
        { target: "WholeDayQuestion" }]
      },
    }, 
    ConfirmDayTime:{ 
      initial: "ConfirmPrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckConfirmTimeDay",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        ConfirmPrompt: {
          entry: { type: "spst.speak", 
            params: ({ context }) => ({
              utterance: `Do you want to create an appointment with ${context.person} on ${context.day} for the whole day?`,
            }),
          on: { SPEAK_COMPLETE: "Ask" },
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
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    CheckConfirmTimeDay: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
            isYes(context.lastResult![0].utterance) || isNo(context.lastResult![0].utterance) ? "is" : "is not"
          } in the grammar.`,
        }),
      },
      on: { SPEAK_COMPLETE: [
        {
          target: "Greeting",
          guard: ({ context }) => isNo(context.lastResult![0].utterance),
        },
        {
          target: "Done",
          guard: ({ context }) => isYes(context.lastResult![0].utterance),
        },
        { target: "ConfirmDayTime" }]
      },
    }, 
    Done: { entry: {
      type: "spst.speak", params : {utterance: "Your appointment has been created"}
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
