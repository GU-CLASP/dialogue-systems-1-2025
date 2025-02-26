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
  ttsDefaultVoice: "sv-SE-SofieNeural",
};

interface GrammarEntry {
  person?: string;
  day?: string;
  time?: string;
  confirmation?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  christine: { person: "Christine Howes" },
  eleni: { person: "Eleni Gregoromichelaki" },
  staffan: { person: "Staffan Larsson" },


  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  
  "9": { time: "9:00 a.m." },
  "10": { time: "10:00 a.m." },
  "11": { time: "11:00 a.m." },
  "12": { time: "12:00 p.m." },
  "13": { time: "1:00 p.m." },
  "14": { time: "2:00 p.m." },
  "15": { time: "3:00 p.m." },
  "16": { time: "4:00 p.m." },

  yes: {confirmation: "yes"},
  no: {confirmation: "no"},
  "no way": {confirmation: "no"},
  "of course": {confirmation: "yes"},
  "cancel": {confirmation: "no"},
  "continue": {confirmation: "yes"},
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}
// below functions will make sure that given utterance is defined in our grammar and is in its own category, returning boolean and deciding transitions
function isInGrammarPerson(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.person !== undefined;
}

function isInGrammarDay(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.day !== undefined;
}

function isInGrammarTime(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.time !== undefined;
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

function getConfirmation(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).confirmation;
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
    appdata: {
      person: null,
      day: null,
      time: null,
      confirmation: null,
      person_confirmed: null, // I am not sure if they will clash with the person, day and time;; so I have created extra variables in context to store confirmed values
      day_confirmed: null,
      time_confirmed: null,
    }
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
            target: "CheckGrammar",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Welcome to Dialogue Systems 2025 appointment system! My name is Annika. Let's create an appointment with one of our scholars. Please note that in this system I will only be able to process one word at a time. So please tell me only one word. Please say: "continue" to continue or say "cancel" to cancel the appointment.` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Please say: "yes" to continue or say "no" to cancel the appointment.` },
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
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `I understand that you said: ${context.lastResult![0].utterance}.`,
        }),
      },
      on: { 
        SPEAK_COMPLETE: [
          {
            target: "Done",
            guard: ({ context }) => getConfirmation(context.lastResult![0].utterance) === "no",
            actions: { type: "spst.speak", params: { utterance: "Cancelling the appointment." } },
          },
          {
            target: "personQuery",
            guard: ({ context }) => getConfirmation(context.lastResult![0].utterance) === "yes",
          },
          {
            target: "Greeting.NoInput",
          },
        ]
      }
    },    
    Done: {
      on: {
        CLICK: "Greeting",
      },
    },





    personQuery: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar2",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Continuing to make the appointment. Who are you going to meet?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Maybe I was not able to process your voice. Available scholars are: Vlad, Aya, Victoria, Christine, Eleni and Staffan. Please say one of these names.` },
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

    CheckGrammar2: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `I heard you say: ${context.lastResult![0].utterance}. This ${
            isInGrammar(context.lastResult![0].utterance) && isInGrammarPerson(context.lastResult![0].utterance) ? "is" : "is not"
          } an acceptable answer. It is ${getPerson(context.lastResult![0].utterance)}`,
        }),
      },
      on: { 
        SPEAK_COMPLETE: [
          {
            target: "dayQuery",
            // if it's a member of grammar and a person
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance) && isInGrammarPerson(context.lastResult![0].utterance) === true,
            // storing the full name in the person_confirmed to use it in the last steps, will do the same for the day and time
            actions: assign(({ context }) => {
              return {
                ...context,
                appdata: {
                  ...context.appdata,
                  person_confirmed: getPerson(context.lastResult![0].utterance) || null,
                },
              };
            }),
          },
          {
            target: "personQuery.NoInput",
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance) && isInGrammarPerson(context.lastResult![0].utterance) === false,
            // if not, a member, returning to NoInput as in the Greeting
          },
          {
            target: "personQuery.NoInput",
            // defaulting to NoInput without guard
          },
        ]
      }
    },





    dayQuery: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar3",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Which day of the week are you going to meet? Please note that weekends are unavailable.` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Maybe I was not able to process your voice. Available days are: Monday, Tuesday, Wednesday, Thursday and Friday. Please choose and say one of these days.` },
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

    CheckGrammar3: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `I heard you say: ${context.lastResult![0].utterance}. This ${
            isInGrammar(context.lastResult![0].utterance) && isInGrammarDay(context.lastResult![0].utterance) ? "is" : "is not"
          } an acceptable answer. It is ${getDay(context.lastResult![0].utterance)}.`,
        }),
      },
      on: { 
        SPEAK_COMPLETE: [
          {
            target: "fullDayQuery",            
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance) && isInGrammarDay(context.lastResult![0].utterance) === true,
            actions: assign(({ context }) => {
              return {
                ...context,
                appdata: {
                  ...context.appdata,
                  day_confirmed: getDay(context.lastResult![0].utterance) || null,
                },
              };
            }),
          },
          {
            target: "dayQuery.NoInput",
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance) && isInGrammarDay(context.lastResult![0].utterance) === false,
          },
          {
            target: "dayQuery.NoInput",
          },
        ]
      }
    },






    fullDayQuery: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar4",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Will your meeting take the whole day? Please say "yes" or "no".` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Please say: "yes" if your meeting will take the whole day or say "no" if it will happen in a certain time.` },
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
    CheckGrammar4: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `I heard you say: ${context.lastResult![0].utterance}.`,
        }),
      },
      on: { 
        SPEAK_COMPLETE: [
          {
            target: "timeQuery",
            guard: ({ context }) => getConfirmation(context.lastResult![0].utterance) === "no",
          },
          {
            target: "lastConfirmationFullDay",
            guard: ({ context }) => getConfirmation(context.lastResult![0].utterance) === "yes",
          },
          {
            target: "fullDayQuery.NoInput",
          },
        ]
      }
    },    







    timeQuery: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar5",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `What time is your meeting? Available time slots are between 9 a.m. and 4 p.m. by the hour. Say a number between 9 and 16. I can only process 24 hour system.` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Available time slots are between 9 a.m. and 4 p.m. by the hour. But I can only process numbers between 9 and 16 in a 24 hour system. Please state a number between 9 and 16.` },
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

    CheckGrammar5: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `I heard you say: ${context.lastResult![0].utterance} and This ${
            isInGrammar(context.lastResult![0].utterance) && isInGrammarTime(context.lastResult![0].utterance) ? "is" : "is not"
          } an acceptable answer. It is ${getTime(context.lastResult![0].utterance)}`,
        }),
      },
      on: { 
        SPEAK_COMPLETE: [
          {
            target: "lastConfirmationNotFullDay",
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance) && isInGrammarTime(context.lastResult![0].utterance) === true,
            actions: assign(({ context }) => {
              return {
                ...context,
                appdata: {
                  ...context.appdata,
                  time_confirmed: getTime(context.lastResult![0].utterance) || null,
                },
              };
            }),
          },
          {
            target: "timeQuery.NoInput",
            guard: ({ context }) => isInGrammar(context.lastResult![0].utterance) && isInGrammarTime(context.lastResult![0].utterance) === false,
          },
          {
            target: "timeQuery.NoInput",
          },
        ]
      }
    },







    lastConfirmationFullDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar6",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }: { context: DMContext }) => ({
              utterance: `Do you want to create an appointment with ${context.appdata.person_confirmed} on ${context.appdata.day_confirmed} full day? Please answer "yes" or "no". `,
            }),
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Please say: "yes" to confirm or "no" to start over.` },
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
    CheckGrammar6: {
      entry: {
        type: "spst.speak",
        params: ({ context }: { context: DMContext }) => ({
          utterance: `I heard you say: ${context.lastResult![0].utterance}.`,
        }),
      },
      on: { 
        SPEAK_COMPLETE: [
          {
            target: "personQuery",
            guard: ({ context }: { context: DMContext }) => getConfirmation(context.lastResult![0].utterance) === "no",
          },
          {
            target: "Done",
            guard: ({ context }: { context: DMContext }) => getConfirmation(context.lastResult![0].utterance) === "yes",
            actions: { type: "spst.speak", params: { utterance: "Your appointment has been created! I wish you a very pleasant day!" } },
          },
          {
            target: "lastConfirmationFullDay.NoInput",
          },
        ]
      }
    },




    lastConfirmationNotFullDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar6",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }: { context: DMContext }) => ({
              utterance: `Do you want to create an appointment with ${context.appdata.person_confirmed} on ${context.appdata.day_confirmed} at ${context.appdata.time_confirmed} ? Please answer "yes" or "no". `,
            }),
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Please say: "yes" to confirm or "no" to start over.` },
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
    CheckGrammar7: {
      entry: {
        type: "spst.speak",
        params: ({ context }: { context: DMContext }) => ({
          utterance: `I heard you say: ${context.lastResult![0].utterance}.`,
        }),
      },
      on: { 
        SPEAK_COMPLETE: [
          {
            target: "personQuery",
            guard: ({ context }: { context: DMContext }) => getConfirmation(context.lastResult![0].utterance) === "no",
          },
          {
            target: "Done",
            guard: ({ context }: { context: DMContext }) => getConfirmation(context.lastResult![0].utterance) === "yes",
            actions: { type: "spst.speak", params: { utterance: "Your appointment has been created! I wish you a very pleasant day!" } },
          },
          {
            target: "lastConfirmationNotFullDay.NoInput",
          },
        ]
      }
    },
    
    // you may find the lab report on the same source directory: report-lab2.pdf
    



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
