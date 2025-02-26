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
  cristina: { person: "Cristina" },
  emilia: { person: "Emilia" },
  diana: { person: "Diana" },
  today: { day: "today" },
  tomorrow: { day: "tomorrow" },
};

//Create an array to add days dinamically
const daysWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

daysWeek.forEach((day) => {
  grammar[day] = { day: day };
});

// Create an array to add times dinamically
const hours = [...Array(24).keys()];
const formattedHours = hours.map((hour) => hour.toString().padStart(2, "0"));
formattedHours.forEach((hour) => {
  grammar[hour] = { time: `${hour}:00` };
});

//Create an array with possible positive answers
const positiveAnswers = [
  "yes",
  "sure",
  "yeah",
  "of course",
  "absolutely",
  "definitely",
  "yep",
  "aha",
  "totally",
  "for sure",
  "I agree",
  "sounds good",
];

// Map the positive answers to "yes" and add them to the grammar
positiveAnswers.forEach((response) => {
  grammar[response] = { response: "yes" };
});

// Create an array with possible negative answers
const negativeAnswers = [
  "no",
  "no way",
  "not at all",
  "absolutely not",
  "definitely not",
  "nah",
  "nope",
  "not really",
  "I am afraid not",
  "negative",
];

// Map the negative answers to "no" and add them to the grammar
negativeAnswers.forEach((response) => {
  grammar[response] = { response: "no" };
});



// # Guard Functions
const isValidGrammar = (
  key: keyof GrammarEntry,
  contextProperty: keyof DMContext,
) => {
  return ({ context }: { context: DMContext }) => {
    const value =
      typeof context[contextProperty] === "string"
        ? context[contextProperty].toLowerCase()
        : null; // Get the value from context
    const isValid = value
      ? Object.values(grammar).some(
          (entry) => entry[key]?.toLowerCase() === value,
        ) // Check if the value exists in grammar for the given key
      : false;

    return isValid;
  };
};

const isValidResponse = (expectedResponse: string) => {
  return ({ context }: { context: DMContext }) => {
    const response = context.response?.toLowerCase();
    return response === expectedResponse;
  };
};

// #End of Guard Functions

const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    "spst.speak": ({ context }, params: { utterance: string }) =>
      context.spstRef.send({
        type: "SPEAK",
        value: { utterance: params.utterance },
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
    personName: null,
    meetingDate: null,
    meetingTime: null,
    response: null,
    confirmationMessage: null,
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
            params: { utterance: "Hello Friend! Let's create an appointment." },
          },
          on: { SPEAK_COMPLETE: "#DM.Person" },
        },
      },
    },
    Person: {
      initial: "AskPerson",
      on: {
        LISTEN_COMPLETE: [
          { target: "#DM.Date", guard: isValidGrammar("person", "personName") },
          { target: ".AskPerson" },
        ],
      },
      states: {
        AskPerson: {
          entry: {
            type: "spst.speak",
            params: { utterance: "Who are you meeting with?" },
          },
          on: { SPEAK_COMPLETE: "GetPerson" },
        },
        GetPerson: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                const utterance = event.value[0]?.utterance;
                const person = parseUtteranceForCategory(
                  utterance,
                  grammar,
                  "person",
                );
                return { personName: person };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ personName: null }),
            },
          },
        },
      },
    },
    Date: {
      initial: "AskDate",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#DM.Duration",
            guard: isValidGrammar("day", "meetingDate"),
          },
          { target: ".AskDate" },
        ],
      },
      states: {
        AskDate: {
          entry: {
            type: "spst.speak",
            params: { utterance: "What day is the meeting?" },
          },
          on: { SPEAK_COMPLETE: "GetDate" },
        },
        GetDate: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                const utterance = event.value[0]?.utterance;
                const date = parseUtteranceForCategory(
                  utterance,
                  grammar,
                  "day",
                );
                return { meetingDate: date };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ meetingDate: null }),
            },
          },
        },
      },
    },
    Duration: {
      initial: "AskDuration",
      on: {
        LISTEN_COMPLETE: [
          { target: "#DM.Confirmation", guard: isValidResponse("yes") },
          { target: "#DM.Time", guard: isValidResponse("no") },
          { target: ".AskDuration" },
        ],
      },
      states: {
        AskDuration: {
          entry: {
            type: "spst.speak",
            params: { utterance: "Will it take the whole day?" },
          },
          on: { SPEAK_COMPLETE: "GetDuration" },
        },
        GetDuration: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                const utterance = event.value[0]?.utterance;
                const response = parseUtteranceForCategory(
                  utterance,
                  grammar,
                  "response",
                );
                return { meetingTime: response };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ meetingTime: null }),
            },
          },
        },
      },
    },
    Time: {
      initial: "AskTime",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#DM.Confirmation",
            guard: isValidGrammar("time", "meetingTime"),
          },
          { target: ".AskTime" },
        ],
      },
      states: {
        AskTime: {
          entry: {
            type: "spst.speak",
            params: { utterance: "What time is your meeting?" },
          },
          on: { SPEAK_COMPLETE: "GetTime" },
        },
        GetTime: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                const utterance = event.value[0]?.utterance;
                const time = parseUtteranceForCategory(
                  utterance,
                  grammar,
                  "time",
                );
                return { meetingTime: time };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ meetingTime: null }),
            },
          },
        },
      },
    },
    Confirmation: {
      initial: "AskConfirmation",
      entry: assign({ response: null }),
      on: {
        LISTEN_COMPLETE: [
          { target: "#DM.ConfirmationDone", guard: isValidResponse("yes") },
          { target: "#DM.Person" },
        ],
      },
      states: {
        AskConfirmation: {
          entry: [
            assign(({ context }) => ({
              confirmationMessage: context.meetingTime
                ? `Do you want me to create an appointment with ${context.personName} on ${context.meetingDate} at ${context.meetingTime}?`
                : `Do you want me to create an appointment with ${context.personName} on ${context.meetingDate} for the whole day?`,
            })),
            {
              type: "spst.speak",
              params: ({ context }) => ({
                utterance:
                  context.confirmationMessage ||
                  "Confirmation message not available",
              }),
            },
          ],
          on: { SPEAK_COMPLETE: "GetConfirmation" },
        },
        GetConfirmation: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                const utterance = event.value[0]?.utterance;
                const response = parseUtteranceForCategory(
                  utterance,
                  grammar,
                  "response",
                );
                return { response: response };
              }),
            },
          },
        },
      },
    },
    ConfirmationDone: {
      entry: {
        type: "spst.speak",
        params: { utterance: "Your appointment has been created." },
      },
      on: { SPEAK_COMPLETE: "Done" },
    },
    Done: {
      on: { CLICK: "#DM.Greeting" },
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
