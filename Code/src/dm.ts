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
  answer?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
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
  "0": { time: "0:00" },
  "1": { time: "1:00" },
  "2": { time: "2:00" },
  "3": { time: "3:00" },
  "4": { time: "4:00" },
  "5": { time: "5:00" },
  "6": { time: "6:00" },
  "7": { time: "7:00" },
  "8": { time: "8:00" },
  "9": { time: "9:00" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "12": { time: "12:00" },
  "13": { time: "13:00" },
  "14": { time: "14:00" },
  "15": { time: "15:00" },
  "16": { time: "16:00" },
  "17": { time: "17:00" },
  "18": { time: "18:00" },
  "19": { time: "19:00" },
  "20": { time: "20:00" },
  "21": { time: "21:00" },
  "22": { time: "22:00" },
  "23": { time: "23:00" },
  "yes": { answer: "yes"},
  "of course": { answer: "yes"},
  "yeah": { answer: "yes"},
  "yes, please": { answer: "yes"},
  "sure": { answer: "yes"},
  "ok": { answer: "yes"},
  "okay": { answer: "yes"},
  "no": { answer: "no" },
  "nah": { answer: "no" },
  "no way": { answer: "no" },
  "no thank you": { answer: "no" },
  "no thanks": { answer: "no" },
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
    person: '',
    day: '',
    time: '',
    question: "Who are you meeting with?",
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      entry: { type: "spst.listen" },
      on: { LISTEN_COMPLETE: "Begin" },
    },
    Begin: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: ".Question",
            guard: ({ context }) => !!context.lastResult && context.question == "Who are you meeting with?" && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).person != undefined,
            actions: assign(({ context }) => {
              return { person: getPerson(context.lastResult![0].utterance), question: "On which day is your meeting?" };
            }),
          },
          {
            target: ".Question",
            guard: ({ context }) => !!context.lastResult && context.question == "On which day is your meeting?" && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).day != undefined,
            actions: assign(({ context }) => {
              return { day: getDay(context.lastResult![0].utterance), question: "Will it take the whole day?" };
            }),
          },
          {
            target: ".Question",
            guard: ({ context }) => !!context.lastResult && context.question == "Will it take the whole day?" && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).answer == "yes",
            actions: assign(({ context }) => {
              return { question: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?` };
            }),
          },
          {
            target: ".Question",
            guard: ({ context }) => !!context.lastResult && context.question == "Will it take the whole day?" && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).answer == "no",
            actions: assign({ question: "What time is your meeting?" }),
          },
          {
            target: ".Question",
            guard: ({ context }) => !!context.lastResult && context.question == "What time is your meeting?" && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).time != undefined,
            actions: assign(({ context }) => {
              return { time: getTime(context.lastResult![0].utterance), question: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${(grammar[context.lastResult![0].utterance.toLowerCase()] || {}).time}?` };
            }),
          },
          {
            target: "Done",
            guard: ({ context }) => !!context.lastResult && (context.question == `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?` || context.question == `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`) && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).answer == "yes",
            actions: assign({ question: "Who are you meeting with?", person: '', day: '' }),
          },
          {
            target: ".Question",
            guard: ({ context }) => !!context.lastResult && (context.question == `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?` || context.question == `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`) && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).answer == "no",
            actions: assign({ question: "Who are you meeting with?", person: '', day: '' }),
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Let's create an appointment.` } },
          on: { SPEAK_COMPLETE: "Question" },
        },
        NoInput: {
          entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `${context.question}` }) },
          on: { SPEAK_COMPLETE: "Ask" }
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event, context }) => {
                console.log(context.question)
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          }
        },
        Question: {
          entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `${context.question}` }) },
          on: { SPEAK_COMPLETE: "Ask" }
        },
      }
    },
    Done: {
      entry: { type: "spst.speak" , params: { utterance: `Your appointment has been created!` }},
      on: { CLICK: "Begin", }
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