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
  starttime?: string;
  endtime?: string;
  confirmation?: string | null;
  deny?: string | null;
}
//added start- and endtime to appointment as that is normally available when you book a metting

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  jane: {person: "Jane Smith "},
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: {day: "Wednesday" },
  thursday: {day: "Thursday" },
  friday: {day: "Friday" },
  saturday: {day: "Saturday" },
  sunday: {day: "Sunday"},
  "6": {starttime: "06:00" },
  "7": {starttime: "07:00", endtime: "07:00"},
  "8": {starttime: "08:00", endtime: "08:00" },
  "9": {starttime: "09:00", endtime: "09:00" },
  "10": { starttime: "10:00", endtime: "10:00" },
  "11": { starttime: "11:00", endtime: "11:00"},
  "12": {starttime: "12:00", endtime: "12:00"},
  "13": {starttime: "13:00", endtime: "13:00"},
  "14": {starttime: "14:00", endtime: "14:00"},
  "15": {starttime: "15:00", endtime: "15:00"},
  "16": {starttime: "16:00", endtime: "16:00"},
  "17": {starttime: "17:00", endtime: "17:00"},
  "18": {starttime: "18:00", endtime: "18:00"},
  "19": {starttime: "19:00", endtime: "19:00"},
  //I tried to add start- and endtimes for every half an hour, but I couldn't figure out how to make the machine say 7.30 and not 730
  //therefore no start- or endtime is available which is not exact hours
  yes: {confirmation: "yes" },
  yeah: {confirmation: "yeah" },
  correct: {confirmation: "correct" },
  no: {deny: "no"},
  incorrect: {deny: "incorrect"},
  //added multiple thing you could say to confirm or deny statements, more could be added to be more user friendly
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
function getStartTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).starttime;
}

function getEndTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).endtime;
}

function getConfirmation(utterance: string): boolean {
  return !!(grammar[utterance.toLowerCase()]?.confirmation);
}

function getDeny(utterance: string): boolean {
  return !!(grammar[utterance.toLowerCase()]?.deny);
}

