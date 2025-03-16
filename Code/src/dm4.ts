import { assign, createActor, setup, transition } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
import personInfoData from "./personInfo.json";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint:
    "https://language-lab4.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointment" /** your Azure CLU deployment */,
  projectName: "appointment" /** your Azure CLU project name */,
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

//    Load JSON file containing info about people
const personInfo = personInfoData;

// Define the Entity interface
interface Entity {
  category: string;
  text: string;
}

// Define the Person interface for the Who is X intent
interface Person {
  name: string;
  occupation: string[];
  known_for: string[];
  net_worth: string;
}

// Helper function to extract entities from the NLU 
const extractEntity = (entities: Entity[], category: string): string | null => {
  const entity = entities.find((e) => e.category === category);
  return entity ? entity.text : null;
};

// Create the state machine
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
        value: { nlu: true },
      }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    personName: null,
    meetingDate: null,
    meetingTime: null,
    response: null,
    confirmationMessage: null,
    intent: null,
    answer: null,
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      entry: [
        // Reset all context values when starting
        assign({
          personName: null,
          meetingDate: null,
          meetingTime: null,
          response: null,
          confirmationMessage: null,
          intent: null,
          answer: null,
        }),
      ],
      on: { CLICK: "Greeting" },
    },
    Greeting: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: "Hello, what do you want to do today?" },
          },
          on: { SPEAK_COMPLETE: "#DM.ListenForIntent" },
        },
      },
    },
    // Get the sentence from the user
    ListenForIntent: {
      initial: "GetIntent",
      on: {
        LISTEN_COMPLETE: [
          {
            // If intent is "who is X", go to GetPersonInfo if person is identified
            target: "#DM.GetPersonInfo",
            guard: ({ context }) =>
              context.intent === "who is X" && context.personName !== null,
          },
          {
            // If intent is "who is X", and personName is missing, go to AboutWho
            target: "#DM.AboutWho",
            guard: ({ context }) =>
              context.intent === "who is X" && context.personName === null,
          },
          {
            // If nothing was matched, go to Greeting and ask again 
            target: "#DM.Greeting",
            guard: ({ context }) =>
              context.intent === null &&
              context.personName === null &&
              context.meetingDate === null &&
              context.meetingTime === null,
          },
          {
            // If only intent for creaing meeting is detected, ex: "create meeting"
            target: "#DM.AskForPerson",
            guard: ({ context }) =>
              context.intent === "create meeting" &&
              context.personName === null &&
              context.meetingDate === null &&
              context.meetingTime === null,
          },
          {
            // If only the person name is missing
            target: "#DM.AskForPerson",
            guard: ({ context }) =>
              context.intent === "create meeting" &&
              context.personName === null &&
              context.meetingDate !== null &&
              context.meetingTime !== null,
          },
          {
            // If only time is missing, ask duration
            target: "#DM.GetDuration",
            guard: ({ context }) =>
              context.intent === "create meeting" &&
              context.meetingTime === null &&
              context.personName !== null &&
              context.meetingDate !== null,
          },
          {
            // If only date is missing
            target: "#DM.AskForDate",
            guard: ({ context }) =>
              context.intent === "create meeting" &&
              context.meetingDate === null &&
              context.personName !== null &&
              context.meetingTime !== null,
          },
          {
            // If name and time are missing go to AskPerson first, further from there another guard will deal with time
            target: "#DM.AskForPerson",
            guard: ({ context }) =>
              context.personName === null &&
              context.meetingDate === null &&
              context.meetingTime !== null,
          },
          {
            // If name and date are missing, go to AskPerson first, further from there another guard will deal with date
            target: "#DM.AskForPerson",
            guard: ({ context }) =>
              context.personName === null &&
              context.meetingDate !== null &&
              context.meetingTime === null,
          },
          {
            //If date and time are missing, go first to AskForDate, further from there another guard will deal with time
            target: "#DM.AskForDate",
            guard: ({ context }) =>
              context.personName !== null &&
              context.meetingDate === null &&
              context.meetingTime === null,
          },
          {
            // If everything is matched and we can create the meeting
            target: "#DM.CreateMeeting",
            guard: ({ context }) =>
              context.intent === "create meeting" &&
              context.personName !== null &&
              context.meetingDate !== null &&
              context.meetingTime !== null,
          },
        ],
      },
      states: {
        GetIntent: {
          entry: {
            type: "spst.listen",
          },
          on: {
            RECOGNISED: {
              actions: [
                assign(({ event }) => ({
                  intent: event.nluValue?.topIntent,
                  personName: extractEntity(
                    event.nluValue?.entities,
                    "personName",
                  ),
                  meetingDate: extractEntity(
                    event.nluValue?.entities,
                    "meetingDate",
                  ),
                  meetingTime: extractEntity(
                    event.nluValue?.entities,
                    "meetingTime",
                  ),
                })),
              ],
            },
          },
        },
      },
    },

    // Following states are for Create Meeting intent
    AskForPerson: {
      initial: "AskForPerson",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#DM.CreateMeeting",
            guard: ({ context }) =>
              context.personName !== null &&
              context.meetingDate !== null &&
              context.meetingTime !== null,
          },
          {
            // If after checking the name the time is missing, go ask for Duration
            target: "#DM.GetDuration",
            guard: ({ context }) =>
              context.meetingTime === null &&
              context.personName !== null &&
              context.meetingDate !== null,
          },
          {
            //If after checking the name, the date is missing, go ask for date
            target: "#DM.AskForDate",
            guard: ({ context }) =>
              context.meetingDate === null &&
              context.personName !== null &&
              context.meetingTime !== null,
          },
          {
            //If the person was still not identified,  go back to AskForPerson
            target: ".AskForPerson",
            guard: ({ context }) => context.personName === null,
          },
          {
            //If after getting name the time and date are missing, go to AskForDate
            target: "#DM.AskForDate",
            guard: ({ context }) =>
              context.personName !== null &&
              context.meetingDate === null &&
              context.meetingTime === null,
          },
        ],
      },
      states: {
        AskForPerson: {
          entry: {
            type: "spst.speak",
            params: {
              utterance:
                "I did not get the name. Who would you like to meet with?",
            },
          },
          on: { SPEAK_COMPLETE: "GetPerson" },
        },
        GetPerson: {
          entry: {
            type: "spst.listen",
          },
          on: {
            RECOGNISED: {
              actions: [
                assign(({ event }) => ({
                  personName: extractEntity(
                    event.nluValue?.entities,
                    "personName",
                  ),
                })),
              ],
            },
            ASR_NOINPUT: {
              actions: assign({ personName: null }),
            },
          },
        },
      },
    },
    AskForDate: {
      initial: "AskDate",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#DM.CreateMeeting",
            guard: ({ context }) =>
              context.meetingDate !== null &&
              context.meetingTime !== null &&
              context.personName !== null,
          },
          {
            // if Date present but no time, ask for duration
            target: "#DM.GetDuration",
            guard: ({ context }) =>
              context.meetingDate !== null &&
              context.meetingTime === null &&
              context.personName !== null,
          },

          {
            target: ".AskDate",
          },
        ],
      },
      states: {
        AskDate: {
          entry: {
            type: "spst.speak",
            params: { utterance: "What date do you want to meet?" },
          },
          on: { SPEAK_COMPLETE: "ListenForDate" },
        },

        ListenForDate: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: [
                assign(({ event }) => ({
                  meetingDate: extractEntity(
                    event.nluValue?.entities,
                    "meetingDate",
                  ),
                })),
              ],
            },
            ASR_NOINPUT: {
              actions: [assign({ meetingDate: null })],
            },
          },
        },
      },
    },
    GetDuration: {
      initial: "AskDuration",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#DM.CreateMeeting",
            guard: ({ context }) => {
              return context.response === "yes";
            },
          },
          {
            target: "#DM.AskForTime",
            guard: ({ context }) => {
              console.log("Guard for AskForTime:", context.response === "no"); // Debugging
              return context.response === "no";
            },
          },
          {
            target: ".AskDuration", // Fallback if response is null or invalid
          },
        ],
      },
      states: {
        AskDuration: {
          entry: {
            type: "spst.speak",
            params: {
              utterance:
                "You did not provide a time. Do you want me to schedule it for the whole day?",
            },
          },
          on: { SPEAK_COMPLETE: "GetDuration" },
        },
        GetDuration: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: [
                assign(({ event }) => {
                  if (event.nluValue?.topIntent === "ConfirmMeeting") {
                    const response = event.nluValue?.entities?.some(
                      (e: Entity) => e.text.toLowerCase() === "yes",
                    )
                      ? "yes"
                      : "no";
                    return { response };
                  }
                  return { response: null };
                }),
              ],
            },
            ASR_NOINPUT: {
              actions: [assign({ response: null })],
            },
          },
        },
      },
    },
    AskForTime: {
      initial: "AskTime",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#DM.CreateMeeting",
            guard: ({ context }) => context.meetingTime !== null,
          },
        ],
      },
      states: {
        AskTime: {
          entry: {
            type: "spst.speak",
            params: { utterance: "Great! What time do you want to meet?" },
          },
          on: { SPEAK_COMPLETE: "ListenForTime" },
        },

        ListenForTime: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: [
                assign(({ event }) => ({
                  meetingTime: extractEntity(
                    event.nluValue?.entities,
                    "meetingTime",
                  ),
                })),
              ],
            },
            ASR_NOINPUT: {
              actions: [assign({ meetingTime: null })],
            },
          },
        },
      },
    },

    CreateMeeting: {
      entry: assign({ response: null }),
      initial: "AskConfirmation",
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
              actions: [
                assign(({ event }) => {
                  if (event.nluValue?.topIntent === "ConfirmMeeting") {
                    const response = event.nluValue?.entities?.some(
                      (e: Entity) => e.text.toLowerCase() === "yes",
                    )
                      ? "yes"
                      : "no";
                    return { response };
                  }
                  return { response: null };
                }),
              ],
            },
            ASR_NOINPUT: {
              actions: [assign({ response: null })],
            },
          },
        },
      },
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#DM.ConfirmationDone",
            guard: ({ context }) => {
              return context.response === "yes";
            },
          },
          { target: "#DM.Greeting" },
        ],
      },
    },

    ConfirmationDone: {
      entry: {
        type: "spst.speak",
        params: { utterance: "Your appointment has been created." },
      },
      on: { SPEAK_COMPLETE: "Done" },
    },

    // Code block for the "Who is X" intent
    AboutWho: {
      initial: "AskName",
      on: {
        LISTEN_COMPLETE: [
          { // If a name was identify, retrive the information about the person
            target: "#DM.GetPersonInfo",
            guard: ({ context }) => context.personName !== null,
          },
          { // If name was still not identified, stay in the same state
            target: ".AskName",
          },
        ],
      },
      states: {
        AskName: {
          entry: {
            type: "spst.speak",
            params: {
              utterance:
                "I did not get the name. Who would you like to know about?",
            },
          },
          on: { SPEAK_COMPLETE: "GetName" },
        },
        GetName: {
          entry: {
            type: "spst.listen",
          },
          on: {
            RECOGNISED: {
              actions: [
                assign(({ event }) => ({
                  personName: extractEntity(
                    event.nluValue?.entities,
                    "personName",
                  ),
                })),
              ],
            },
            ASR_NOINPUT: {
              actions: [assign({ personName: null })],
            },
          },
        },
      },
    },

    GetPersonInfo: {
      entry: assign(({ context }) => {
        const person: Person | undefined = personInfo.find(
          (p: Person) => p.name === context.personName,
        );
        let answer; 
        if (person) {
          answer = `${person.name} is a ${person.occupation.join(" and ")}. They are known for ${person.known_for.join(", ")}. Their net worth is ${person.net_worth}.`;
        } else {
          answer = `I don’t have information about ${context.personName}.`;
        }
        return { answer }; 
      }),
      initial: "SpeakInfo",
      states: {
        SpeakInfo: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: context.answer ?? "No information available",
            }),
          },
          on: { SPEAK_COMPLETE: "#DM.Done" }, // Transition to the final Done state
        },
      },
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
