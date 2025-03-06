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
}

const grammar: { [index: string]: GrammarEntry } = {
  christina: { person: "Christina Klironomou" },
  rox: { person: "Roxana Dimofte" },
  caro: { person: "Caroline Natalie Grand-Clement" },
  merel: { person: "Merel Drop" },
  matteo: { person: "Matteo Ripamonti" },
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
  /** @xstate-layout N4IgpgJg5mDOIC5QBECyA6ACgJzABwENcBiAQQGUAlAFWvIH1KBRU5ATQG0AGAXUVDwB7WAEsALiMEA7fiAAeiAExcu6AJwBGNYrUAODQDYVXXQBYArABoQAT0Qaup9OYMHTGgOzau5xQGZTXQBfIOs0dAB1AnFqQXIxIjFiAGEAGQBJZIBpbj4kECFRCWlZBQRfazty3UV0XTU1D3NdP3MPAyaNELCMAHFcMAkpKGIM8momADl6ZIB5VExUpgnc2ULxSRl8so0NZXQjVwM-FQ0-Vz9KxHM1c3Q-BqaWto7zLtCQcP6wQZFh0fS4ymM3mi2WTA4GjyAmEGxK23s9XuNX0nl0XA8u0Uuiu5Q8qgejWarXanW6nz6AyGUCw2EEAFs8ElyJgWFkQQsliteGtYcUtqAyvjVM0MVxlOYHudca8Dg1FIoXLpdPjdAZyV8qX8aZNBOkpHgAK7M1mkdlzTng1b5db80qIYXOdH4iVSgy4toEx7El5kj6an7U9CkWAAa2IzDmvUmgKYyGtMKKm3tCE0unQ7jTDwMKvMXA0Ht86GUPhLngVGI1lMD2uDYbIVHok1m6UmmAAqtQEwU+cmEamNE43mpTH4-LtXDdcRYDOoLOO1GO-O1lH4q+hkgALMAAY1D-QI9PpRGILLZHLB3OhPaT8MFiAMilxWNUhkHHQ6Hi853XyGkYBSDJsm7W0+3vBANHMJw-BRXYPGdLEcVsRAzHTAJ6naAJlxcUwQg+KRBAgOBZDQXlbwFeREAAWndZCEBo9ccHwIgwDIuEKLKUwnzo-R7gVTQdD8RRTBHRR1yiGI4gSbAxDYu1+xgkVINcb8HDUWiqgcJwPEUeDjgMODGh09dvl+YY5LAyiIPcZFsTghC9iQqpzjUA4FXcLiuOaBoTK1YZaQZJkLLvKy8w8ZxTBzUdItMLh9I8GUiwsNooI6Rp3HVf1qzMnU9QNY1go464MQiqKAjcOLzgSuioPC5TFTHAx1IsYIsvQUygxDUNCpTNR8wzVwMXHLhCS0RLamSnSxTirwxLardd33bBD2PbAev7QcHAOLRjg8UcGl2D0dPQerJRctxml-f91vAxRHzqXRJUxHwVHMKc6KxO4+vnHMzBHZU8KCIA */
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
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
          entry: { type: "spst.speak", params: { utterance: `Hello world!` } },
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
          utterance: `You just said: ${context.lastResult![0].utterance} with ${context.lastResult![0].confidence} confidence. And it ${
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
