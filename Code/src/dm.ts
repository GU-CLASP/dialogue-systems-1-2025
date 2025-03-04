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
  confirm?: string;
  confirmno?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
    vlad: { person: "Vladislav Maraev" },
    aya: { person: "Nayat Astaiza Soriano" },
    vanessa: { person: "Vanessa Vanzan" },
    tal: { person: "Talha Bedir" },
    anna: { person: "Ana Paula Carvalho" },
    fernanda: { person: "Fernanda Torres" },
    bob : { person: "Bob Smith" },
  
    monday: { day: "Monday" },
    tuesday: { day: "Tuesday" },
    wednesday: { day: "Wednesday" },
    thursday: { day: "Thursday" },
    friday: { day: "Friday" },
  
    9: { time: "9 am" },
    10: { time: "10 am" },
    11: { time: "11 am" },
    13: { time: "13 pm" },
    14: { time: "14 pm" },
    15: { time: "15 pm" },
    16: { time: "16 pm" },
    17: { time: "17 pm" },
    18: { time: "18 pm" },
    19: { time: "19 pm" },
    20: { time: "20 pm" },
  
    yes: { confirm: "yes" },
    sure: { confirm: "yes" },
    okay: { confirm: "yes" },
    ok: { confirm: "yes" },
    ofcourse: { confirm: "yes" },
    absolutely: { confirm: "yes" },
  
    no: { confirm: "no" },
    nope: { confirm: "no" },
    noway: { confirm: "no" },
    never: { confirm: "no" },
  };

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function isPersonInGrammar(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.person !== undefined;
}

function isDayInGrammar(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.day !== undefined;
}

function isTimeInGrammar(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.time !== undefined;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).day;
}

function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).time;
}

function getIfYes(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).confirm === "yes";
}



//const MAX_RETRIES = 2; //new added

//function shouldRetry(context: any) { //new added
  //return (context.retries || 0) < MAX_RETRIES; //new added
