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

function getEntityText(entities: { category: string; text: string }[], targetCategory: string): string | null {
  // Check if entities array is not empty
  if (entities.length === 0) {
    return null;
  }
  // Loop through entities to find the one that matches targetCategory
  for (let entity of entities) {
    if (entity.category === targetCategory) {
      return entity.text; // Return the extracted text
    }
  }
  return null; // Return null if no matching category is found
};

function getPersonIntroduction(person: string | null): string {
  if (!person) return "No person was provided.";
  
  const introduction = grammar[person.toLowerCase()];
  return introduction ? introduction : `I don't have information about ${person}.`;
}

const grammar: {[index: string]: string} = {
  // Technology
  "bill gates": "bill gates is the co-founder of Microsoft and revolutionized personal computing with the Windows operating system.",
  "steve jobs": "steve jobs is the co-founder of Apple Inc. and pioneered iconic products like the iPhone, iPad, and Macintosh computers.",
  "elon musk": "elon musk is the CEO of Tesla and SpaceX, and has made significant contributions to IT through companies like PayPal and his vision for AI.",

  // Music
  "taylor swift": "taylor swift is a globally renowned singer-songwriter known for her storytelling in pop and country music.",
  "beyoncé": "beyoncé is a legendary singer, songwriter, and performer, often referred to as Queen Bey.",
  "ed sheeran": "ed sheeran is a British singer-songwriter known for hits like 'Shape of You' and 'Thinking Out Loud.'",

  // Literature
  "j.k. rowling": "j.k. rowling is the author of the world-famous Harry Potter book series.",
  "stephen hawking": "stephen hawking was a theoretical physicist known for his work on black holes and the book 'A Brief History of Time.'",

  // Film and TV
  "scarlett johansson": "scarlett johansson is a highly acclaimed actress known for her roles in the Marvel Cinematic Universe as Black Widow and in films like Lost in Translation and Marriage Story.",
};

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
  
    person: null,
    day: null,
    time: null,
    confirmation: null,

    utterance: null,
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
        console.log("dfdsfdfdsfsd");  
        console.log("Context:", context);  
        console.log("Event:", event);
      },
      initial: "CreateConversation",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "MakeAppointment",
            // target: "AppointmentCreated",
            // guard: ({ context }) => !!context.lastResult, // right now its value is either "Create a meeting" or "Who is X", a value assigned from event.nluValue.topIntension.
            guard: ({ context }) => !!context.lastResult && context.lastResult === "Create a meeting" && context.utterance === "appointment", // right now its value is either "Create a meeting" or "Who is X", a value assigned from event.nluValue.topIntension.
          },

          {
            // target:"Celebrity",
            target:"Introduction",
            guard: ({ context }) => !!context.lastResult && context.lastResult  === "Who is X" && context.utterance === "introduction", // right now its value is either "Create a meeting" or "Who is X", a value assigned from event.nluValue.topIntension.
            

          },
          { target: ".NoInput" },
        ],
      },
      states: {
        // start the conversation
        CreateConversation: {
          entry: { type: "spst.speak", params: { utterance: `Let's start a conversation! ` } },
          on: { SPEAK_COMPLETE: "AskIntension" },
        },

        AskIntension: {
          entry: { type: "spst.speak", params: { utterance: `Please say 'Appointment' to schedule a meeting, or say 'Introduction' to learn more about a celebrity. 'Appointment' or 'Introuduction'?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! Please say 'Appointment' to schedule a meeting, or say 'Introduction' to learn more about a celebrity.` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },

        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: [
                // 1. Log event.nluValue
                ({ event }) => {
                  console.log("NLU Value:", event.nluValue);
                  // console.log("NLU Value's entitiy's people content:",getEntityText( event.nluValue.entities, "person"));
                  console.log("Event Value:", event.value);
                },
          
                // 2. Assign event.nluValue.topIntent to context.lastResult
                assign({
                  lastResult: ({ event }) => event.nluValue.topIntent,
                  utterance: ({ event }) => event.value[0].utterance.toLocaleLowerCase(),
                }),
          
                // 3. Log the updated context.lastResult and its type
                ({ context }) => {
                  console.log("Updated Context.lastResult:", context.lastResult);
                  console.log("Type of Context.lastResult:", typeof context.lastResult);
                  console.log("Updated Context.utterance:", context.utterance);
                },
              ],
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },

     MakeAppointment: {
      // entry: ({context, event}) => console.log("dfdsfdfdsfsd", context, event),
      entry: ({ context, event }) => {
        console.log("dfdsfdfdsfsd");  
        console.log("Context:", context);  
        console.log("Event:", event);
      },
      initial: "Greeting",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "AppointmentCreated",
            guard: ({ context }) => !!context.lastResult && !!context.person || !!context.day || !!context.time, 
            // guard: ({ context }) => !!context.lastResult && context.utterance === "person", 
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        // start the conversation
        Greeting: {
          entry: { type: "spst.speak", params: { utterance: "Now, let us set up a meeting! " } },
          on: { SPEAK_COMPLETE: "AskPerson" },
        },
        AskPerson: {
          entry: { type: "spst.speak", params: { utterance: `Please say 'Set up a meeting', then plus the person's name, a day and time! ` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! Please say 'Set up a meeting', then plus the person's name, a day and time!Please provide at least one information on person, day and time!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: [
                // 1. Log event.nluValue
                ({ event }) => {
                  console.log("NLU Value:", event.nluValue);
                  console.log("Event Value:", event.value);
                  console.log("NLU Value's entitiy's people content:",getEntityText( event.nluValue.entities, "person"));

                },
          
                // 2. Assign event.nluValue.topIntent to context.lastResult
                assign({
                  lastResult: ({ event }) => event.nluValue.entities,
                }),

                assign({
                 
                  person:  ({ event }) => getEntityText(event.nluValue.entities, "person"),
                  day:  ({ event }) => getEntityText(event.nluValue.entities, "day"),
                  time:  ({ event }) => getEntityText(event.nluValue.entities, "time"),
                  confirmation: null, // Keep it unchanged
                  }),
                        
                // 3. Log the updated context.lastResult and its type
                ({ context }) => {
                  console.log("Updated Context.lastResult:", context.lastResult);
                  // console.log("Type of Context.lastResult:", typeof context.lastResult);
                },
              ],
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },

    Introduction:{
      // entry: ({context, event}) => console.log("dfdsfdfdsfsd", context, event),
      entry: ({ context, event }) => {
        console.log("dfdsfdfdsfsd");  
        console.log("Context:", context);  
        console.log("Event:", event);
      },
      initial: "Greeting",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Celebrity",
            guard: ({ context }) => !!context.lastResult && !!context.person, 
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        // start the conversation
        Greeting: {
          entry: { type: "spst.speak", params: { utterance: "Now, let us get to know a celebrity! " } },
          on: { SPEAK_COMPLETE: "AskPerson" },
        },
        AskPerson: {
          entry: { type: "spst.speak", params: { utterance: `Please say 'Tell me more about', then plus the person's name! ` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! Please say 'Tell me more about', then plus the person's name!Name is necessary here!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: [
                // 1. Log event.nluValue
                ({ event }) => {
                  console.log("NLU Value:", event.nluValue);
                  console.log("Event Value:", event.value);
                  console.log("NLU Value's entitiy's people content:",getEntityText( event.nluValue.entities, "person"));

                },
          
                // 2. Assign event.nluValue.topIntent to context.lastResult
                assign({
                  lastResult: ({ event }) => event.nluValue.entities,
                }),

                assign({       
                  person:  ({ event }) => getEntityText(event.nluValue.entities, "person"),
                  // day: null,// Keep it unchanged
                  // time: null,// Keep it unchanged
                  // confirmation: null, // Keep it unchanged
                  }),
                        
                // 3. Log the updated context.lastResult and its type
                ({ context }) => {
                  console.log("Updated Context.lastResult:", context.lastResult);
                  console.log("context.person:", context.person);
                  // console.log("Type of Context.lastResult:", typeof context.lastResult);
                },
              ],
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
    },


    AppointmentCreated: {
      entry: [
        ({ context, event }) => console.log("Test...", context, event), // Debug log

        ({ context }) => {
          // Base message
          let message = "Your appointment has been created";
    
          // Append details if available
          if (context.person) {
            message += ` with ${context.person}`;
          }
          if (context.day) {
            message += ` on ${context.day}`;
          }
          if (context.time) {
            message += ` at ${context.time}`;
          }
    
          // Finalize with a period
          message += ".";
    
          // Log message for debugging
          console.log("Final Appointment Message:", message);

        },
        
        // Need to figure out how to speach out this updated message
        { 
          type: "spst.speak", 
          params: { utterance: "Your appointment has been created." } 
        },

      ],
      on: { CLICK: "Greeting" },
      
    },



    // this state is for testing, need to be implemented later.
    Celebrity: {
      entry: [
        ({ context }) => console.log(getPersonIntroduction(context.person)), // Debug log
        { 
          type: "spst.speak", 
          params: { utterance: "Celebrity." } 
        }
      ],
      on: { CLICK: "Greeting" },
      
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
