import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { DMContext, DMEvents } from "./types";

// Set up the inspector for debugging
const inspector = createBrowserInspector();

// Azure credentials for speech services
const azureCredentials = {
  endpoint: "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

// Speech settings configuration
const settings: Settings = {
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

// Define what each grammar entry might contain
interface GrammarEntry {
  person?: string;
  day?: string;
  time?: string;
  confirmation?: boolean;
}

// Our vocabulary that the system can recognize
const grammar: { [index: string]: GrammarEntry } = {
  // People names
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  stephan: { person: "Stephan"},
  sharon: { person: "Sharon"},
  david: { person: "David" },
  lily: { person: "Lily"},
  
  // Days of the week
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },
  
  // Times
  "9": { time: "9:00" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "12": { time: "12:00" },
  "13": { time: "13:00" },
  "14": { time: "14:00" },
  "15": { time: "15:00" },
  "16": { time: "16:00" },
  "whole day": { time: "whole day" },
  "morning": { time: "9:00"},
  "afternoon": { time: "13:00"},
  "evening": { time: "17:00"},
  
  // Confirmation words
  yes: { confirmation: true },
  yup: { confirmation: true },
  "of course": { confirmation: true },
  no: { confirmation: false },
  nope: { confirmation: false },
  "no way": { confirmation: false },
};


// Check if the utterance in grammar
function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

// Get person name from utterance if it exists
function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

// Get day from utterance if it exists
function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

// Get time from utterance if it exists
function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).time;
}

// Get confirmation (yes/no) from utterance if it exists - boolean
function getConfirmation(utterance: string): boolean | null {
  const confirmation = (grammar[utterance.toLowerCase()] || {}).confirmation;
  if (confirmation === true || confirmation === false) {
    return confirmation;
  }
  return null;
}

// Random responses for when the user doesn't say anything - no input
const noInputResponses = [
  "I'm sorry! I can't hear you.",
  "Sorry, I didn't hear you.",
];

// Random responses for when the user says something not wihtin grammar - invalid response
const invalidInputResponses = [
  "I'm sorry! this isn't in my vocabulary. Please try again",
  "Sorry, Im not sure what you mean. Can you say it differently?",
];

// Get a random response from an array of messages
function getRandomResponse(messageArray: string[]): string {
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
}

// Get a random response for when the user doesn't say anything
function handleNoInput(): string {
  return getRandomResponse(noInputResponses);
}

// Get a random response for when the user says something invalid
function handleInvalidInput(): string {
  return getRandomResponse(invalidInputResponses);
}
// Helper function to update appointment context
function updateAppointment(context: DMContext, key: keyof DMContext["appointment"], value: any) {
  return {
    ...context,
    appointment: {
      ...context.appointment,
      [key]: value,
    },
  };
}


