import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
//import { DMContext, DMEvents, nluResponse } from "./types";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://language-resource-06253.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  // endpoint: "https://language-resource-06253.cognitiveservices.azure.com/" /** If that doesn't work, then switch to the base URL: */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointment" /** your Azure CLU deployment */,
  projectName: "appointment" /** your Azure CLU project name */,
};


const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials /** global activation of NLU */,
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
  confirmation?: string; // Whether the meeting is for the whole day
}

// Define the grammar for recognizing relevant words and phrases
const grammar: { [index: string]: GrammarEntry } = {
  // People
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  taylor: { person: "Taylor Swift"},

  // Days
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },

  // Times
  "9": { time: "09:00" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "12": { time: "12:00" },
  "13": { time: "13:00" },
  "14": { time: "14:00" },
  "15": { time: "15:00" },
  "16": { time: "16:00" },
  "17": { time: "17:00" },
  "18": { time: "18:00" },

  // Confirmation
  yes: { confirmation: "yes" },
  "of course": { confirmation: "yes" },

  no: { confirmation: "no" },
  "no way": { confirmation: "no" },
};

// const grammar: {[index: string]: string} = {
//   // Technology
//   "bill gates": "bill gates is the co-founder of Microsoft and revolutionized personal computing with the Windows operating system.",
//   "steve jobs": "steve jobs is the co-founder of Apple Inc. and pioneered iconic products like the iPhone, iPad, and Macintosh computers.",
//   "elon musk": "elon musk is the CEO of Tesla and SpaceX, and has made significant contributions to IT through companies like PayPal and his vision for AI.",

//   // Music
//   "taylor swift": "taylor swift is a globally renowned singer-songwriter known for her storytelling in pop and country music.",
//   "beyoncé": "beyoncé is a legendary singer, songwriter, and performer, often referred to as Queen Bey.",
//   "ed sheeran": "ed sheeran is a British singer-songwriter known for hits like 'Shape of You' and 'Thinking Out Loud.'",

//   // Literature
//   "j.k. rowling": "j.k. rowling is the author of the world-famous Harry Potter book series.",
//   "stephen hawking": "stephen hawking was a theoretical physicist known for his work on black holes and the book 'A Brief History of Time.'",

//   // Film and TV
//   "scarlett johansson": "scarlett johansson is a highly acclaimed actress known for her roles in the Marvel Cinematic Universe as Black Widow and in films like Lost in Translation and Marriage Story.",
// };

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}
// Add helper function to extract information 

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).time;
}

function getConfirmation(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).confirmation;
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
        value: { nlu: true } /** Local activation of NLU . This enables RECOGNISED events to contain NLU results (accessible via event.nluValue).*/,
      }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    appointment: {
      person: null,
      day: null,
      time: null,
      confirmation: null,
    },
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
      // entry: ({context, event}) => console.log("dfdsfdfdsfsd", context, event),
      entry: ({ context, event }) => {
        console.log("Test...");  
        console.log("Context:", context);  
        console.log("Event:", event);
      },
      initial: "Createconversation",
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
        // start the conversation
        Createconversation: {
          entry: { type: "spst.speak", params: { utterance: `Let's create an appointment! ` } },
          on: { SPEAK_COMPLETE: "AskPerson" },
        },

        AskPerson: {
          entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! Who are you meeting with?` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },

        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: [
                ({ event }) => {
                  console.log("NLU Value:", event.nluValue); // Log event.nluValue
                },
                assign(({ event }) => {
                  return { lastResult: event.value };
                }),
              ],
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },
    
    CheckGrammar: {
      entry: [
        // Assign extracted information from user's input to the context
        assign(({ context }) => {
          // Get the latest recognized speech (convert it to lowercase for consistency)
          const utterance = context.lastResult?.[0]?.utterance.toLowerCase() || "";
    
          return {
            appointment: {
              ...context.appointment, // Keep existing appointment details
              person: getPerson(utterance) || context.appointment.person, // Extract name if available
            },
          };
        }),
    
        // Speak out the recognized utterance and check if it's in the grammar list
        { 
          type: "spst.speak",
          params: ({ context }) => ({
            utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
              isInGrammar(context.lastResult![0].utterance) ? "is" : "is not"
            } in your given list.`,
          }),
        },
      ],
      
      on: {
        SPEAK_COMPLETE: [
          {
            // target: "Step2AskDay", 
            target: "AppointmentCreated", 
            guard: ({ context }) => !!context.appointment.person, // Only proceed if a valid person is assigned
          },
          {
            target: "Greeting.AskPerson", // Go back to ask again if no valid person was found
          },
        ],
      },
    },
    


    AppointmentCreated: {
      entry: [
        ({ context, event }) => console.log("Test...", context, event), // Debug log
        { 
          type: "spst.speak", 
          params: { utterance: "Your appointment has been created." } 
        }
      ],
      on: { CLICK: "Done" },
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
  console.debug("State value:", state.value);
  console.debug("State context:", state.context);
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
