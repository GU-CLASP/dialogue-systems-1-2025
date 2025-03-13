import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents, RecognizedEntities } from "./types"; // Import updated types

// Setup the inspector
const inspector = createBrowserInspector();

// Define Azure credentials
const azureCredentials = {
  endpoint: "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://virtual-bot-ana-lab3-vg.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview",
  key: NLU_KEY,
  deploymentName: "Appointment",
  projectName: "Appointment",
};

// Define settings for SpeechState
const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

// Function to extract NLU intent and entities using object mapping
function findNLUIntent(event: any): { intent?: string; entities?: RecognizedEntities } {
  console.log("FULL EVENT OBJECT:", event); // Log the entire event for debugging

  if (!event?.nluValue) {
    console.log("No NLU data found in event.");
    return { intent: undefined, entities: {} };
  }

  const intent = event.nluValue.topIntent || undefined; // Extract intent
  const rawEntities = event.nluValue.entities || []; // Ensure entities are extracted correctly

  console.log("Recognized intent:", intent || "No intent detected");
  console.log("Extracted raw entities:", rawEntities);

  // Use object mapping to extract entities dynamically
  const entityMap: { [key: string]: keyof RecognizedEntities } = {
    meeting_title: "meeting_title",
    meeting_time: "meeting_time",
    participant_name: "participant_name",
    meeting_location: "meeting_location",
    person_name: "person_name",
  };

  const extractedEntities: RecognizedEntities = {
    meeting_title: undefined,
    meeting_time: undefined,
    participant_name: undefined,
    meeting_location: undefined,
    person_name: undefined,
  };

  rawEntities.forEach((entity: any) => {
    if (entity.category in entityMap) {
      extractedEntities[entityMap[entity.category]] = entity.text;
    }
  });

  console.log("Processed entities:", extractedEntities);
  return { intent, entities: extractedEntities };
}

// Define Guards for Intent Transitions
const isCreateMeeting = ({ context }: { context: DMContext }) =>
  Boolean(context.lastResult?.intent === "create_meeting" && context.lastResult?.entities?.meeting_title);

const isWhoIsPerson = ({ context }: { context: DMContext }) =>
  Boolean(context.lastResult?.intent === "who_is_person" && context.lastResult?.entities?.person_name);

// Define the state machine
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
    lastResult: null,
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { 
        CLICK: "Greeting", // Only start when clicking the button
        ASRTTS_READY: "Greeting" // Transition when ready
      },
    },

    Greeting: {
      entry: [
        () => console.log("Bot is in Greeting state, attempting to speak..."),
        { type: "spst.speak", params: { utterance: "What can I do for you today?" } },
        { type: "spst.listen" },
      ],
      on: { SPEAK_COMPLETE: "ListenInput" },
    },

    ListenInput: {
      entry: ({ context }) => {
        console.log("Bot is now listening...");
        context.spstRef.send({ type: "LISTEN", value: { nlu: true } });
      },
      on: {
        RECOGNISED: {
          target: "ProcessIntent",
          actions: assign(({ event }) => {
            const { intent, entities } = findNLUIntent(event);
            console.log("Speech recognized!", intent, entities); // Debugging
            return { lastResult: { intent, entities } };
          }),
        },
      },
    },

    ProcessIntent: {
      always: [
        { guard: isCreateMeeting, target: "ConfirmInfo" },
        { guard: isWhoIsPerson, target: "WhoIsPerson" },
        { target: "CreateMeeting" }, // If no valid intent or entities, fallback
      ],
    },

    CreateMeeting: {
      entry: ({ context }) => {
        console.log("Creating meeting:", context.lastResult?.entities);
      },
      on: { SPEAK_COMPLETE: "ConfirmInfo" },
    },

    WhoIsPerson: {
      entry: ({ context }) => {
        console.log("Looking up information about:", context.lastResult?.entities?.person_name);
      },
      on: { SPEAK_COMPLETE: "Done" },
    },

    Fallback: {
      entry: { type: "spst.speak", params: { utterance: "I didn't understand that. Can you repeat?" } },
      on: { SPEAK_COMPLETE: "Greeting" },
    },
    ConfirmInfo: {
      initial: "Prompt",
      on: { 
        LISTEN_COMPLETE: [
          { target: "Done" }
          
        ]
    },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `Do you want me to ${context.lastResult?.entities?.meeting_title} on ${context.lastResult?.entities?.meeting_time} with ${context.lastResult?.entities?.participant_name}?`,
            }),
          }
        }
      }
    },
    Done: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Do you want me to ${context.lastResult?.entities?.meeting_title} ${context.lastResult?.entities?.meeting_time}  ${context.lastResult?.entities?.participant_name}?`,
        }),
      },
      on: {
        CLICK: "Greeting",
      },
    },
  },
});

// Create the actor
const dmActor = createActor(dmMachine, {
  inspect: inspector.inspect,
}).start();

// Debugging: Log state updates
dmActor.subscribe((state) => {
  console.group("State update");
  console.log("State value:", state.value);
  console.log("State context:", state.context);
  console.groupEnd();
});

// Function to set up the button for user interaction
export function setupButton(element: HTMLButtonElement) {
  element.style.display = "block";
  element.style.cursor = "pointer";
  element.innerHTML = "Speak";

  element.addEventListener("click", () => {
    console.log("Button clicked, sending CLICK event to state machine...");
    dmActor.send({ type: "CLICK" });
  });

  dmActor.subscribe((snapshot) => {
    console.log("State updated:", snapshot.value);
  });
}
