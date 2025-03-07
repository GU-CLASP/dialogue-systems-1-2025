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
  asrDefaultNoInputTimeout: 6000,
  locale: "en-GB",
  ttsDefaultVoice: "en-GB-MaisieNeural",
};

interface GrammarEntry {
  person?: string;
  day?: string;
  time?: string;
  confirm?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  //some dummy people
  james: {person: "James J. Smith"},
  john: {person: "John Doe"},
  jane: {person: "Jane Doe"},

  //good side
  frodo: {person: "Frodo Baggins"}, // I wish the ring had never come to me. I wish none of this had happened.
  sam: {person: "Samwise Gamgee"}, // I can't carry it for you, but I can carry you. :'(
  gandalf: {person: "Gandalf the Grey"}, // A wizard is never late, nor is he early, he arrives precisely when he means to.
  aragorn: {person: "Aragorn"}, // My friends, you bow to no one.
  legolas: {person: "Legolas"}, // They're taking the hobbits to Isengard!
  gimli: {person: "Gimli"}, // Nobody tosses a dwarf!
  boromir: {person: "Boromir"}, // Gondor has no king. Gondor needs no king.
  merry: {person: "Meriadoc Brandybuck"}, 
  pippin: {person: "Peregrin Took"},
  bilbo: {person: "Bilbo Baggins"},

  //bad side
  sauron: {person: "Sauron"}, // Ash nazg durbatulûk, ash nazg gimbatul, ash nazg thrakatulûk agh burzum-ishi krimpatul.
  saruman: {person: "Saruman"}, // A new power is rising! Its victory is at hand! This night the land will be stained with the blood of Rohan!
  gollum: {person: "Gollum"}, // My precious! It come to us! It's ours, it is, and we wants it!

  //me!
  talha: {person: "Talha Bedir"}, // I am also ready for the adventure!

  //days
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: {day: "Wednesday"},
  thursday: {day: "Thursday"},
  friday: {day: "Friday"},
  saturday: {day: "Saturday"},
  sunday: {day: "Sunday"},

  //times
  "1": { time: "1 am" },
  "2": { time: "2 am" },
  "3": { time: "3 am" },
  "4": { time: "4 am" },
  "5": { time: "5 am" },
  "6": { time: "6 am" },
  "7": { time: "7 am" },
  "8": { time: "8 am" },
  "9": { time: "9 am" },
  "10": { time: "10 am" },
  "11": { time: "11 am" },
  "12": { time: "12 pm" },
  "13": { time: "1 pm" },
  "14": { time: "2 pm" },
  "15": { time: "3 pm" },
  "16": { time: "4 pm" },
  "17": { time: "5 pm" },
  "18": { time: "6 pm" },
  "19": { time: "7 pm" },
  "20": { time: "8 pm" },
  "21": { time: "9 pm" },
  "22": { time: "10 pm" },
  "23": { time: "11 pm" },
  "24": { time: "12 am" },

