import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure.ts";
import { DMContext, DMEvents } from "./types.ts";

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
  staffan: { person: "Staffan Larsson" }, stephan: { person: "Staffan Larsson" }, stefan: { person: "Staffan Larsson" },
  chris: { person: "Christine Howes" },
  eleni: { person: "Eleni Gregoromichelaki" },
  gerlof: { person: "Gerlof Bouma" }, gerloff: { person: "Gerlof Bouma" }, guerlov: { person: "Gerlof Bouma" },
  shafqat: { person: "Shafqat Mumtaz Virk" },
  sharid: { person: "Sharid Loáiciga" }, shahrid: { person: "Sharid Loáiciga" }, shahid: { person: "Sharid Loáiciga" },
  maria: { person: "Maria Irena Szawerna" },
  monday: { day: "Monday" }, "on monday": { day: "Monday" },
  tuesday: { day: "Tuesday" }, "on tuesday": { day: "Tuesday" },
  wednesday: { day: "Wednesday" }, "on wednesday": { day: "Wednesday" },
  thursday: { day: "Thursday" }, "on thursday": { day: "Thursday" },
  friday: { day: "Friday"}, "on friday": { day: "Friday"},
  "8": { time: "08:00 am" }, "8:00": { time: "08:00 am" }, "at 8:00": { time: "08:00 am" },
  "9": { time: "09:00 am" }, "9:00": { time: "09:00 am" }, "at 9:00": { time: "09:00 am" },
  "10": { time: "10:00 am" }, "10:00": { time: "10:00 am" }, "at 10:00": { time: "10:00 am" },
  "11": { time: "11:00 am" }, "11:00": { time: "11:00 am" }, "at 11:00": { time: "11:00 am" },
  "12": { time: "12:00 pm" }, "12:00": { time: "12:00 pm" }, "at 12:00": { time: "12:00 pm" },
  "1": { time: "01:00 pm" }, "1:00": { time: "01:00 pm" }, "at 1:00": { time: "01:00 pm" },
  "13": { time: "01:00 pm" }, "1300": { time: "01:00 pm" }, "1300 hours": { time: "01:00 pm" },
  "at 13": { time: "01:00 pm" }, "at 1300": { time: "01:00 pm" }, "at 1300 hours": { time: "01:00 pm" },
  "2": { time: "02:00 pm" }, "2:00": { time: "02:00 pm" }, "at 2:00": { time: "02:00 pm" },
  "14": { time: "02:00 pm" }, "1400": { time: "02:00 pm" }, "1400 hours": { time: "02:00 pm" },
  "at 14": { time: "02:00 pm" }, "at 1400": { time: "02:00 pm" }, "at 1400 hours": { time: "02:00 pm" },
  "3": { time: "03:00 pm" }, "3:00": { time: "03:00 pm" }, "at 3:00": { time: "03:00 pm" },
  "15": { time: "03:00 pm" }, "1500": { time: "03:00 pm" }, "1500 hours": { time: "03:00 pm" },
  "at 15": { time: "03:00 pm" }, "at 1500": { time: "03:00 pm" }, "at 1500 hours": { time: "03:00 pm" },
  "4": { time: "04:00 pm" }, "4:00": { time: "04:00 pm" }, "at 4:00": { time: "04:00 pm" },
  "16": { time: "04:00 pm" }, "1600": { time: "04:00 pm" }, "1600 hours": { time: "04:00 pm" },
  "at 16": { time: "04:00 pm" }, "at 1600": { time: "04:00 pm" }, "at 1600 hours": { time: "04:00 pm" },
  "5": { time: "05:00 pm" }, "5:00": { time: "05:00 pm" }, "at 5:00": { time: "05:00 pm" },
  "17": { time: "05:00 pm" }, "1700": { time: "05:00 pm" }, "1700 hours": { time: "05:00 pm" },
  "at 17": { time: "05:00 pm" }, "at 1700": { time: "05:00 pm" }, "at 1700 hours": { time: "05:00 pm" },
};

const YNreply: { yes: string[], no: string[] } = {
  yes: ["Yes", "OK", "Yeah", "Yep", "Correct", "Right", "Alright","All right", "True", "Of course", 
        "Sure", "Exactly", "Indeed","I think so", "Yes, I do", "Yes, please"],
  no: ["No", "Nope", "Not now", "Not at all", "Uncorrect", "Wrong", "False", "No way", 
        "Of course not", "Certainly not", "I don't think so", "No, I don't", "No thank you", "Thanks, but no"]
}

