import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents, RecognisedEntities } from "./types";

const inspector = createBrowserInspector();


const azureCredentials = {
  endpoint: "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://language-lab4vavanzan.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview",
  key: NLU_KEY,
  deploymentName: "appointment",
  projectName: "appointment",
};

//const azureSpeechCredentials = {
    //endpoint: "https://northeurope.tts.speech.microsoft.com/cognitiveservices/v1",
    //key: KEY,
  //};
  

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

function findNLUIntent(event: any): { intent?: string; entities?: RecognisedEntities } {
  console.log("FULL EVENT OBJECT:", event); 

  if (!event?.nluValue) {
    console.log("No NLU data found in event.");
    return { intent: undefined, entities: {} };
  }

  const intent = event.nluValue.topIntent || undefined; // Extract intent
  const rawEntities = event.nluValue.entities || []; // Ensure entities are extracted correctly

  console.log("Recognised intent:", intent || "No intent detected");
  console.log("Extracted raw entities:", rawEntities);

  const entityMap: { [key: string]: keyof RecognisedEntities } = {
    meetingTitle: "meetingTitle",
    time: "time",
    personMeeting: "personMeeting",
    place: "place",
    famousPerson: "famousPerson",
    meetingDay: "meetingDay",
  };

  const extractedEntities: RecognisedEntities = {
    meetingTitle: undefined,
    time: undefined,
    personMeeting: undefined,
    place: undefined,
    meetingDay: undefined,
    famousPerson: undefined
  };

  rawEntities.forEach((entity: any) => {
    if (entity.category in entityMap) {
      extractedEntities[entityMap[entity.category]] = entity.text;
    }
  });

  console.log("Processed entities:", extractedEntities);
  return { intent, entities: extractedEntities };
}

const isCreateMeeting = ({ context }: { context: DMContext }) =>
  Boolean(context.lastResult?.intent === "createmeeting" && (context.lastResult?.entities?.meetingTitle || context.lastResult?.entities?.time || context.lastResult?.entities?.personMeeting || context.lastResult?.entities?.place || context.lastResult?.entities?.meetingDay || context.lastResult?.entities?.famousPerson));

const isWhoIsPerson = ({ context }: { context: DMContext }) =>
  Boolean(context.lastResult?.intent === "who_is_person" && context.lastResult?.entities?.personMeeting);


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
        CLICK: "Greeting", 
        ASRTTS_READY: "Greeting" 
      },
    },

    Greeting: {
      entry: [
        () => console.log("Bot is in Greeting state, attempting to speak..."),
        { type: "spst.speak", params: { utterance: "Hey there! What's the adventure today?" } },
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
            console.log("Speech recognised!", intent, entities); 
            return { lastResult: { intent, entities } };
          }),
        },
      },
    },

    ProcessIntent: {
      always: [
        { guard: isCreateMeeting, target: "ConfirmInfo" },
        { guard: isWhoIsPerson, target: "WhoIsPerson" },
        { target: "CreateMeeting" }, 
      ],
    },

    createMeeting: {
      entry: ({ context }) => {
        const { meetingTitle, time, personMeeting, place, meetingDay } = context.lastResult?.entities || {};
        console.log("Creating meeting:", context.lastResult?.entities);
      },
      on: { SPEAK_COMPLETE: "ConfirmInfo" },
    },

    WhoIsPerson: {
      entry: ({ context }) => {
        console.log("Looking up information about:", context.lastResult?.entities?.personMeeting);
      },
      on: { SPEAK_COMPLETE: "Done" },
    },

    Fallback: {
      entry: { type: "spst.speak", params: { utterance: "Sorry. I'm just a bot hahahaha.Can you repeat?" } },
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
              utterance: `Do you want me to ${context.lastResult?.entities?.meetingTitle} on ${context.lastResult?.entities?.time} with ${context.lastResult?.entities?.personMeeting}?`,
            }),
          }
        }
      }
    },
    Done: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Do you want me to ${context.lastResult?.entities?.meetingTitle} ${context.lastResult?.entities?.time}  ${context.lastResult?.entities?.personMeeting}?`,
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
  // Style the button
  Object.assign(element.style, {
    backgroundColor: "red",
    color: "white",
    padding: "20px 40px",
    border: "bold",
    borderRadius: "50px", // More rounded
    cursor: "pointer",
    fontSize: "40px",
    fontWeight: "bold",
  });

  // Hover effect (darker pink)
  element.addEventListener("mouseenter", () => {
    element.style.backgroundColor = "hotpink"; // Darker pink
  });

  element.addEventListener("mouseleave", () => {
    element.style.backgroundColor = "pink";
  });

 
  const appDiv = document.querySelector<HTMLDivElement>("#app");
  if (appDiv) {
    Object.assign(appDiv.style, {
      backgroundColor: "#ffe4e1", 
      padding: "40px",
      textAlign: "center",
    });
  }

  element.addEventListener("click", () => {
    dmActor.send({ type: "CLICK" });
  });

  dmActor.subscribe((snapshot) => {
    const meta: { view?: string } =
      Object.values(snapshot.context.spstRef.getSnapshot().getMeta())[0] || {
        view: undefined,
      };
    element.innerHTML = `${meta.view}`;
  });
}
