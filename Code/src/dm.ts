import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { DMContext, DMEvents } from "./types";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://erkoo.cognitiveservices.azure.com/sts/v1.0/issuetoken", // insert your own endpoint
  key: KEY, // insert your own key is azure.ts
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
  decision?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  erik: { person: "Erik Kolterjahn Kjellberg"},
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },
  today: {day: "Today"},
  tomorrow: {day: "Tomorrow"},
  yes: { decision: "yes"},
  yeah: { decision: "yes"},
  yup: { decision: "yes"},
  "yes, please": { decision: "yes"},
  ok: { decision: "yes"},
  alright: { decision: "yes"},
  absolutely: { decision: "yes"},
  "yes, indeed": { decision: "yes"},
  "of course": { decision: "yes"},
  sure: { decision: "yes"},
  "you bet": { decision: "yes"},
  no: { decision: "no"},
  nope: { decision: "no"},
  "absolutely not": { decision: "no"},
  "i don't think so": { decision: "no"},
  "no no": { decision: "no"},
  "no way": { decision: "no"},
};

function grammaticalDay(utterance: string) {
  utterance = utterance.toLowerCase();
  if (utterance.substring(0,3) == 'on '){
    utterance = utterance.substring(3,);
  }
  return getDay(utterance);
}

function grammaticalTime(utterance: string) {
  utterance = utterance.toLowerCase();
  if (utterance.substring(0,3) == "at "){
    utterance = utterance.substring(3,);
  }
  // Check if the utterance is in the format hh:mm
  if (utterance.substring(2,3) == ":"){
    const hour = parseInt(utterance.substring(0,2));
    const minute = parseInt(utterance.substring(3,5));
    if (hour >= 0 && hour <= 24 && minute >= 0 && minute <= 60){
      return utterance;
    }
  }
  // Check if the utterance is a number between 0 and 24
  else if (!!parseInt(utterance) && parseInt(utterance) >= 0 && parseInt(utterance) <= 24){
    return utterance;
  }
  return null;
}


function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day
}

function getDecision(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).decision
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
      entry: { type: "spst.speak", params: { utterance: `Let's create an appointment.` } },
      on: { SPEAK_COMPLETE: "Booking" },
    },

    Booking: {
      initial : "Who",
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            return { lastResult: event.value };
          }),
        },
        ASR_NOINPUT: {
          actions: assign({ lastResult: null }),
        },
        CLICK: "Done"
      },

      states: {

        // Ask the user who to book the meeting with
        Who : {
          initial : "Prompt",
          states:{
            Prompt : {
              entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
              on: { SPEAK_COMPLETE: "HandleInput" },
            },
            HandleInput : {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.Day",
                    guard: ({ context }) => !!context.lastResult && !!getPerson(context.lastResult![0].utterance),
                    actions: assign(({ context }) => {
                      return { person: getPerson(context.lastResult![0].utterance)}
                    })
                  },
                  // If last utterance cannot be parsed as a person, inform the user of this and let them speak again
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              // Depending on if the system recognized something at all, give a different response
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "That is not a person I know." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },
        
        // Ask the user for the day of the meeting
        Day : {
          initial: "Prompt",
          states : {
            Prompt : {
              entry: { type: "spst.speak", params: { utterance: `On which day is your meeting?` } },
              on: { SPEAK_COMPLETE: "HandleInput" },
            },
            HandleInput : {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.WholeDay",
                    guard: ({ context }) => !!context.lastResult && !!grammaticalDay(context.lastResult![0].utterance),
                    actions: assign(({ context }) => {
                      return { day: grammaticalDay(context.lastResult![0].utterance)};
                    }),
                  },
                  {
                    target: "DayAgain",
                  }
                ],
              },
            },
            DayAgain : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "That is not a day I know. Please specify a day of the week." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },

        // Ask the user if the meeting is the whole day or a specific time
        WholeDay : {
          initial: "Prompt",
          states: {
            Prompt : {
              entry: {type: "spst.speak", params: { utterance: `Will it take the whole day?`}},
              on: { SPEAK_COMPLETE: "HandleInput"}
            },
    
            HandleInput : {
              entry: {type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  // Go to Time or Confirm depending on the answer
                  {
                    target: "#DM.Booking.Time",
                    guard: ({ context }) => !!context.lastResult && getDecision(context.lastResult![0].utterance) == `no`,
                  },
                  {
                    target: "#DM.Booking.Confirm",
                    guard: ({ context }) => !!context.lastResult && getDecision(context.lastResult![0].utterance) == `yes`,
                  },
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "I did not understand what you said." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },

        // Ask the user about the time of the meeting
        Time : {
          initial: "Prompt",
          states: {
            Prompt : {
              entry: {type: "spst.speak", params: {utterance: `What time is your meeting`}},
              on: {SPEAK_COMPLETE: "HandleInput"},
            },
    
            HandleInput : {
              entry: {type: "spst.listen"},
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.Confirm",
                    guard: ({ context }) => !!context.lastResult && !!grammaticalTime(context.lastResult![0].utterance),
                    actions: assign(({ context }) => {
                      return { time: grammaticalTime(context.lastResult![0].utterance)};
                    }),
                  },
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "I don't recognize that time." : "I did not hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
          }
        },

        // Ask the user for confirmation, to finally "book" the meeting
        Confirm : {
          initial: "Prompt",
          states: {
            Prompt : {
              entry: {
                type: "spst.speak", 
                params: ({ context }) => ({
                  utterance: `Do you want me to create an appointment with ${context.person} on ${context.day} ${!!context.time ? "at " + context.time : "for the whole day"}?`,
                }),
              },
              on : {SPEAK_COMPLETE: "HandleInput"},
            },
            HandleInput : {
              entry: {type: "spst.listen"},
              on: {
                LISTEN_COMPLETE: [
                  // Start over if the user is not happy.
                  {
                    target: "StartOver",
                    guard: ({ context }) => !!context.lastResult && getDecision(context.lastResult![0].utterance) == `no`,
                  },
                  // If the user says yes, go to Done
                  {
                    target: "#DM.Done",
                    guard: ({ context }) => !!context.lastResult && getDecision(context.lastResult![0].utterance) == `yes`,
                  },
                  {
                    target: "Again",
                  }
                ],
              },
            },
            Again : {
              entry: {type: "spst.speak",
                params: ({context}) => ({utterance: `${
                  !!context.lastResult ? "I did not understand what you just said." : "I cannot hear you."}`})
              },
              on: {SPEAK_COMPLETE: "Prompt"},
            },
            StartOver: {
              entry: {type: "spst.speak", params: {utterance: `We start over then.`}},
              on: {SPEAK_COMPLETE: {
                target: "#DM.Booking.Who",
                actions: assign({ time: null, person: null, day: null}),
                }
              }
            },
          }
        },
      },
    },
    // Confirm the appointment
    Done : {
      entry: {type: "spst.speak", params: {utterance: `Your appointment has been created!`}},
      // If the button is clicked, make a new appointment
      on : {
        CLICK: {
            target: "Greeting",
            actions: assign({ time: null, person: null, day: null}),
          }
      }
    }
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
