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
  stratos: { person: "Stratos Kamateros" },
  rhodri: { person: "Rhodri Meredith"},
  gustav : { person: "Gustav Engelmann"},
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },
  today: { day: "today"},
  tomorrow: { day: "tomorrow"},
  "8": { time: "8:00 am" },
  "9": { time: "9:00 am" },
  "10": { time: "10:00 am" },
  "11": { time: "11:00 am" },
  "12": { time: "12:00 pm" },
  "1": { time: "1:00 pm" },
  "2": { time: "2:00 pm" },
  "3": { time: "3:00 pm" },
  "4": { time: "4:00 pm" },
  "5": { time: "5:00 pm" },
  "6": { time: "6:00 pm" },
  "7": { time: "7:00 pm" },
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}
function isTodayTomorrow(utterance: string) {
  return (utterance.toLowerCase() == "today" || utterance.toLowerCase() == "tomorrow");
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
    meetingWith: null, 
    meetingDay: null,
    meetingTime: null,
    beeninWith: false,
    beeninTime: false, 
    beeninDay: false,  
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
      entry: { type: "spst.speak", params: { utterance: "Let's create an appointment. To stop the program, simply say exit." } },
      on: { SPEAK_COMPLETE: "AskMeetingWith" },
      },
    AskMeetingWith: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "exit",
          },
          {
            target: "CheckGrammar",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Who are you meeting with?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.value, beeninWith: true }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
          },
        },
        NoInput: {
          entry: { type: "spst.speak", params: { utterance: "I didn't catch that, please try again." } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
      },
    },
    AskMeetingDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "exit",
          },
          {
            target: "CheckGrammar",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "On which day is your meeting?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.value, beeninDay: true }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
          },
        },
        NoInput: {
          entry: { type: "spst.speak", params: { utterance: "I didn't catch that, please try again." } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
      },
    },
    AskFullDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "exit",
          },
          {
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "yes",
            target: "ConfirmFullDay",
          },
          {
            guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "no",
            target: "AskMeetingTime",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Will it take the whole day?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastResult: event.value }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "I didn't catch that, please try again." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
      },
      ConfirmFullDay: {
        initial: "Prompt",
        on: {
          LISTEN_COMPLETE: [
            {
              target: "Exit",
              guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "exit",
            },
            {
              guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "yes",
              target: "AppointmentCreated",
            },
            {
              guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "no",
              target: "AskMeetingWith",
            },
            { target: ".NoInput" },
          ],
        },
        states: {
          Prompt: {
            entry: {
              type: "spst.speak",
              params: ({ context }) => ({
                utterance: `Do you want me to create an appointment with ${context.meetingWith} 
                  ${isTodayTomorrow(context.meetingDay!) ? `for ${context.meetingDay} for the whole day?` 
                    : `on ${context.meetingDay} for the whole day?`} `,
              }),
            },
          on: { SPEAK_COMPLETE: "Listen" },
          },
          Listen: {
            entry: { type: "spst.listen" },
            on: {
              RECOGNISED: {
                actions: assign(({ event }) => {
                  return { lastResult: event.value }
                }),                
            },
              ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "I didn't catch that, please try again." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
      }, 
      AskMeetingTime: {
        initial: "Prompt",
        on: {
          LISTEN_COMPLETE: [
            {
              target: "Exit",
              guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "exit",
            },
            {
              target: "CheckGrammar",
              guard: ({ context }) => !!context.lastResult,
            },
            { target: ".NoInput" },
          ],
        },
        states: {
          Prompt: {
            entry: { type: "spst.speak", params: { utterance: "What time is your meeting?" } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
          Listen: {
            entry: { type: "spst.listen" },
            on: {
              RECOGNISED: {
                actions: assign(({ event }) => {
                  return { lastResult: event.value, beeninTime: true }
                }),
              },
              ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "I didn't catch that, please try again." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
      },
      ConfirmMeetingTime: {
        initial: "Prompt",
        on: {
          LISTEN_COMPLETE: [
            {
              target: "Exit",
              guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "exit",
            },
            {
              guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "yes",
              target: "AppointmentCreated",
            },
            {
              guard: ({ context }) => !!context.lastResult && context.lastResult![0]?.utterance.toLowerCase() === "no",
              target: "AskMeetingWith",
            },
            { target: ".NoInput" },
          ],
        },
        states: {
          Prompt: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({
                  utterance: `Do you want me to create an appointment with ${context.meetingWith} 
                  ${isTodayTomorrow(context.meetingDay!) ? `for ${context.meetingDay} at ${context.meetingTime}?` 
                    : `on ${context.meetingDay} at ${context.meetingTime}?`} `,
                }),
              },
            on: { SPEAK_COMPLETE: "Listen" },
          },
          Listen: {
            entry: { type: "spst.listen" },
            on: {
              RECOGNISED: {
                actions: assign(({ event }) => {
                  return { lastResult: event.value }
                }),                
            },
              ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "I didn't catch that, please try again." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
      }, 
    AppointmentCreated: {
        entry: { type: "spst.speak", params: { utterance: "Your appointment has been created!" } },
        on: { SPEAK_COMPLETE: "Done" },
    }, 
    CheckGrammar: {
      initial: "Prompt",
      on: { 
        SPEAK_COMPLETE: [
          // If valid, move to the next step
          { 
            target: "AskMeetingDay", 
            guard: ({ context }) => context.beeninWith && isInGrammar(context.lastResult![0].utterance),
            actions: assign(({ context }) => ({
              beeninWith: false, 
              meetingWith: getPerson(context.lastResult![0]?.utterance),
            }))
          },
          { 
            target: "AskFullDay", 
            guard: ({ context }) => context.beeninDay && isInGrammar(context.lastResult![0].utterance),
            actions: assign(({ context }) => ({
              beeninDay: false, 
              meetingDay: getDay(context.lastResult![0]?.utterance),
            }))
          },
          { 
            target: "ConfirmMeetingTime", 
            guard: ({ context }) => context.beeninTime && isInGrammar(context.lastResult![0].utterance),
            actions: assign(({ context }) => ({
              beeninTime: false, 
              meetingTime: getTime(context.lastResult![0]?.utterance),
            }))
          },

          // If invalid, go back to the previous state
          { target: "AskMeetingWith", 
            guard: ({ context }) => context.beeninWith && !isInGrammar(context.lastResult![0].utterance) 
          },
          { 
            target: "AskMeetingDay",
            guard: ({ context }) => context.beeninDay && !isInGrammar(context.lastResult![0].utterance)  
          },
          { 
            target: "AskMeetingTime", 
            guard: ({ context }) => context.beeninTime && !isInGrammar(context.lastResult![0].utterance)
          },
        ]
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: isInGrammar(context.lastResult![0].utterance)
                ? "OK."
                : `You just said: ${context.lastResult![0]?.utterance}. And it is not in the grammar.`,
            }),
          },
        }
      },
    },
    Exit: {
      entry: { type: "spst.speak", params: { utterance: "Exiting the program without an appointment." } },
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