import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
import { grammar, isYes, isNo, isInGrammar } from "./grammars.ts";

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

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).time;
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
    "save_person": function ({ context }){
      context.person = getPerson(context.lastResult![0].utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: "Person saved.",
        },
      })
    },
    "save_day": function ({ context }){
      context.day = getDay(context.lastResult![0].utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: "Day saved.",
        },
      })
    },
    "save_time": function ({ context }){
      context.time = getTime(context.lastResult![0].utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: "Time saved.",
        },
      })
    }
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
            target: ".CheckPerson",
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
            { target: "PersonPrompt" }]
          },
        },
        SavePerson: {
          entry: {
            type: "save_person"
          },
          on: {
            SPEAK_COMPLETE: "DayQuestion"
          }
        },
      },
    },
    DayQuestion: {
      initial: "DayPrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: ".CheckDay",
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
        CheckDay: {
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
                target: "SaveDay",
                guard: ({ context }) => isInGrammar(context.lastResult![0].utterance),
              },
              { target: "DayPrompt" }]
            },
        },
        SaveDay: {
          entry: {
            type: "save_day"
          },
          on: {
            SPEAK_COMPLETE: "WholeDayQuestion"
          }
        },
      },
    },
    WholeDayQuestion: {
      initial: "WholePrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: ".CheckWholeDay",
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
        CheckWholeDay: {
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
              target: "Confirm",
              guard: ({ context }) => isYes(context.lastResult![0].utterance),
            },
            { target: "WholePrompt" }]
          },
        }, 
      },
    },
    TimeQuestion: {
      initial: "TimePrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: ".CheckTime",
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
              { target: "TimePrompt" }]
            },
        },
        SaveTime: {
          entry: {
            type: "save_time"
          },
          on: {
            SPEAK_COMPLETE: "Confirm"
          }
        },
      },
    },
    Confirm:{ 
      initial: "ConfirmPrompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: ".CheckConfirm",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        ConfirmPrompt: {
          entry: { type: "spst.speak", 
            params: ({ context }) => ({
              utterance: `Do you want to create an appointment with ${context.person} on ${context.day} ${context.time == null ? "for the whole day" : "at" + context.time}?`,
            }),
          },
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
        CheckConfirm: {
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
            { target: "ConfirmPrompt" }]
          },
        }, 
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
