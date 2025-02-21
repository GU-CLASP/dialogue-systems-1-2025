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
  locale: "en-AU",
  ttsDefaultVoice: "en-AU-NatashaNeural",
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
  stratos: { person: "Stratos Kamateros"},
  lucia: { person: "Lucia Casiglio" },
  paula: { person: "Paula Grey" },
  anton: { person: "Anton Rapprich" },
  karianne: { person: "Karianne Scheie" },
  adele: { person: "Adel Muhametsina" },
  rhodri: { person: "Rhodri Meredith" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: {day: "Saturday" },
  sunday: {day: "Sunday" },
  "8": { time: "08:00" },
  "9": { time: "09:00" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "12": { time: "12:00" },
  "1": { time: "13:00" },
  "2": { time: "14:00" },
  "3": { time: "15:00" },
  "4": { time: "16:00" },
  "5": { time: "17:00" },
  "6": { time: "18:00" },
  "7": { time: "19:00" },
};

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
      on: { CLICK: "MeetingPerson" },
    },
    MeetingPerson: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Let's create an appointment! Who are you meeting with?` } },
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
    MeetingDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar",
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
    WholeDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "MeetingConfirm",
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === 'yes',
            actions: assign({
              timeSaved: true,
              wholeDay: true,
            }),
          },
          {
            target: "MeetingTime",
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === 'no'
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
    MeetingTime: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar",
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
    MeetingConfirm: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "MeetingConfirmed",
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === 'yes'
          },
          {
            target: "MeetingCancelled",
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === 'no'
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
                utterance: `So, would you like to have a meeting with ${context.person} 
                on ${context.day} which will take the whole day?` })},
            },

            Confirm: {
              entry: { type: "spst.speak", params: ({ context }) => ({ 
                utterance: `So, would you like to have a meeting with ${context.person} 
                on ${context.day} at ${context.time}?` })},
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
    CheckGrammar: {
      initial: "Prompt",
      on: {
        SPEAK_COMPLETE: [
          // Person
          {
            target: "MeetingDay",
            guard: ({ context }) => !context.personSaved && isInGrammar(context.lastResult![0].utterance),
            actions: assign(({ context }) => ({
              personSaved: true,
              person: getPerson(context.lastResult![0].utterance),
            })),
          },
          {
            target: "MeetingPerson",
            guard: ({ context }) => !context.personSaved && !isInGrammar(context.lastResult![0].utterance),
          },
          // Day
          {
            target: "WholeDay",
            guard: ({ context }) => !context.daySaved && isInGrammar(context.lastResult![0].utterance),
            actions: assign(({ context }) => ({
              daySaved: true,
              day: getDay(context.lastResult![0].utterance),
            })),
          },
          {
            target: "MeetingDay",
            guard: ({ context }) => !context.daySaved && !isInGrammar(context.lastResult![0].utterance),
          },
          // Time
          {
            target: "MeetingConfirm",
            guard: ({ context }) => !context.timeSaved && isInGrammar(context.lastResult![0].utterance),
            actions: assign(({ context }) => ({
              timeSaved: true,
              time: getTime(context.lastResult![0].utterance),
            })),
          },
          {
            target: "MeetingTime",
            guard: ({ context }) => !context.timeSaved && !isInGrammar(context.lastResult![0].utterance),
          },
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: isInGrammar(context.lastResult![0].utterance)
              ? "OK"
              : "This is not in the grammar."
            }),
          },
        },
      },
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
        CLICK: "MeetingPerson",
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
