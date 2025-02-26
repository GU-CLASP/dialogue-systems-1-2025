import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
import { isInPerson, getPerson, isInDay, getDay, isInTime, getTime, isYes, isNo } from "./grammars.ts";

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

function getAffirmativeSaying(value: string, valueType: string){
  return `You just said: ${value} and it is in the grammar for ${valueType}. ${valueType} saved.`
}

function getNegativeSaying(value: string, valueType: string){
  return `You just said: ${value} and it is not in the grammar for ${valueType}.` 
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
      context.person = getPerson(context.lastResult![0].utterance.split(" ")[0]);
      context.lastResult = null;
    },
    "save_day": function ({ context }){
      context.day = getDay(context.lastResult![0].utterance.split(" ")[0]);
      context.lastResult = null;
    },
    "save_time": function ({ context }){
      context.time = getTime(context.lastResult![0].utterance.split(" ")[0]);
      context.lastResult = null;
    }
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    person: null,
    day: null,
    time: null,
    currentQuestion: null
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
      id: "Greeting",
      entry: { type: "spst.speak", params: { utterance: `Let's create an appointment!` } },
      on: { SPEAK_COMPLETE: "Questions"}
    },
    Listening: {
      initial: "Ask",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#Questions.Question_Again",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: "#NoInput" },
        ],
      },
      states: {
        NoInput: {
          id: "NoInput",
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "#Questions.Question_Again" },
        },
        Ask: {
          id: "Ask",
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
    Questions: {
      id: "Questions",
      initial: "PersonQuestion",
      states: {
        Question_Again: {
          type: "history",
          history: "shallow",
          target: "PersonQuestion"
        },
        PersonQuestion: {
          id: "PersonQuestion",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "PersonPrompt",
                  guard: ({ context }) => context.lastResult == null,
                  },
                { target: "CheckPerson" },
              ],
            },
            PersonPrompt: {
              entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
              on: { SPEAK_COMPLETE: "#Ask" },
            },
            CheckPerson: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({
                  utterance: isInPerson(context.lastResult![0].utterance.split(" ")[0]) ? 
                              getAffirmativeSaying(context.lastResult![0].utterance, "Person") 
                              : getNegativeSaying(context.lastResult![0].utterance, "Person"), 
                }),
              },
              on: { SPEAK_COMPLETE: [
                {
                  actions: "save_person",
                  target: "#DayQuestion",
                  guard: ({ context }) => isInPerson(context.lastResult![0].utterance.split(" ")[0])
                },
                { target: "PersonPrompt" }]
              },
            },
          },
        },
        DayQuestion: {
          id: "DayQuestion",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "DayPrompt",
                  guard: ({ context }) => context.lastResult == null,
                  },
                { target: "CheckDay" },
              ],
            },
            DayPrompt: {
              entry: { type: "spst.speak", params: { utterance: "On which day is your meeting?" } },
              on: { SPEAK_COMPLETE: "#Ask" },
            },
            CheckDay: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({
                  utterance: isInDay(context.lastResult![0].utterance.split(" ")[0]) ? 
                              getAffirmativeSaying(context.lastResult![0].utterance, "Day") 
                              : getNegativeSaying(context.lastResult![0].utterance, "Day"), 
                }),
              },
              on: { SPEAK_COMPLETE: [
                  {
                    actions: "save_day",
                    target: "#WholeDayQuestion",
                    guard: ({ context }) => isInDay(context.lastResult![0].utterance.split(" ")[0]),
                  },
                  { target: "DayPrompt" }]
                },
            },
          },
        },
        WholeDayQuestion: {
          id: "WholeDayQuestion",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "WholePrompt",
                  guard: ({ context }) => context.lastResult == null,
                  },
                { target: "CheckWholeDay" },
              ],
            },
            WholePrompt: {
              entry: { type: "spst.speak", params: { utterance: "Will it take the whole day?" } },
              on: { SPEAK_COMPLETE: "#Ask" },
            },   
            CheckWholeDay: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({
                  utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
                    isYes(context.lastResult![0].utterance.split(" ")[0]) || isNo(context.lastResult![0].utterance.split(" ")[0]) ? "is" : "is not"
                  } in the grammar.`,
                }),
              },
              on: { SPEAK_COMPLETE: [
                { actions: assign({ lastResult: null }),
                  target: "#TimeQuestion",
                  guard: ({ context }) => isNo(context.lastResult![0].utterance.split(" ")[0]),
                },
                { actions: assign({ lastResult: null }),
                  target: "#Confirm",
                  guard: ({ context }) => isYes(context.lastResult![0].utterance.split(" ")[0]),
                },
                { target: "WholePrompt" }]
              },
            }, 
          },
        },
        TimeQuestion: {
          id: "TimeQuestion",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "TimePrompt",
                  guard: ({ context }) => context.lastResult == null,
                  },
                { target: "CheckTime" },
              ],
            },
            TimePrompt: {
              entry: { type: "spst.speak", params: { utterance: "Which time is your meeting?" } },
              on: { SPEAK_COMPLETE: "#Ask" },
            },
            CheckTime: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({
                  utterance: isInTime(context.lastResult![0].utterance.split(" ")[0]) ? 
                              getAffirmativeSaying(context.lastResult![0].utterance, "Time") 
                              : getNegativeSaying(context.lastResult![0].utterance, "Time"), 
                }),
              },
              on: { SPEAK_COMPLETE: [
                  {
                    actions: "save_time",
                    target: "#Confirm",
                    guard: ({ context }) => isInTime(context.lastResult![0].utterance.split(" ")[0]),
                  },
                  { target: "TimePrompt" }]
                },
            },
          },
        },
        Confirm:{ 
          id: "Confirm",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "ConfirmPrompt",
                  guard: ({ context }) => context.lastResult == null,
                  },
                { target: "CheckConfirm" },
              ],
            },
            ConfirmPrompt: {
              entry: { type: "spst.speak", 
                params: ({ context }) => ({
                  utterance: `Do you want to create an appointment with ${context.person} on ${context.day} ${context.time == null ? "for the whole day" : "at" + context.time}?`,
                }),
              },
              on: { SPEAK_COMPLETE: "#Ask" },
            },
            CheckConfirm: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({
                  utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
                    isYes(context.lastResult![0].utterance.split(" ")[0]) || isNo(context.lastResult![0].utterance.split(" ")[0]) ? "is" : "is not"
                  } in the grammar.`,
                }),
              },
              on: { SPEAK_COMPLETE: [
                {
                  actions: assign({ lastResult: null, person: null, day: null, time: null }),
                  target: "#Greeting",
                  guard: ({ context }) => isNo(context.lastResult![0].utterance.split(" ")[0]),
                },
                {
                  target: "#Done",
                  guard: ({ context }) => isYes(context.lastResult![0].utterance.split(" ")[0]),
                },
                { target: "ConfirmPrompt" }]
              },
            }, 
          },
        },
      },
    },
    Done: { 
      id: "Done",
      entry: {
        type: "spst.speak", params : {utterance: "Your appointment has been created. Thank you for using our service."}
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
