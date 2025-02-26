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
  confirmation?: boolean;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  yasha: {person: "Yashar Rezaii"},
  saya: {person: "Seoyoung Oh"},
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  yes: {confirmation: true},
  no: {confirmation: false}
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

function getConfirmation(utterance: string): boolean | null {
  const value = (grammar[utterance.toLowerCase()] || {}).confirmation;
  return value !== undefined ? value : null;
}

const noInputMessages = [
  "I can't hear you! I'll ask you again.",
  "Can you say that again?",
  "I didn't catch that. Try again!"
];

const invalidInputMessages = [
  "please, tell me something in the grammar. I'll ask you again",
  "Hmm, I don't understand. Can you say it again?",
  "That doesn't seem to be in my vocabulary. Try another way!"
];

const getRandomMessage = (messages: string[]) =>
  messages[Math.floor(Math.random() * messages.length)];

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
    aPerson: null,
    aDay: null,
    aFullDay: null,
    aTime: null,
    aConfirm : null
  }),
  id: "DM",
  initial: "Prepare",
  on: {
      LISTEN_COMPLETE: [
          {
            target: ".CheckGrammar",
            guard: ({ context }) => !!context.lastResult ,
          },
          { target: ".NoInput",
            actions: (({ context }) => {
              console.log(`listen complete, but no input : ${context.lastResult}`);
              return { lastResult: null };
            })
          },
        ],
  },
  states: {
      Prepare: {
          entry: ({context}) => context.spstRef.send({type: "PREPARE"}),
          on: {ASRTTS_READY: "WaitToStart"},
      },
      WaitToStart: {
          on: {CLICK: "Welcome"},
      },
      NoInput: {
        entry:
          {type: "spst.speak",
          params: {utterance: getRandomMessage(noInputMessages)}},
        on: {SPEAK_COMPLETE: "Control" },
      },
      InvalidInput:{
          entry:{type:"spst.speak", params: {utterance: getRandomMessage(invalidInputMessages),
              },
            },
          on : {SPEAK_COMPLETE:"Control"}
      },
      Welcome: {
          entry: {type:"spst.speak", params:{utterance:"welcome to the appointment system"}},
          on: { SPEAK_COMPLETE: "AskWho"},
      },
      Control : {
          entry: {
            type: "spst.speak", params: {utterance:" "}},
            on : {SPEAK_COMPLETE : [
              {
                target : "AskWho",
                guard : ({ context }) => context.aPerson === undefined || context.aPerson === null,
              },
              {
                target: "AskDay",
                guard: ({ context }) => context.aDay === undefined || context.aDay === null,
              },
              {
                target: "AskFullDay",
                guard: ({ context }) => context.aFullDay === undefined || context.aFullDay === null,
              },
              {
                target: "AskTime",
                guard: ({ context }) => context.aFullDay === false && ( context.aTime === undefined || context.aTime === null),
              },
              {
                target: "ConfirmAppointment",
                guard: ({ context }) => context.aConfirm === null
              },
              {
                target : "Welcome",
                guard : ({ context }) => context.aConfirm === false,
                actions :{type:"spst.speak", params: {utterance:"Oh, let's restart from beginning"}}
              },
              {target : "Final",
                guard : ({ context }) => context.aConfirm === true}
            ],
          }
      },
      AskWho:{
          entry: {type: "spst.speak", params: {utterance: "who are you meeting with?"}},
          on: {SPEAK_COMPLETE:"GetWho"}
      },
      GetWho: {
          entry: { type: "spst.listen" },
          on: {
              RECOGNISED:
                  {
                      actions : assign(({event})=>{
                          return {lastResult: event.value,
                                    aPerson: getPerson(event.value[0].utterance)};
                      }),
                  },
              ASR_NOINPUT : {
                  actions: assign({ lastResult: null })},
              },
      },
      AskDay:{
          entry:{type: "spst.speak", params: {utterance: "Which day is your meeting?"}},
          on: {SPEAK_COMPLETE: "GetDay"},
      },
      GetDay:{
          entry: {type: "spst.listen"},
          on: {
                  RECOGNISED:
                      {
                          actions : assign(({event})=>({
                              lastResult: event.value,
                              aDay: getDay(event.value[0].utterance)
                          })),
                      },
                  ASR_NOINPUT : {
                      actions: assign({ lastResult: null })},
          },
      },
      AskFullDay:{
          entry:{type: "spst.speak", params: {utterance: "Will it take the whole day?"}},
          on: {SPEAK_COMPLETE: "GetFullDay"},
      },
      GetFullDay: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED:
              {actions: assign(({ event }) => ({
                  lastResult: event.value,
                  aFullDay: getConfirmation(event.value[0].utterance),
                })),
              },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null })},
          },
        },
      AskTime: {
        entry: { type: "spst.speak", params: { utterance: "What time is your meeting?" } },
        on: { SPEAK_COMPLETE: "GetTime" }
      },

      GetTime: {
        entry: { type: "spst.listen" },
        on: {
            RECOGNISED:
                {actions: assign(({ event }) => ({
                        lastResult: event.value,
                        aTime: getTime(event.value[0].utterance)
                    })),
                },
            ASR_NOINPUT: {actions: assign({ lastResult: null })}
        }
      },
      ConfirmAppointment :{
          entry : {
              type : "spst.speak",
              params : ({context}) => ({
                  utterance: context.aFullDay
                  ? `Do you want me to create an appointment with ${context.aPerson} on ${context.aDay} for the whole day?`
                  : `Do you want me to create an appointment with ${context.aPerson} on ${context.aDay} at ${context.aTime}?`,
              }),
          },
          on: {SPEAK_COMPLETE: "CheckConfirm"},
      },
      CheckConfirm :{
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED:
              {actions: assign(({ event }) => ({
                      lastResult: event.value,
                      aConfirm: getConfirmation(event.value[0].utterance)
                  })),
              },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },

        },
      Final : {
          entry : {type: "spst.speak", params: { utterance: "Your appointment has been created!" } },
          on: {SPEAK_COMPLETE:"Done"}
      },
      CheckGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
                isInGrammar(context.lastResult![0].utterance) ? "is" : "is not"
              } in the grammar.`,
            }),
          },
          on: {
            SPEAK_COMPLETE: [
              {
                target: "InvalidInput",
                guard: ({ context }) =>
                  !context.lastResult || !isInGrammar(context.lastResult[0].utterance),
              },
              {target : "Control"},
            ],
          },
        },
      Done: {
          on: {
              CLICK: "Welcome",
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
