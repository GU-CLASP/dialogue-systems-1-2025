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
  response?:string;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  cristina: {person: "Cristina"},
  emilia: {person:"Emilia"},
  diana:{person:"Diana"},
  today: { day: "today" },
  tomorrow: { day: "tomorrow" },

};


//Create an array to add days dinamically
const daysWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


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

// #Helper functions to capture pieces of information from the user's utterance



// # End of helper functions

// # Guard Functions



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
  context:({spawn}) => ({
    spstRef: spawn(speechstate, {input: settings}),
    lastResult: null,
    personName: null,  
    meetingDate: null,
    meetingTime: null,
  }),
  id: "DM",
  initial:"Prepare",
  states:{
    Prepare:{
      entry:({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on:{
        "ASRTTS_READY":"WaitToStart",
      },},
    WaitToStart:{
      on:{CLICK:"Greeting"},
  },
  Greeting:{
    initial: "Prompt",
    states:{
      Prompt:{
        entry: {type: "spst.speak", 
          params:{utterance: "Hello, who would you like to schedule a meeting with?"}
      },
      on:{SPEAK_COMPLETE:"#DM.Person"},
      },
  },
},
Person:{
  initial:"AskPerson",
  on:{
    LISTEN_COMPLETE:[{
      target: "#DM.Date",
      guard: isValidPerson,

    },
    {target:".AskPerson"

    },
  ],

  },
  states:{
    AskPerson:{
      entry:{
        type:"spst.speak",
        params:{utterance:"Who are you meeting with?"},
        on:{SPEAK_COMPLETE:"GetPerson"},
      },
    },
    GetPerson:{
      entry:{type:"spst.listen"},
      on:{
        RECOGNISED:{
          actions:assign(({ event }) => {
            const person = getPerson(event.value[0]?.utterance);
            
            return { personName: person };
          }),

        },
        ASR_NOINPUT:{
          actions: assign({ personName: null }),

        },
      }
    },
  },
}.


}),

      
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