const greetings: string[] = ["Hi", "Hello", "Hey", "Good morning", "Good afternoon", "Good evening", "Thanks", "Thank you"]

function isInGrammar(utterance: string) {
  return (utterance.toLowerCase() in grammar);
}

function isYesReply(utterance: string) {
  return YNreply.yes.includes(utterance);
}

function isNoReply(utterance: string) {
  return YNreply.no.includes(utterance);
}

function isGreeting(utterance: string) {
  return greetings.includes(utterance);
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getDay(utterance:string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

function getTime(utterance:string) {
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
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    person_reply: null,
    day_reply: null,
    time_reply: null,

  }),
  id: 'DM',
  initial: 'Main',
  states:{
    NoInput: {
      entry: {
        type: "spst.speak",
        params: { utterance: `I can't hear you!` },
      },
      on: { SPEAK_COMPLETE: "Main.hist" },
    },
    Main: {
      id: "Main",
      initial: "Prepare",
      states: {
        Prepare: {
          entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
          on: { ASRTTS_READY: "WaitToStart" },
        },
        WaitToStart: {
          on: { CLICK: "Greeting" },
        },
        hist: {
          type: 'history'
        },
        Greeting: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckGreeting",
                guard: ({ context }) => !!context.lastResult,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `Hi. Welcome to the appointment system.` } },
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
        CheckGreeting: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({ 
              utterance: ` ${ isGreeting(context.lastResult![0].utterance) ?
                "Ok" : "Thanks. Come back again when you want to get an appointment."
              }`,
            }),
          },
          on: { SPEAK_COMPLETE:  [ 
            {
              target: "Introduction",
              guard: ({ context }) => (isGreeting(context.lastResult![0].utterance)),
            },
            { target: "Done" },
          ],
          },
        },
        Introduction: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckIntro",
                guard: ({ context }) => !!context.lastResult,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `Let's create an appointment.` } },
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
        CheckIntro: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({ 
              utterance: `${ isYesReply(context.lastResult![0].utterance) ?
                "Let's start." : "Thanks. Come back again when you want to get an appointment."
              }`,
            }),
          },
          on: { SPEAK_COMPLETE:  [ 
            {
              target: "AskPerson",
              guard: ({ context }) => (isYesReply(context.lastResult![0].utterance)),
            },
            { target: "Done" },
          ],
          },
        },
        AskPerson: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckPerson",
                guard: ({ context }) => !!context.person_reply,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
              on: { SPEAK_COMPLETE: "Ask" }, 
            },
            Ask: { 
              entry: { type: "spst.listen" },
              on: {
                RECOGNISED: { 
                  actions: assign(({ event }) => { 
                    return { person_reply: event.value }; 
                  }),                                             
                },
                ASR_NOINPUT: { 
                  actions: assign({ person_reply: null }),
                },
              },
            },
          },
        },
        CheckPerson: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `You just said: ${context.person_reply![0].utterance}. And this person ${
                isInGrammar(context.person_reply![0].utterance) && getPerson(context.person_reply![0].utterance) != undefined ? 
                "is" : "is not" } available.`,
            }),
          },
          on: { SPEAK_COMPLETE: 
            [ 
              {
                target: "AskDay",
                guard: ({ context }) => 
                  isInGrammar(context.person_reply![0].utterance) && getPerson(context.person_reply![0].utterance) != undefined,
              },
              { target: "AskPerson" },
            ],
          },
        },
        AskDay: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckDay",
                guard: ({ context }) => !!context.day_reply,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `On which day is your meeting?` } },
              on: { SPEAK_COMPLETE: "Ask" }, 
            },
            Ask: { 
              entry: { type: "spst.listen" },
              on: {
                RECOGNISED: { 
                  actions: assign(({ event }) => { 
                    return { day_reply: event.value }; 
                  }),
                },
                ASR_NOINPUT: { 
                  actions: assign({ day_reply: null }),
                },
              },
            },
          },
        },
        CheckDay: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `You just said: ${context.day_reply![0].utterance}. And you ${
                isInGrammar(context.day_reply![0].utterance) && getDay(context.day_reply![0].utterance) != undefined ? 
                "can" : "can not" } get an appointment on that day.`,
            }),
          },
          on: { SPEAK_COMPLETE:
            [ 
              {
                target: "AskWholeDay",
                guard: ({ context }) => 
                  isInGrammar(context.day_reply![0].utterance) && getDay(context.day_reply![0].utterance) != undefined,
              },
              { target: "AskDay" },
            ]
          },
        },
        AskWholeDay: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckWholeDay",
                guard: ({ context }) => !!context.lastResult,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `Will it take the whole day?` } },
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
              utterance: ` ${
                isYesReply(context.lastResult![0].utterance) || isNoReply(context.lastResult![0].utterance) ?
                "Well noted." : `You just said: ${context.lastResult![0].utterance}. Please reply yes or no.` 
              } `,
            }),
          },
          on: { SPEAK_COMPLETE:
            [ 
              {
                target: "ConfirmWholeDay",
                guard: ({ context }) => (isYesReply(context.lastResult![0].utterance))
              },
              {
                target: "AskTime",
                guard: ({ context }) => (isNoReply(context.lastResult![0].utterance))
              },
              { target: "AskWholeDay" },
            ]
          },
        },
        AskTime: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckTime",
                guard: ({ context }) => !!context.time_reply,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `What time is your meeting?` } },
              on: { SPEAK_COMPLETE: "Ask" }, 
            },
            Ask: { 
              entry: { type: "spst.listen" },
              on: {
                RECOGNISED: { 
                  actions: assign(({ event }) => { 
                    return { time_reply: event.value }; 
                  }),
                },
                ASR_NOINPUT: { 
                  actions: assign({ time_reply: null }),
                },
              },
            },
          },
        },
        CheckTime: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `You just said: ${context.time_reply![0].utterance}. And you ${
                isInGrammar(context.time_reply![0].utterance) && getTime(context.time_reply![0].utterance) != undefined ? 
                "can" : "can not" } get an appointment at this time.`,
            }),
          },
          on: { SPEAK_COMPLETE:
            [ 
              {
                target: "ConfirmTime",
                guard: ({ context }) => 
                  isInGrammar(context.time_reply![0].utterance) && getTime(context.time_reply![0].utterance) != undefined,
              },
              { target: "AskTime" },
            ]
          },
        },
        ConfirmWholeDay: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckConfirmWholeDay",
                guard: ({ context }) => !!context.lastResult,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { 
                type: "spst.speak",
                params: ({ context }) => ({ 
                  utterance: `Do you want me to create an appointment with ${getPerson(context.person_reply![0].utterance)}
                  on ${getDay(context.day_reply![0].utterance)} for the whole day?`
                })
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
        CheckConfirmWholeDay: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: ` ${
                isYesReply(context.lastResult![0].utterance) || isNoReply(context.lastResult![0].utterance) ? 
                isYesReply(context.lastResult![0].utterance) ? "Perfect!" : "Oh, sorry for the confusion." : 
                `You just said: ${context.lastResult![0].utterance}. Please reply yes or no.`
              } `,
            }),
          },
          on: { SPEAK_COMPLETE:
            [ 
              {
                target: "ConfirmAppointment",
                guard: ({ context }) => isYesReply(context.lastResult![0].utterance)
              },
              {
                target: "AskPerson",
                guard: ({ context }) => isNoReply(context.lastResult![0].utterance) 
              },
              { target: "ConfirmWholeDay" },
            ]
          },
        },
        ConfirmTime: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [ 
              {
                target: "CheckConfirmTime",
                guard: ({ context }) => !!context.lastResult,
              },
              { target: "#DM.NoInput" },
            ],
          },
          states: {
            Prompt: {
              entry: { 
                type: "spst.speak",
                params: ({ context }) => ({ 
                  utterance: `Do you want me to create an appointment with ${getPerson(context.person_reply![0].utterance)} 
                  on ${getDay(context.day_reply![0].utterance)} at ${getTime(context.time_reply![0].utterance)}?`
                }),
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
        CheckConfirmTime: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: ` ${
                isYesReply(context.lastResult![0].utterance) || isNoReply(context.lastResult![0].utterance) ?
                isYesReply(context.lastResult![0].utterance) ? "Perfect!" : "Oh, sorry for the confusion." : 
                `You just said: ${context.lastResult![0].utterance}. Please reply yes or no.`
              } `,
            }),
          },
          on: { SPEAK_COMPLETE:
            [ 
              {
                target: "ConfirmAppointment",
                guard: ({ context }) => isYesReply(context.lastResult![0].utterance)
              },
              {
                target: "AskPerson",
                guard: ({ context }) => isNoReply(context.lastResult![0].utterance)
              },
              { target: "ConfirmTime" },
            ]
          },
        },
        ConfirmAppointment: {
          entry: { type: "spst.speak",
              params: { utterance: `Your appointment has been created!` }
          },
          on: { SPEAK_COMPLETE: "Done" }, 
        },
        Done: {
          on: {
            CLICK: "Greeting",
          },
        },
      },
    },
  }
})

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
