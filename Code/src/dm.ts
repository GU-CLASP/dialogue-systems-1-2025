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
  affirmative?: string;
  negative?: string;
  person?: string;
  day?: string;
  time?: string;
  entries?: any;
  wholeday?: boolean;
}

const grammar: { [index: string]: GrammarEntry } = {
  yes: { affirmative: "Yes" },
  yeah: { affirmative: "Yes" },
  sure: { affirmative: "Yes" },
  'of course': { affirmative: "Yes" },
  absolutely: { affirmative: "Yes" },
  affirmative: { affirmative: "Yes" },
  no: { negative: "No" },
  nah: { negative: "No" },
  'no way': { negative: "No" },
  'absolutely not': { negative: "No" },
  negative: { negative: "No" },
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },
  ...(function generateTimeEntries(): { [key: string]: GrammarEntry } {
    const entries: { [key: string]: GrammarEntry } = {};

    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute <= 59; minute++) {
        const formattedHour12Hour = (hour % 12 || 12).toString();
        const formattedMinute = minute.toString().padStart(2, '0');
        const amPM = hour < 12 ? "am" : "pm";
        const timeKey12Hour = `${formattedHour12Hour}:${formattedMinute} ${amPM}`;

        entries[timeKey12Hour] = { time: timeKey12Hour };
        entries[`${hour.toString()}:${formattedMinute}`] = { time: timeKey12Hour };
      }
    }
    return entries;
  })()
};

console.log(grammar);

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}
function checkAffirmative(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).affirmative;
}
function checkNegative(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).negative;
}
function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).time;
}

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
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
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "askPerson",
            guard: ({ context }) => checkAffirmative(context.lastResult![0].utterance) != undefined,
          },
          {
            target: "Done",
            guard: ({ context }) => checkNegative(context.lastResult![0].utterance) != undefined,
          },          
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Welcome. Would you like to create an appointment?` } },
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
    askPerson: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "ConfirmPerson",
            guard: ({ context }) => getPerson(context.lastResult![0].utterance) != undefined,
          },
          {
            target: "HahaLoser",
            guard: ({ context }) => !getPerson(context.lastResult![0].utterance) !!= undefined
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Who are you meeting?` } },
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
    HahaLoser: {
      entry: { type: "spst.speak", params: { 
        utterance: `That person doesn't want to meet you. Try repeating their name.` } },
      on: { SPEAK_COMPLETE: "askPerson.Ask" },
    },
    ConfirmPerson: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Initializing booking a meeting with ${context.lastResult![0].utterance}.`,
        }),
      },
      on: { SPEAK_COMPLETE: {
        target: "askDay",
        actions: assign({person: ({ context }) => 
          getPerson(context.lastResult![0].utterance)}),
        },
      },
    },
    askDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "ConfirmDay",
            guard: ({ context }) => getDay(context.lastResult![0].utterance) != undefined
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `What day of the week is your meeting?` } },
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
    ConfirmDay: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Deleting all your other bookings on ${context.lastResult![0].utterance}. Just kidding lol.`,
        }),
      },
      on: { SPEAK_COMPLETE: {
        target: "wholeDay",
        actions: assign({day: ({ context }) => 
          getDay(context.lastResult![0].utterance)}),
        },
      },
    },
    wholeDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "ConfirmAllDay",
            guard: ({ context }) => checkAffirmative(context.lastResult![0].utterance) != undefined,
          },
          {
            target: "askTime",
            guard: ({ context }) => checkNegative(context.lastResult![0].utterance) != undefined,
          },          
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `Is your meeting on ${context.day} going to take all day?` }) },
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
    askTime: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "ConfirmTime",
            actions: assign({time: ({ context }) => 
              getTime(context.lastResult![0].utterance)}),
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `When on ${context.day} is your meeting?` }) },
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
    ConfirmAllDay: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `A meeting has been booked with ${context.person} for ${context.day}. Don't be late.`,
        }),
      },
      on: { SPEAK_COMPLETE: {
        target: "Done",
        },
      },
    },
    ConfirmTime: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `A meeting has been booked with ${context.person} on ${context.day} at ${context.time}. Don't be late.`,
        }),
      },
      on: { SPEAK_COMPLETE: {
        target: "Done",
        },
      },
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
