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
  today: { day: "Today" },
  tomorrow: { day: "Tomorrow" },

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

function getName(utterance: string) {
  const normalizedUtterance = utterance.toLowerCase();

  for (const key in grammar) {
    //to find if the key is in the utterance
    if (normalizedUtterance.includes(key)) {
      return grammar[key].person;
    }
  }

  return undefined;
}

function getDay(utterance: string) {
  const normalizedUtterance = utterance.toLowerCase();

  for (const key in grammar) {
    if (normalizedUtterance.includes(key)) {
      return grammar[key].day;
    }
  }

  return undefined;
}

function getConfirm(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).response;
}

function getTime(utterance: string) {
  const normalizedUtterance = utterance.toLowerCase();

  for (const key in grammar) {
    if (normalizedUtterance.includes(key)) {
      return grammar[key].time;
    }
  }

  return undefined;
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
      on: { SPEAK_COMPLETE: "Booking" },
    },
    Booking: {
      initial: "askName",
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => ({
            lastResult: event.value,
          })),
        },
        ASR_NOINPUT: {
          actions: assign({ lastResult: null }),
        },
        CLICK: "Done",
      },
      states: {
        askName: {
          initial: "Prompt",
          states: {
            Prompt: {
              entry: {
                type: "spst.speak",
                params: { utterance: `Who are you meeting with?` },
              },
              on: { SPEAK_COMPLETE: "getName" },
            },
            getName: {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.askDate",
                    guard: ({ context }) => {
                      const person = getName(context.lastResult![0].utterance);
                      if (person) {
                        context.person = person;
                        return true;
                      }
                      return false;
                    },
                  },
                  { target: "Prompt" },
                ],
              },
            },
          },
        },
        askDate: {
          initial: "Prompt",
          states: {
            Prompt: {
              entry: {
                type: "spst.speak",
                params: { utterance: `On which day is your meeting?` },
              },
              on: { SPEAK_COMPLETE: "getDate" },
            },
            getDate: {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.askDuration",
                    guard: ({ context }) => {
                      const day = getDay(context.lastResult![0].utterance);
                      if (day) {
                        context.day = day;
                        return true;
                      }
                      return false;
                    },
                  },
                  { target: "Prompt" },
                ],
              },
            },
          },
        },
        askDuration: {
          initial: "Prompt",
          states: {
            Prompt: {
              entry: {
                type: "spst.speak",
                params: { utterance: `Will it take a whole day?` },
              },
              on: { SPEAK_COMPLETE: "getDuration" },
            },
            getDuration: {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "wholedayConfirm",
                    guard: ({ context }) =>
                      getConfirm(context.lastResult![0].utterance) === true,
                  },
                  {
                    target: "#DM.Booking.askTime",
                    guard: ({ context }) =>
                      getConfirm(context.lastResult![0].utterance) === false,
                  },
                  { target: "Prompt" },
                ],
              },
            },
            wholedayConfirm: {
              entry: ({ context }) => {
                const person = context.person;
                const day = context.day;
                const utterance = `Do you want me to create an appointment with ${person} on ${day} for the whole day?`;
                return { type: "spst.speak", params: { utterance } };
              },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.finalConfirm",
                    guard: ({ context }) =>
                      getConfirm(context.lastResult![0].utterance) === true,
                  },
                  { target: "#DM.Booking.askName" },
                ],
              },
            },
          },
        },
        askTime: {
          initial: "Prompt",
          states: {
            Prompt: {
              entry: {
                type: "spst.speak",
                params: { utterance: `What time is your meeting?` },
              },
              on: { SPEAK_COMPLETE: "getTime" },
            },
            getTime: {
              entry: { type: "spst.listen" },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.askTime.timeConfirm",
                    guard: ({ context }) => {
                      const time = getTime(context.lastResult![0].utterance);
                      if (time) {
                        context.time = time;
                        return true;
                      }
                      return false;
                    },
                  },
                  { target: "Prompt" },
                ],
              },
            },
            timeConfirm: {
              entry: ({ context }) => {
                const person = context.person;
                const day = context.day;
                const time = context.time;
                const utterance = `Do you want me to create an appointment with ${person} on ${day} at ${time}?`;

                return { type: "spst.speak", params: { utterance } };
              },
              on: {
                LISTEN_COMPLETE: [
                  {
                    target: "#DM.Booking.finalConfirm",
                    guard: ({ context }) =>
                      getConfirm(context.lastResult![0].utterance) === true,
                  },
                  { target: "#DM.Booking.askName" },
                ],
              },
            },
          },
        },
        finalConfirm: {
          entry: {
            type: "spst.speak",
            params: {
              utterance: "Your appointment has been created!",
            },
          },
          on: {
            SPEAK_COMPLETE: "#DM.Done",
          },
        },
      }, //booking states
    },
    Done: {
      on: {
        CLICK: {
          target: "Greeting",
          actions: assign({ time: null, person: null, day: null }),
        },
      },
    },
  }, //DM states
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
