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
  response?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  yes: { response: "Yes" },
  no: { response: "No" },
  "of course": { response: "Of course" },
  "no way": { response: "No way" },
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
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
    name: null,
    day: null,
    time: null,
    isAllDay: null,
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
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Hi! Let's create an appointment.` },
          },
          on: { SPEAK_COMPLETE: "AskName" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "AskName" },
        },
        AskName: {
          on: {
            RECOGNISED: {
              actions: assign(({ event, context }) => {
                const name = getPerson(event.value);
                return { name: name || null };
              }),
              target: "AskWhen",
            },
            ASR_NOINPUT: { target: "AskName" },
          },
          entry: {
            type: "spst.speak",
            params: { utterance: `Who are you meeting with?` },
          },
        },
        AskWhen: {
          on: {
            RECOGNISED: {
              actions: assign(({ event, context }) => {
                const day = grammar[event.value.toLowerCase()]?.day;
                return { day: day || null };
              }),
              target: "AskDuration",
            },
            ASR_NOINPUT: { target: "AskWhen" },
          },
          entry: {
            type: "spst.speak",
            params: { utterance: `On which day is your meeting?` },
          },
        },
        AskDuration: {
          on: {
            RECOGNISED: {
              actions: assign(({ event, context }) => {
                const response = grammar[event.value.toLowerCase()]?.response;
                if (response === "Yes" || response === "Of course") {
                  return { isAllDay: true };
                } else if (response === "No" || response === "No way") {
                  return { isAllDay: false };
                }
                return {};
              }),
              target: "ConfirmAppointment",
            },
            ASR_NOINPUT: { target: "AskDuration" },
          },
          entry: {
            type: "spst.speak",
            params: { utterance: `Will it take a whole day?` },
          },
        },
        ConfirmAppointment: {
          on: {
            RECOGNISED: {
              actions: assign(({ event, context }) => {
                const response = grammar[event.value.toLowerCase()]?.response;
                if (response === "Yes" || response === "Of course") {
                  return {
                    lastResult: null,
                    name: context.name,
                    day: context.day,
                    isAllDay: context.isAllDay,
                    time: context.time,
                  };
                } else {
                  return { name: null, day: null, time: null, isAllDay: null };
                }
              }),
              target: "AppointmentCreated",
            },
            ASR_NOINPUT: { target: "ConfirmAppointment" },
          },
          entry: ({ context }) => {
            const { name, day, isAllDay } = context;
            const timeMessage = isAllDay
              ? `for the whole day`
              : `at ${context.time}`;
            context.spstRef.send({
              type: "SPEAK",
              value: {
                utterance: `Do you want me to create an appointment with ${name} on ${day} ${timeMessage}?`,
              },
            });
          },
        },
        AppointmentCreated: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Your appointment has been created.` },
          },
        },
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
