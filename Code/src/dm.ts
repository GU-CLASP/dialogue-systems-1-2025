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
  response?: boolean;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  john: { person: "John Smith" },
  emily: { person: "Emily Johnson" },
  michael: { person: "Michael Brown" },
  sarah: { person: "Sarah Wilson" },

  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },

  "9am": { time: "09:00" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "10am": { time: "10:00" },
  "11am": { time: "11:00" },
  noon: { time: "12:00" },
  "12pm": { time: "12:00" },
  "2pm": { time: "14:00" },
  "3pm": { time: "15:00" },
  "4pm": { time: "16:00" },
  "5pm": { time: "17:00" },
  "half past two": { time: "14:30" },
  "two thirty": { time: "14:30" },
  "quarter to three": { time: "14:45" },

  yes: { response: true },
  yeah: { response: true },
  yep: { response: true },
  "of course": { response: true },
  sure: { response: true },

  no: { response: false },
  "no way": { response: false },
  nope: { response: false },
  negative: { response: false },
  "not really": { response: false },
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getDate(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

function getConfirm(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).response;
}

function getTime(utterance: string) {
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
    person: null,
    day: null,
    time: null,
    response: null,
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
      entry: {
        type: "spst.speak",
        params: { utterance: `Hi! Let's create an appointment.` },
      },
      on: { SPEAK_COMPLETE: "AskName" },
    },

    AskName: {
      entry: {
        type: "spst.speak",
        params: { utterance: `Who are you meeting with?` },
      },
      on: {
        SPEAK_COMPLETE: "GetName",
      },
    },

    GetName: {
      entry: {
        type: "spst.listen",
      },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            const person = getPerson(event.value[0].utterance);
            return person
              ? { person, lastResult: event.value }
              : { lastResult: event.value };
          }),
          target: "AskWhen",
        },
        ASR_NOINPUT: {
          target: "AskName",
        },
      },
    },
    AskWhen: {
      entry: {
        type: "spst.speak",
        params: { utterance: `On which day is your meeting?` },
      },
      on: {
        SPEAK_COMPLETE: "GetDay",
      },
    },
    GetDay: {
      entry: {
        type: "spst.listen",
      },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            const day = getDate(event.value[0].utterance);
            return day
              ? { day, lastResult: event.value }
              : { lastResult: event.value };
          }),
          target: "AskDuration",
        },
        ASR_NOINPUT: {
          target: "AskWhen",
        },
      },
    },

    AskDuration: {
      entry: {
        type: "spst.speak",
        params: { utterance: `Will it take a whole day?` },
      },
      on: {
        SPEAK_COMPLETE: "GetDuration",
      },
    },
    GetDuration: {
      entry: {
        type: "spst.listen",
      },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            const response = getConfirm(event.value[0].utterance);
            return response
              ? { lastResult: event.value, target: "WholeDayConfirm" }
              : { lastResult: event.value, target: "AskTime" };
          }),
        },
        ASR_NOINPUT: {
          target: "AskDuration",
        },
      },
    },
    ConfirmAppointment: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => {
          let UttConfirm = `Do you want me to create an appointment with ${context.person} `;
          UttConfirm += `on ${context.day} for the whole day?`;
          on: {
            SPEAK_COMPLETE: "FinalConfirm";
          }
        },
      },
    },
    FinalConfirm: {
      entry: { type: "spst.listen" },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            const response = getConfirm(event.value[0].utterance);
            if (response) {
              return {
                target: "AppointmentCreated",
              };
            }
            return {
              lastResult: null,
              target: "AskName",
            };
          }),
        },
      },
    },
    AppointmentCreated: {
      entry: {
        type: "spst.speak",
        params: { utterance: "Your appointment has been created!" },
      },
    },
    AskTime: {
      entry: {
        type: "spst.speak",
        params: { utterance: `What time is your meeting` },
      },
      on: {
        SPEAK_COMPLETE: "GetTime",
      },
    },
    GetTime: {
      entry: {
        type: "spst.listen",
      },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            const time = getTime(event.value[0].utterance);
            return time
              ? { time, lastResult: event.value }
              : { lastResult: event.value };
          }),
          target: "AskTimeConfirm",
        },
        ASR_NOINPUT: {
          target: "AskTime",
        },
      },
    },
    AskTimeConfirm: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => {
          let UttConfirm = `Do you want me to create an appointment with ${context.name} `;
          UttConfirm += `on ${context.day} `;
          UttConfirm += "at ${context.time}";
          on: {
            SPEAK_COMPLETE: "FinalConfirm";
          }
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