const dmMachine = setup({
  types: {
    /** you might need to extend these */
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    /** define your actions here */
    "spst.speak": ({ context }, params: { utterance: string }) => /** a speaking action */
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
        },
      }),
    "spst.listen": ({ context }) => /** a listening action */
      context.spstRef.send({
        type: "LISTEN",
      }),
  },
}).createMachine({
  /** specify the function for context */
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    confirmation: null,
    deny: null,
    person: null,
    day: null,
    starttime: null,
    endtime: null,
  }),

  id: "DM",
  initial: "Prepare",
  /** the states in the statemchine is created and their order, this contains the parentstates */
  states: {
    /** a prepare state where the machine prepares to start the process/link where the interface of the code is --> when done it moves to state "WaitToSart" */
    Prepare: {
      id: "Prepare",
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    /** state which starts the process if the button on screen is pressed */
    WaitToStart: {
      id: "WaitToStart",
      on: { CLICK: "Greeting" },
    },
  
    /** hear & listen greeeting action */
    Greeting: {
      id: "Greeting",
      initial: "PromptGreeting",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#CheckGrammar",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: "Greeting" },//it was here HearNoGreeting
        ],
      },
      states: {

        NoInput: {
          id: "NoInput",
          entry: {
            type: "spst.speak",
            params: {utterance: "I can't hear you"}
          },
          on: { CLICK: "PromptGreeting"} /** don't know where to send people if there is no input */
        },


        PromptGreeting: {
          entry: { type: "spst.speak", 
          params: { utterance: `Hello, do you want to book an appointment?` } },
          on: { SPEAK_COMPLETE: "HearGreeting" },
        },

        HearGreeting: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
            {guard: ({event}) => getConfirmation(event.value[0].utterance),
              target: "ProcessingConfirmation",
            },
            {guard: ({event}) => getDeny(event.value[0].utterance),
              target: "PromptGreeting",
            },  
            {target : "PromptGreeting"},
            ],
            ASR_NOINPUT: {
              target: "NoInput",
            },
          },
        },


        ProcessingConfirmation: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptWho",
              actions: () => console.log("Listen complete")
            },
          },
        },


        PromptWho: {
          entry: {
            type: "spst.speak",
            params: {utterance: "Who do you want to book an appointment with?"} },
          on: { SPEAK_COMPLETE: "HearWho"},
        },

        HearWho: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
              {guard: ({event}) => isInGrammar(event.value[0].utterance),
                target: "ProcessingPerson",
                
                actions: assign({
                  person: ({event}) => getPerson(event.value[0].utterance)??null,
              })},              
              {target : "PromptWho"},
            ],
              ASR_NOINPUT: {
                target: "NoInput",
              },
          },
        },

        ProcessingPerson: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptDay",
              actions: () => console.log("Listen complete"),
            },
          },
        },


        PromptDay: {
          entry: { type: "spst.speak", 
          params: { utterance: `Which day of the week is your meeting?` } },
          on: { SPEAK_COMPLETE: "HearDay" },

        },

        HearDay: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
              {guard: ({event}) => isInGrammar(event.value[0].utterance),
                target: "ProcessingDay",
                
                actions: assign({
                  day: ({event}) => getDay(event.value[0].utterance)??null,
              })},              
              {target : "PromptDay"},
            ],
              ASR_NOINPUT: {
                target: "NoInput",
              },
          },
        },

        ProcessingDay: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptWholeDay",
              actions: () => console.log("Listen complete"),
            },
          },
        },

        PromptWholeDay: {
          entry: { type: "spst.speak", 
          params: { utterance: `Will the meeting take the entire day?` } },
          on: { SPEAK_COMPLETE: "HearWholeDay" },
        },

        HearWholeDay: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
              {guard: ({event}) => getConfirmation(event.value[0].utterance),
                target: "ProcessingWholeDayAffirmative",
              },
              {guard: ({event}) => getDeny(event.value[0].utterance),
                target: "ProcessingWholeDayNegative",
              },              
              {target : "PromptWholeDay"},
            ],
              ASR_NOINPUT: {
                target: "NoInput",
              },
          },
        },

        ProcessingWholeDayAffirmative: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptConfirmWholeDay",
              actions: () => console.log("Listen complete"),
            },
          },
        },
        
        PromptConfirmWholeDay: {
          entry: { type: "spst.speak", 
          params: ({context}) => ({ utterance: `Do you want an apointment with ${context.person} on ${context.day}?`}) 
          },
          on: { SPEAK_COMPLETE: "HearConfirmWholeDay" },
        },

        HearConfirmWholeDay: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
              {guard: ({event}) => getConfirmation(event.value[0].utterance),
                target: "ProcessingConfirmWholeDay",
              },
              {guard: ({event}) => getDeny(event.value[0].utterance),
                target: "ProcessingDay",
              },              
              {target : "PromptWholeDay"},
            ],
              ASR_NOINPUT: {
                target: "NoInput",
              },
          },
        },

        ProcessingConfirmWholeDay: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptAppointmentBooked",
              actions: () => console.log("Listen complete"),
            },
          },
        },

        ProcessingWholeDayNegative: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptTimeStart",
              actions: () => console.log("Listen complete"),
            },
          },
        },

        PromptTimeStart: {
          entry: { type: "spst.speak", 
          params: { utterance: `What time do you want the meeting to start?` } },
          on: { SPEAK_COMPLETE: "HearTimeStart" },
        },

        HearTimeStart: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
              {guard: ({event}) => isInGrammar(event.value[0].utterance),
                target: "ProcessingTimeStart",
                
                actions: assign({
                  starttime: ({event}) => getStartTime(event.value[0].utterance),
              })},              
              {target : "PromptTimeStart"},
            ],
              ASR_NOINPUT: {
                target: "NoInput",
              },
          },
        },

        ProcessingTimeStart: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptTimeStop",
              actions: () => console.log("Listen complete"),
            },
          },
        },

        PromptTimeStop: {
          entry: { type: "spst.speak",
          params: { utterance: `What time do you want the meeting to end?`}},
          on: {SPEAK_COMPLETE: "HearTimeStop"}
        },

        HearTimeStop: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
              {guard: ({event}) => isInGrammar(event.value[0].utterance),
                target: "ProcessingTimeStop",
                
                actions: assign({
                  endtime: ({event}) => getEndTime(event.value[0].utterance),
              })},              
              {target : "PromptTimeStop"},
            ],
              ASR_NOINPUT: {
                target: "NoInput",
              },
          },
        },

        ProcessingTimeStop: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptConfirmDetails",
              actions: () => console.log("Listen complete"),
            },
          },
        },

        PromptConfirmDetails: {
          entry: { type: "spst.speak", 
          params: ({context }) => ({ utterance: `Do you want an apointment with ${context.person} on ${context.day} between ${context.starttime} and ${context.endtime} ?`}) 
          },
          on: { SPEAK_COMPLETE: "HearConfirmWholeDay" },
        },

        HearConfirmDetails: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [
              
              {guard: ({event}) => getConfirmation(event.value[0].utterance),
                target: "ProcessingConfirmDetails",
              },
              {guard: ({event}) => getDeny(event.value[0].utterance),
                target: "PromptGreeting",
              },              
              {target : "PromptConfirmDetails"},
            ],
            ASR_NOINPUT: {
              target: "NoInput",
            },
          },
        },

        ProcessingConfirmDetails: {
          on: {
            LISTEN_COMPLETE: {
              target: "PromptAppointmentBooked",
              actions: () => console.log("Listen complete"),
            },
          },
        },

        PromptAppointmentBooked: {
          entry: { type: "spst.speak",
          params: { utterance: `Your appointment has been booked`}},
          on: {SPEAK_COMPLETE: "#Greeting"}
        },
      },
    },

    CheckGrammar: {
      id: "CheckGrammar",
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
            isInGrammar(context.lastResult![0].utterance) ? "is" : "is not"
          } in the grammar.`,
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