const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
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
  // Initializing stuff within the context
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    //appointment grouping used for end confirmation info
    appointment: {
      name: null,
      date: null,
      time: null,
      wholeDay: null,
      confirmation: null,
    },
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    // Starting state for the speech sys - prepare + wait 
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      on: { CLICK: "Greeting" },
    },
    
    // Greeting user
    Greeting: {
      entry: {
        type: "spst.speak",
        params: { utterance: "Hi! Let's Create an appointment!" },
      },
      on: { 
        // When speaking is done - ask for the person name
        SPEAK_COMPLETE: "AskPersonName" 
      },
    },
    
    // Ask who the appointment is with?
    AskPersonName: {
      initial: "Prompt",
      states: {
        
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: "Who are you meeting with?" },
          },
          on: { 
            // When spekaing is done, start listening to user response
            SPEAK_COMPLETE: "Ask" 
          },
        },
        
        // Listening for user response
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            // If utterance recognised - update the name
            RECOGNISED: {
              actions: assign(({ context, event }) => {
                // Get the person's name from the utterance
                const person = getPerson(event.value[0].utterance);
                
                // Update the appointment context
                return {
                  ...context,
                  appointment: {
                    ...context.appointment,
                    name: person || null,
                  },
                };
              }),
            },
            // When nothing is heard, clear the result
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
        
        // Handling no input from the user
        NoInput: {
          entry: {
            type: "spst.speak",
            params: () => ({ utterance: handleNoInput() }),
          },
          on: { 
            // When speaking is done, try listening again
            SPEAK_COMPLETE: "Ask" 
          },
        },
      },
      on: {
        
        "xstate.init": { target: ".Prompt" },
        
        // When listening is complete
        LISTEN_COMPLETE: [
          {
            // If valid name, then move to next step
            target: "AskDay",
            guard: (state) => state.context.appointment.name !== null,
          },
          {
            // Otherwise, notify user
            target: ".NoInput",
          },
        ],
      },
    },
    
    // Ask for the day of the appointment
    AskDay: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: "On which day is your meeting?" },
          },
          on: { 
            // When speaking is done, start listening to user response
            SPEAK_COMPLETE: "Ask" 
          },
        },
        
        // Listening for user response
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            // If utterance recognized - update the day
            RECOGNISED: {
              actions: assign(({ context, event }) => {
                // Get the day from the utterance
                const day = getDay(event.value[0].utterance);
                
                // Update the appointment context
                return updateAppointment(context, "date", day || null);
              }),
            },
            // When nothing is heard, clear the result
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
        
        // Handling no input from the user
        NoInput: {
          entry: {
            type: "spst.speak",
            params: () => ({ utterance: handleNoInput() }),
          },
          on: { 
            // When speaking is done, try listening again
            SPEAK_COMPLETE: "Ask" 
          },
        },
      },
      on: {
        "xstate.init": { target: ".Prompt" },
        
        // When listening is complete
        LISTEN_COMPLETE: [
          {
            // If valid day, then move to next step
            target: "AskWholeDay",
            guard: (state) => state.context.appointment.date !== null,
          },
          {
            // Otherwise, notify user
            target: ".NoInput",
          },
        ],
      },
    },
    
    // Ask if the appointment takes the whole day
    AskWholeDay: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: "Will it take the whole day?" },
          },
          on: { 
            // When speaking is done, start listening to user response
            SPEAK_COMPLETE: "Ask" 
          },
        },
        
        // Listening for user response
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            // If utterance recognized - update the whole day flag
            RECOGNISED: {
              actions: assign(({ context, event }) => {
                // Get the confirmation from the utterance
                const confirmation = getConfirmation(event.value[0].utterance);
                
                // Update the appointment context
                return updateAppointment(context, "wholeDay", confirmation === true);
              }),
            },
            // When nothing is heard, clear the result
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
        
        // Handling no input from the user
        NoInput: {
          entry: {
            type: "spst.speak",
            params: () => ({ utterance: handleNoInput() }),
          },
          on: { 
            // When speaking is done, try listening again
            SPEAK_COMPLETE: "Ask" 
          },
        },
      },
      on: {
        "xstate.init": { target: ".Prompt" },
        
        // When listening is complete
        LISTEN_COMPLETE: [
          {
            // If confirmed whole day, then move to confirmation
            target: "ConfirmAppointmentWholeDay",
            guard: (state) => state.context.appointment.wholeDay === true,
          },
          {
            // If not whole day, ask for specific time
            target: "AskTime",
            guard: (state) => state.context.appointment.wholeDay === false,
          },
          {
            // Otherwise, notify user
            target: ".NoInput",
          },
        ],
      },
    },
    
    // Ask for the time of the appointment
    AskTime: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: "What time is your meeting?" },
          },
          on: { 
            // When speaking is done, start listening to user response
            SPEAK_COMPLETE: "Ask" 
          },
        },
        
        // Listening for user response
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            // If utterance recognized - update the time
            RECOGNISED: {
              actions: assign(({ context, event }) => {
                // Get the time from the utterance
                const time = getTime(event.value[0].utterance);
                
                // Update the appointment context
                return updateAppointment(context, "time", time || null);
              }),
            },
            // When nothing is heard, clear the result
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
        
        // Handling no input from the user
        NoInput: {
          entry: {
            type: "spst.speak",
            params: () => ({ utterance: handleNoInput() }),
          },
          on: { 
            // When speaking is done, try listening again
            SPEAK_COMPLETE: "Ask" 
          },
        },
      },
      on: {
        "xstate.init": { target: ".Prompt" },
        
        // When listening is complete
        LISTEN_COMPLETE: [
          {
            // If valid time, then move to confirmation
            target: "ConfirmAppointment",
            guard: (state) => state.context.appointment.time !== null,
          },
          {
            // Otherwise, notify user
            target: ".NoInput",
          },
        ],
      },
    },
    
    // Confirm the appointment details (with specific time)
    ConfirmAppointment: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Do you want me to create an appointment with ${context.appointment.name} on ${context.appointment.date} at ${context.appointment.time}?`,
        }),
      },
      on: { 
        // When speaking is done, start listening for confirmation
        SPEAK_COMPLETE: "GetConfirmation" 
      },
    },
    
    // Confirm the appointment details (whole day)
    ConfirmAppointmentWholeDay: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Do you want me to create an appointment with ${context.appointment.name} on ${context.appointment.date} for the whole day?`,
        }),
      },
      on: { 
        // When speaking is done, start listening for confirmation
        SPEAK_COMPLETE: "GetConfirmation" 
      },
    },
    
    // Get the final confirmation from the user
    GetConfirmation: {
      entry: { type: "spst.listen" },
      on: {
        // When the user says something
        RECOGNISED: [
          {
            // If they confirmed, create the appointment
            target: "AppointmentCreated",
            guard: (state) => {
              const utterance = state.event.value[0].utterance;
              const confirmation = getConfirmation(utterance);
              
              // Proceed if the user confirms
              return confirmation === true;
            },
            // Always update the context with whatever was said
            actions: assign(({ context, event }) => {
              const confirmation = getConfirmation(event.value[0].utterance);
              return updateAppointment(context, "confirmation", confirmation || null);
            }),
          },
          {
            // If response negative, start over
            target: "Greeting",
            guard: (state) => {
              const utterance = state.event.value[0].utterance;
              const confirmation = getConfirmation(utterance);
              return confirmation === false;
            },
            // Always update the context 
            actions: assign(({ context, event }) => {
              const confirmation = getConfirmation(event.value[0].utterance);
              return updateAppointment(context, "confirmation", confirmation || null);
            }),
          },
        ],
        // If the user doesn't say anything, ask for confirmation again
        ASR_NOINPUT: {
          target: "GetConfirmation",
          actions: assign({ lastResult: null }),
        }
      }
    },
    
    // Tell the user the appointment has been created
    AppointmentCreated: {
      entry: {
        type: "spst.speak",
        params: { utterance: "Your appointment has been created!" },
      },
      on: { 
        // When speaking is done, go back to the greeting to start over
        SPEAK_COMPLETE: "Greeting" 
      },
    },
    
    
    CheckGrammar: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just said: ${context.lastResult![0].utterance}. And it ${
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