  //confirmations and negations
  "yes": { confirm: "yes" },
  "yeah": { confirm: "yes" },
  "sure": { confirm: "yes" },
  "yep": { confirm: "yes" },
  "yup": { confirm: "yes" },
  "okay": { confirm: "yes" },
  "ok": { confirm: "yes" },
  "alright": { confirm: "yes" },
  "absolutely": { confirm: "yes" },
  "indeed": { confirm: "yes" },
  "correct": { confirm: "yes" },
  "no": { confirm: "no" },
  "nope": { confirm: "no" },
  "nah": { confirm: "no" },
  "not really": { confirm: "no" },
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function isDayInGrammar(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.day !== undefined; // If the day is in the grammar, return true. If not, return false. && means "and". If the first part is false, the second part is not evaluated. So for this to return true, entry has to be truthy and entry.day has to be truthy.
}

function isTimeInGrammar(utterance: string) {
  const entry = grammar[utterance.toLowerCase()];
  return entry && entry.time !== undefined;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
}

function getDay(utterance: string) {
  return grammar[utterance.toLowerCase()]?.day;
}

function getTime(utterance: string) {
  return grammar[utterance.toLowerCase()]?.time;
}

function getConfirm(utterance: string) {
  return grammar[utterance.toLowerCase()]?.confirm;
}


const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    "spst.speak": ({ context }, params: { utterance: string }) => {
      console.log("[DEBUG] Speaking:", params.utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
        },
      });

      context.spstRef.subscribe((state) => {
        if (state.matches('speakFailed')) {
          console.error("TTS failed:", state.context.error);
        }
      });

    },
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
      }),

  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }), // Here we will spawn the SpeechState machine and the value will be stored in the context
    lastResult: null, 
    person: null, 
    day: null,
    time: null,
    isFullDay: null,
  }),
  id: "DM", // This is the ID of the machine. We will use this ID to refer to this machine in the future
  initial: "Prepare", // This is the initial state of the machine
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }), // Type: PREPARE is an event that is sent by the SpeechState machine to prepare the SpeechState machine. Do not confues it with the prepare function of the SpeechState machine.
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
            target: "CheckGrammar", 
            guard: ({ context }) => !!context.lastResult, // If the lastResult is not null, go to CheckGrammar. !! is a shorthand for converting a value to a boolean. If the value is null, it will be false. If it is not null, it will be true.
          },
          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Hello champion! In this meeting you will decide for the future of the ring and the Middle Earth. Who do you want to meet with? Some available fellows are: Bilbo, Frodo, Sam and Legolas. Choose wisely.` }, 
          },
          on: { SPEAK_COMPLETE: "Ask" }, 
        },
        NoInput: {
          entry: {
            type: "spst.speak", 
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { //RECOGNISED is an event that is sent by the SpeechState machine when it recognizes the speech
              actions: assign(({ event }) => {
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: { // If the user doesn't say anything, make the lastResult null.
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },
    CheckGrammar: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You just mentioned our friend ${context.lastResult![0].utterance}. And it ${
            isInGrammar(context.lastResult![0].utterance) ? "is": "is not"} in our lore.`,
        }),
      },
      on: { SPEAK_COMPLETE: [ 
        { target: "ConfirmMeeting", 
          guard: ({ context }) => isInGrammar(context.lastResult![0].utterance),
          actions: assign(({ context }) => ({ person: getPerson(context.lastResult![0].utterance) })), // If the person is in the grammar, save the person in the context to the person field.
        },
        { target: "Greeting" },
      ] }, 
    },


    ConfirmMeeting: { 
      initial: "Prompt", 
      on: { 
        LISTEN_COMPLETE: [
          {
            target: "CheckConfirm", 
            guard: ({ context }) => !!context.lastResult, 
          },
          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `Do you want to meet with ${context.person} after donning your sword and armor?`, 
            }),
          },
          on: { SPEAK_COMPLETE: "Ask" }, 
        },
        NoInput: {
          entry: {
            type: "spst.speak", 
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { 
              actions: assign(({ event }) => {
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: { 
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },
    CheckConfirm: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `I heard that you said ${context.lastResult![0].utterance}. ${getConfirm(context.lastResult![0].utterance) === "yes" ? "Good, I will prepare the ravens!" : "Be more decisive next time."}`,
        }),
      },
      on: { SPEAK_COMPLETE: [ 
        { target: "AskDay", 
          guard: ({ context }) => getConfirm(context.lastResult![0].utterance) === "yes",
        },
        { target: "Greeting" },
      ] }, 
    },



    AskDay: { 
      initial: "Prompt", 
      on: { 
        LISTEN_COMPLETE: [
          {
            target: "CheckDay", 
            guard: ({ context }) => !!context.lastResult, 
          },
          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `Which day will your epic meeting with ${context.person || "our fellow"} take place?`, 
            }),
          },
          on: { SPEAK_COMPLETE: "Ask" }, 
        },
        NoInput: {
          entry: {
            type: "spst.speak", 
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { 
              actions: assign(({ event }) => {
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: { 
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },
    CheckDay:{
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Alright. ${context.lastResult![0].utterance} ${
            isDayInGrammar(context.lastResult![0].utterance) 
            ? "is a good day." 
            : "is a horrible idea."}`,
        }),
      },
      on: { SPEAK_COMPLETE: [ 
        { target: "AskIfFullDay",
          guard: ({ context }) => isDayInGrammar(context.lastResult![0].utterance),
          actions: assign(({ context }) => ({ day: getDay(context.lastResult![0].utterance) })), // If the day is in the grammar, save the day in the context to the day field.
        },
        { target: "AskDay" },
      ] }, 
    },



    AskIfFullDay: {
      initial: "Prompt", 
      on: { 
        LISTEN_COMPLETE: [
          {
            target: "CheckIfFullDay", 
            guard: ({ context }) => !!context.lastResult, 
          },
          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: {utterance: `Will your meeting last the whole day?`},
          },
          on: { SPEAK_COMPLETE: "Ask" }, 
        },
        NoInput: {
          entry: {
            type: "spst.speak", 
            params: { utterance: `I can't hear you! Speak up champion!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { 
              actions: assign(({ event }) => {
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: { 
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },
    CheckIfFullDay:{
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You said ${context.lastResult![0].utterance}. ${
            getConfirm(context.lastResult![0].utterance) === "yes" ? "I am sending the ravens!" : "Alright champion!"}`,
        }),
      },
      on: { SPEAK_COMPLETE: [ 
        { target: "AppointmentForFullDayNotice", 
          guard: ({ context }) => getConfirm(context.lastResult![0].utterance) === "yes",
          actions: assign(({ context }) => ({ isFullDay: true })), // If the day is in the grammar, save the day in the context to the day field.
        },
        { target: "AskHour" },
      ] }, 
    },
    

    AskHour: {
      initial: "Prompt", 
      on: { 
        LISTEN_COMPLETE: [
          {
            target: "CheckHour", 
            guard: ({ context }) => !!context.lastResult, 
          },
          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `At which hour do you want to meet with ${context.person || "your friend"} on ${context.day}?`, 
            }),
          },
          on: { SPEAK_COMPLETE: "Ask" }, 
        },
        NoInput: {
          entry: {
            type: "spst.speak", 
            params: { utterance: `I can't hear you! Speak up champion!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { 
              actions: assign(({ event }) => {
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: { 
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },
    CheckHour:{
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Thanks champion! ${context.lastResult![0].utterance} ${isTimeInGrammar(context.lastResult![0].utterance) ? "is a good time." : "is not time though."}`,
        }),
      },
      on: { SPEAK_COMPLETE: [ 
        { target: "AppointmentForSpecificHourNotice", 
          guard: ({ context }) => isTimeInGrammar(context.lastResult![0].utterance),
          actions: assign(({ context }) => ({ time: getTime(context.lastResult![0].utterance) })), // If the day is in the grammar, save the day in the context to the day field.
        },
        { target: "AskHour" },
      ] }, 
    },


    AppointmentForFullDayNotice: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Saddle your horses! You will meet with ${context.person || "your friend"} on ${context.day} for the whole day.`,
        }),
      },
      on: { SPEAK_COMPLETE: "FinalConfirm" },
    },
    AppointmentForSpecificHourNotice: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `Saddle your horses! You will meet with ${context.person || "your friend"} on ${context.day} at ${context.time}.`,
        }),
      },
      on: { SPEAK_COMPLETE: "FinalConfirm" },
    },

    FinalConfirm: {
      initial: "Prompt", 
      on: { 
        LISTEN_COMPLETE: [
          {
            target: "CheckFinalConfirm", 
            guard: ({ context }) => !!context.lastResult, 
          },
          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: `This is your last chance. After this point, there is no turning back. Do you confirm your high-table meeting with ${context.person || "your friend"}?`, 
            }),
          },
          on: { SPEAK_COMPLETE: "Ask" }, 
        },
        NoInput: {
          entry: {
            type: "spst.speak", 
            params: { utterance: `I can't hear you! Speak up champion!` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { 
              actions: assign(({ event }) => {
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: { 
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },
    CheckFinalConfirm: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: `You said ${context.lastResult![0].utterance}. ${getConfirm(context.lastResult![0].utterance) === "yes" ? "Be there at the time or be eliminated!" : "World is ending and thanks for wasting everybody's time!"}`,
        }),
      },
      on: { SPEAK_COMPLETE: [ 
        { target: "Done", 
          guard: ({ context }) => getConfirm(context.lastResult![0].utterance) === "yes",
        },
        { target: "Greeting" },
      ] },
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