//} //new added


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
    lastResult: null, // variable Hypothesis []
    person: null, // variable any
    time: null, // variable any
    date: null, // variable any
    isFullDay: null, // variable any
    confirm: null, // variable any
    
  }),
  id: "DM",
  initial: "Prepare",
  states: {   //the states start here
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
            target: "Greeting",
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Hello! I'm your personal appointment assistant. Can I create an appointment for you?` } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Sorry. Sometimes I can't hear people! I am just a bot trying to help you. Can you repeat that, please?` },
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: [

            {guard: ({ event }) => getIfYes(event.value[0].utterance),
            target: "processanswer"
          },
          { target:  "Prompt" }

              // actions: assign(({ event }) => {
              //   console.log(event.value[0]);
              //   return { lastResult: event.value };
              // }),
            ],
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }), // para acessar esse lastResult preciso especificar onde está a informação.  
            },
          },
        },
      

processanswer: {
  on: {
    LISTEN_COMPLETE: 
  {
        target: "Who",
     
  },
},
},

Who:{
  entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
  on: { SPEAK_COMPLETE: "ListenWho" },
},


ListenWho :{
  entry: { type: "spst.listen" },
  on: {
    RECOGNISED: [

    {guard: ({ event }) => isPersonInGrammar(event.value[0].utterance),
    target: "processWho",
    actions: assign({
       person: ({ event }) => getPerson(event.value[0].utterance) ?? null,

      })},

      { target:  "Prompt" }


      // actions: assign(({ event }) => {
      //   console.log(event.value[0]);
      //   return { lastResult: event.value };
      // }),
    ],
    ASR_NOINPUT: {
      actions: assign({ lastResult: null }), // para acessar esse lastResult preciso especificar onde está a informação.  
    },
  },
},

processWho: {
  on: {
    LISTEN_COMPLETE: 
  {
        target: "askday",
     
  },
},
},

askday: {
  entry: { type: "spst.speak", params: { utterance: `Which day is the meeting on?` } },
  on: { SPEAK_COMPLETE: "Listenday" },
},

Listenday :{
  entry: { type: "spst.listen" },
  on: {
    RECOGNISED: [

    {guard: ({ event }) => isDayInGrammar(event.value[0].utterance),
    target: "processDay",
    actions: assign({
       date: ({ event }) => getDay(event.value[0].utterance) ?? null,

      })},

      { target:  "Prompt" }


      // actions: assign(({ event }) => {
      //   console.log(event.value[0]);
      //   return { lastResult: event.value };
      // }),
    ],
    ASR_NOINPUT: {
      actions: assign({ lastResult: null }), // para acessar esse lastResult preciso especificar onde está a informação.  
    },
  },},

processDay: {
  on: {
    LISTEN_COMPLETE: 
  {
        target: "askIfFullDay",
     
  },
},},

askIfFullDay: {
  entry: { type: "spst.speak", params: { utterance: `Will the meeting take the full day?` } },
  on: { SPEAK_COMPLETE: "listenIfFullDay" },
  },
listenIfFullDay: {
  entry: { type: "spst.listen" },
  on: {
    RECOGNISED: [

    {guard: ({ event }) => getIfYes(event.value[0].utterance),
    target: "processIfFullDayWhenTheAnswerIsYes",
    actions: assign({
       isFullDay: ({ event }) => getIfYes(event.value[0].utterance),

      })},

      { target:  "processIfFullDayWhenTheAnswerIsNo" }


      // actions: assign(({ event }) => {
      //   console.log(event.value[0]);
      //   return { lastResult: event.value };
      // }),
    ],
    ASR_NOINPUT: {
      actions: assign({ lastResult: null }), // para acessar esse lastResult preciso especificar onde está a informação.  
    },
  },},
processIfFullDayWhenTheAnswerIsYes: {
  on: {
    LISTEN_COMPLETE: 
  {
        target: "confirmFullDayMeeting",
     
  },
},},

processIfFullDayWhenTheAnswerIsNo: {
  on: {
    LISTEN_COMPLETE: { target: "asktime"},
},},

asktime: {
  entry: { type: "spst.speak", params: { utterance: `What time is your meeting?` } },
  on: { SPEAK_COMPLETE: "listentime" },
  },

listentime: {
  entry: { type: "spst.listen" },
  on: {
    RECOGNISED: [

    {guard: ({ event }) => isTimeInGrammar(event.value[0].utterance),
    target: "processtime",
    actions: assign({
       time: ({ event }) => getTime(event.value[0].utterance) ?? null,

      })},

      { target:  "Prompt" }

    ],
    ASR_NOINPUT: {
      actions: assign({ lastResult: null }), // para acessar esse lastResult preciso especificar onde está a informação.  
    },
  },},
processtime: {
  on: {
    LISTEN_COMPLETE: 
  {
        target: "confirmSpecificHourMeeting",
     
  },
},},

confirmFullDayMeeting: {
  entry: { type: "spst.speak", params: { utterance: `Do you want to create a full day meeting?` } },
  on: { SPEAK_COMPLETE: "listenconfirmFullDayMeeting" },
  
},

confirmSpecificHourMeeting: {
  entry: { type: "spst.speak", params: { utterance: `Do you want to create a specific hour meeting?` } },
  on: { SPEAK_COMPLETE: "listenconfirmSpecificHourMeeting" },//target: "listenconfirmFullDayMeeting" },
  
},

listenconfirmSpecificHourMeeting: {
  entry: { type: "spst.listen" },
  on: {
    RECOGNISED: [

    {guard: ({ event }) => getIfYes(event.value[0].utterance),
    target: "processconfirm"},
  ]}
},

listenconfirmFullDayMeeting: {
  entry: { type: "spst.listen" },
  on: {
    RECOGNISED: [

    {guard: ({ event }) => getIfYes(event.value[0].utterance),
    target: "processconfirm"},

      { target:  "Prompt" }

    ],
    ASR_NOINPUT: {
      actions: assign({ lastResult: null }), // para acessar esse lastResult preciso especificar onde está a informação.  
    },
  },},

  processconfirm: {
    on: {
    LISTEN_COMPLETE: 
  {
        target: "Done",
     
  },
},
    
  },

Done: {
     entry: {
       type: "spst.speak",
       params: ({ context }) => ({
         utterance: `Great! Your appointment has been created!`,
       }),
     },
     on: {
       CLICK: "#DM.Greeting",

     },

},
     },
  },
},
},
);

const dmActor = createActor(dmMachine, { //dmActor is the name of the actor that will be created because of the createActor function which 
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {  // it will be called every time the state changes
  console.group("State update");
  console.log("State value:", state.value);
  console.log("State context:", state.context);
  console.groupEnd();
});

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