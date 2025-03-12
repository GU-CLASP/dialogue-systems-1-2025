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
  whole?: string;
  decision?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  mela: { person: "Mihaela Goga" },
  andrei: { person: "Andrei Pely" },
  klaus: { person: "Klaus Iohannis" },
  luca: { person: "Luca Toni" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },
  "8": { time: "08:00 AM" },
  "9": { time: "09:00 AM" },
  "10": { time: "10:00 AM" },
  "11": { time: "11:00 AM" },
  "12": { time: "12:00 PM" },
  "1": { time: "1:00 PM" },
  "2": { time: "2:00 PM" },
  "3": { time: "3:00 PM" },
  "4": { time: "4:00 PM" },
  "5": { time: "5:00 PM" },
  "6": { time: "6:00 PM" },
  "7": { time: "7:00 PM" },
  "20": { time: "8:00 PM" },
  "21": { time: "9:00 PM" },
  "22": { time: "10:00 PM"},
  "23": { time: "11:00 PM"},
  noon: { time: "12:00 PM" },
  midday: { time: "12:00 PM" },
  midnight: { time: "12:00 AM" },
  "whole day": { whole: "yes" },
  "all day": { whole: "yes" },
  "full day": { whole: "yes" },
  yes: { decision: "yes" }, 
  yeah: { decision: "yes" },
  "of course": { decision: "yes" },
  "sure": { decision: "yes" },
  "definitely": { decision: "yes" },
  "absolutely": { decision: "yes" },
  no: { decision: "no" },
  neh: { decision: "no" },
  "no way": { decision: "no" },
  "nope": { decision: "no" },
  "not really": { decision: "no" },
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}


function isNo(utterance: string): boolean {
  return getDecision(utterance) === "no";
}

function isYes(utterance: string): boolean {
  return getDecision(utterance) === "yes";
}

function getPerson(utterance: string) {
  return grammar[utterance.toLowerCase()]?.person || null;
}

function getDay(utterance: string) {
  return grammar[utterance.toLowerCase()]?.day || null;
}

function getTime(utterance: string) {
  return grammar[utterance.toLowerCase()]?.time || null;
}

function getDecision(utterance: string) {
  return grammar[utterance.toLowerCase()]?.decision || null;
}


function personIsInGrammar(utterance: string): boolean {
  return getPerson(utterance) !== null;
}

function dayIsInGrammar(utterance: string): boolean {
  return getDay(utterance) !== null;
}

function timeIsInGrammar(utterance: string): boolean {
  return getTime(utterance) !== null;
}
const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    /** define your actions here */
    "spst.speak": ({ context }, params: { utterance: string }) => {
      console.log("spst.speak action CALLED:", params.utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
        },
      });
    },
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
      }),

    "clearLastResult": assign({ lastResult: null }),
    "clearMeetingDetails": assign({
      meetingPartnerName: null,
      meetingDay: null,
      meetingTime: null,
      isWholeDay: false,
      confirmationDecision: null,
    }),

    "assignLastResult": assign(({ event }) => {
      if ('value' in event) {
        return { lastResult: event.value };
      }
      return {};
    }),

    "assignMeetingPartnerName": assign(({ context }) => {
      const utterance = context.lastResult?.[0]?.utterance;
      return utterance ? { meetingPartnerName: getPerson(utterance) || utterance } : {};
    }),
    "assignMeetingDay": assign(({ context }) => {
      const utterance = context.lastResult?.[0]?.utterance;
      return utterance ? { meetingDay: getDay(utterance) || utterance } : {};
    }),
    "assignMeetingTime": assign(({ context }) => {
      const utterance = context.lastResult?.[0]?.utterance;
      return utterance ? { meetingTime: getTime(utterance) || utterance } : {};
    }),
    "assignIsWholeDay": assign(({ context }) => {
      if (context.lastResult && context.lastResult.length > 0) {
        const utterance = context.lastResult[0].utterance;
        return { isWholeDay: isYes(utterance) };
      }
      return {};
    }),
    "assignConfirmationDecision": assign(({ context }) => {
      if (context.lastResult && context.lastResult.length > 0) {
        const utterance = context.lastResult[0].utterance;
        return { confirmationDecision: getDecision(utterance) };
      }
      return {};
    }),
  },
  guards: {
    hasLastResult: ({ context }) => 
      context.lastResult !== null && context.lastResult.length > 0,
    
    isInGrammar: ({ context }) => 
      context.lastResult !== null && 
      context.lastResult.length > 0 && 
      isInGrammar(context.lastResult[0].utterance),
    
    
    personIsInGrammar: ({ context }) => 
      context.lastResult !== null && 
      context.lastResult.length > 0 && 
      getPerson(context.lastResult[0].utterance) !== null,
    
    dayIsInGrammar: ({ context }) => 
      context.lastResult !== null && 
      context.lastResult.length > 0 && 
      getDay(context.lastResult[0].utterance) !== null,
    
    timeIsInGrammar: ({ context }) => 
      context.lastResult !== null && 
      context.lastResult.length > 0 && 
      getTime(context.lastResult[0].utterance) !== null,
    
    decisionIsInGrammar: ({ context }) => 
      context.lastResult !== null && 
      context.lastResult.length > 0 && 
      getDecision(context.lastResult[0].utterance) !== null,
      
    confirmationIsYes: ({ context }) => 
      context.confirmationDecision === "yes",
      
    confirmationIsNo: ({ context }) => 
      context.confirmationDecision === "no",
  
  }
  
  
}).createMachine({
  context: ({ spawn }) : DMContext => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    meetingPartnerName: null,
    meetingDay: null,
    meetingTime: null,
    isWholeDay: null,       
    confirmationDecision: null
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
            target: "AskWho",
            guard: "hasLastResult",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Welcome to the Appointment setter! May I have your name?` } },
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
              actions: "assignLastResult",
            },
            ASR_NOINPUT: {
              actions: "clearLastResult",
            },
          },
        },
      },
    },
  
    AskWho: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Nice to meet you.Who are you meeting with?" } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { actions: ["assignLastResult", "assignMeetingPartnerName"] },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult"
            },
          },
        },
        NoInput: {
          entry: { 
            type: "spst.speak", 
            params: { utterance: "I didn't hear anything. Who are you meeting with?" } 
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NotInGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({ 
              utterance: `I don't recognize ${context.lastResult![0].utterance} in my database. Please choose someone else.` 
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Confirmation: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `I've noted down ${context.meetingPartnerName}.`
            })
          },
          on: { SPEAK_COMPLETE: "#DM.AskDay" },
        },
      },
       on: { 
        LISTEN_COMPLETE: [
          {
            target: ".NotInGrammar",
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              !personIsInGrammar(context.lastResult[0].utterance)
          },
          {
            target: ".Confirmation",
            guard: "personIsInGrammar"
          },
          {
            target: ".NoInput"
          }
        ],
        CHILD_DONE: "AskDay"
      },
    },
    AskDay: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "On which day is your meeting?" } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { actions: ["assignLastResult", "assignMeetingDay"] },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult"
            },
          },
        },
        NoInput: {
          entry: { 
            type: "spst.speak", 
            params: { utterance: "I didn't hear anything. On which day is your meeting?" } 
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NotInGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({ 
              utterance: `I don't recognize ${context.lastResult![0].utterance} as a valid day. Please choose a day of the week.` 
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Confirmation: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `You are meeting with ${context.meetingPartnerName} on ${context.meetingDay}.`
            })
          },
          on: { SPEAK_COMPLETE: "#DM.AskWholeDay" },
        },
    
      },
      on: { 
        LISTEN_COMPLETE: [
          {
            target: ".NotInGrammar",
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              !dayIsInGrammar(context.lastResult[0].utterance)
          },
          {
            target: ".Confirmation",
            guard: "dayIsInGrammar"
          },
          {
            target: ".NoInput"
          }
        ],
        CHILD_DONE: "AskWholeDay"
      },
    },
    AskWholeDay: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Will it take the whole day?" } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { actions: ["assignLastResult", "assignIsWholeDay", "assignConfirmationDecision"] },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult"
            },
          },
        },
        NoInput: {
          entry: { 
            type: "spst.speak", 
            params: { utterance: "I didn't hear it. Will it take the whole day?" } 
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NotInGrammar: {
          entry: {
            type: "spst.speak",
            params: { utterance: "I didn't understand. Please answer yes or no." }
          },
          on: { SPEAK_COMPLETE: "Ask" },
        }
      },
      on: { 
        LISTEN_COMPLETE: [
          {
            target: ".NotInGrammar",
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              getDecision(context.lastResult[0].utterance) === null
          },
          {
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              isYes(context.lastResult[0].utterance),
            target: "ConfirmAppointmentWholeDay"
          },
          {
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              isNo(context.lastResult[0].utterance),
            target: "AskTime"
          },
          {
            target: ".NoInput"
          }
        ]
      },
    },
    AskTime: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "What time is your meeting?" } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { actions: ["assignLastResult", "assignMeetingTime"] },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult"
            },
          },
        },
        NoInput: {
          entry: { 
            type: "spst.speak", 
            params: { utterance: "I didn't hear anything. What time is your meeting?" } 
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NotInGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({ 
              utterance: `I don't recognize ${context.lastResult![0].utterance} as a valid time. Please choose a time like 3 pm or 11 am.` 
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Confirmation: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `You said ${context.meetingTime}.`
            })
          },
          on: { SPEAK_COMPLETE: "#DM.ConfirmAppointment" },
        }
      },
      on: { 
        LISTEN_COMPLETE: [
          {
            target: ".NotInGrammar",
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              !timeIsInGrammar(context.lastResult[0].utterance)
          },
          {
            target: ".Confirmation",
            guard: "timeIsInGrammar"
          },
          {
            target: ".NoInput"
          }
        ],
        CHILD_DONE: "ConfirmAppointment"
      },
    },
    ConfirmAppointment: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { 
            type: "spst.speak", 
            params: ({ context }) => ({
              utterance: `Do you want me to create an appointment with ${context.meetingPartnerName} on ${context.meetingDay} at ${context.meetingTime}?`
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { actions: ["assignLastResult", "assignConfirmationDecision"] },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult"
            },
          },
        },
        NoInput: {
          entry: { 
            type: "spst.speak", 
            params: ({ context }) => ({ 
              utterance: `I didn't hear anything. Do you want me to create an appointment with ${context.meetingPartnerName} on ${context.meetingDay} at ${context.meetingTime}?` 
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NotInGrammar: {
          entry: {
            type: "spst.speak",
            params: { utterance: "I didn't understand. Please answer yes or no." }
          },
          on: { SPEAK_COMPLETE: "Ask" },
        }
      },
      on: { 
        LISTEN_COMPLETE: [
          {
            target: ".NotInGrammar",
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              getDecision(context.lastResult[0].utterance) === null
          },
          {
            guard: "confirmationIsYes",
            target: "AppointmentCreated"
          },
          {
            guard: "confirmationIsNo",
            target: "AppointmentCanceled"
          },
          {
            target: ".NoInput"
          }
        ]
      },
    },
    ConfirmAppointmentWholeDay: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { 
            type: "spst.speak", 
            params: ({ context }) => ({
              utterance: `Do you want me to create an appointment with ${context.meetingPartnerName} on ${context.meetingDay} for the whole day?`
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { actions: ["assignLastResult", "assignConfirmationDecision"] },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult"
            },
          },
        },
        NoInput: {
          entry: { 
            type: "spst.speak", 
            params: ({ context }) => ({ 
              utterance: `I didn't hear anything. Do you want me to create an appointment with ${context.meetingPartnerName} on ${context.meetingDay} for the whole day?` 
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NotInGrammar: {
          entry: {
            type: "spst.speak",
            params: { utterance: "I didn't understand. Please answer yes or no." }
          },
          on: { SPEAK_COMPLETE: "Ask" },
        }
      },
      on: { 
        LISTEN_COMPLETE: [
          {
            target: ".NotInGrammar",
            guard: ({ context }) => 
              context.lastResult !== null && 
              context.lastResult.length > 0 && 
              getDecision(context.lastResult[0].utterance) === null
          },
          {
            guard: "confirmationIsYes",
            target: "AppointmentCreated"
          },
          {
            guard: "confirmationIsNo",
            target: "AppointmentCanceled"
          },
          {
            target: ".NoInput"
          }
        ]
      },
    },
    AppointmentCreated: {
      entry: [
        { 
          type: "spst.speak", 
          params: ({ context }) => {
            const timeInfo = context.isWholeDay 
              ? "for the whole day" 
              : `at ${context.meetingTime}`;
            
            return { utterance: `Your appointment with ${context.meetingPartnerName} on ${context.meetingDay} ${timeInfo} has been created! Goodbye and have a wonderful day` };
          }
        },
      ],
      on: { SPEAK_COMPLETE: "Done" },
    },
    AppointmentCanceled: {
      entry: [
        { type: "spst.speak", params: { utterance: "I can not create the appointment. Let's start again." } },
        "clearMeetingDetails"
      ],
      on: { SPEAK_COMPLETE: "Greeting" },
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
      snapshot.context.spstRef.getSnapshot().getMeta()
    )[0] || {
      view: undefined,
    };
    element.innerHTML = `${meta.view}`;
  });
}
