import { assign, createActor, setup, toPromise } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents } from "./types";

const inspector = createBrowserInspector(); 

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};


const azureLanguageCredentials = {
  endpoint: "https://talhanlu.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointmentDeployment" /** your Azure CLU deployment */,
  projectName: "appointment" /** your Azure CLU project name */,
};


const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials /** global activation of NLU */,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 6000,
  locale: "en-US",
  ttsDefaultVoice: "en-GB-MaisieNeural",
};

interface GrammarEntry {
  Person?: string;
  Day?: string;
  Hour?: string;
  confirm?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  //some dummy people
  jane: {Person: "James J. Smith"},
  john: {Person: "John Doe"},
  david: {Person: "Jane Doe"},
  anna: {Person: "Anna Smith"},
  jake: {Person: "Jake Smith"},

  //good side
  frodo: {Person: "Frodo Baggins"}, // I wish the ring had never come to me. I wish none of this had happened.
  sam: {Person: "Samwise Gamgee"}, // I can't carry it for you, but I can carry you. :'(
  gandalf: {Person: "Gandalf the Grey"}, // A wizard is never late, nor is he early, he arrives precisely when he means to.
  aragorn: {Person: "Aragorn"}, // My friends, you bow to no one.
  legolas: {Person: "Legolas"}, // They're taking the hobbits to Isengard!
  gimli: {Person: "Gimli"}, // Nobody tosses a dwarf!
  boromir: {Person: "Boromir"}, // Gondor has no king. Gondor needs no king.
  merry: {Person: "Meriadoc Brandybuck"}, 
  pippin: {Person: "Peregrin Took"},
  bilbo: {Person: "Bilbo Baggins"},
  
  //bad side
  sauron: {Person: "Sauron"}, // Ash nazg durbatulûk, ash nazg gimbatul, ash nazg thrakatulûk agh burzum-ishi krimpatul.
  saruman: {Person: "Saruman"}, // A new power is rising! Its victory is at hand! This night the land will be stained with the blood of Rohan!
  gollum: {Person: "Gollum"}, // My precious! It come to us! It's ours, it is, and we wants it!


  //days
  monDay: { Day: "Monday" },
  tuesDay: { Day: "Tuesday" },
  wednesDay: {Day: "Wednesday"},
  thursDay: {Day: "Thursday"},
  friDay: {Day: "Friday"},
  saturDay: {Day: "Saturday"},
  sunDay: {Day: "Sunday"},

  //times
  "1": { Hour: "1 am" },
  "2": { Hour: "2 am" },
  "3": { Hour: "3 am" },
  "4": { Hour: "4 am" },
  "5": { Hour: "5 am" },
  "6": { Hour: "6 am" },
  "7": { Hour: "7 am" },
  "8": { Hour: "8 am" },
  "9": { Hour: "9 am" },
  "10": { Hour: "10 am" },
  "11": { Hour: "11 am" },
  "12": { Hour: "12 pm" },
  "13": { Hour: "1 pm" },
  "14": { Hour: "2 pm" },
  "15": { Hour: "3 pm" },
  "16": { Hour: "4 pm" },
  "17": { Hour: "5 pm" },
  "18": { Hour: "6 pm" },
  "19": { Hour: "7 pm" },
  "20": { Hour: "8 pm" },
  "21": { Hour: "9 pm" },
  "22": { Hour: "10 pm" },
  "23": { Hour: "11 pm" },
  "24": { Hour: "12 am" },
  "1am": { Hour: "1 am" },
  "2am": { Hour: "2 am" },
  "3am": { Hour: "3 am" },
  "4am": { Hour: "4 am" },
  "5am": { Hour: "5 am" },
  "6am": { Hour: "6 am" },
  "7am": { Hour: "7 am" },
  "8am": { Hour: "8 am" },
  "9am": { Hour: "9 am" },
  "10am": { Hour: "10 am" },
  "11am": { Hour: "11 am" },
  "12pm": { Hour: "12 pm" },
  "1pm": { Hour: "1 pm" },
  "2pm": { Hour: "2 pm" },
  "3pm": { Hour: "3 pm" },
  "4pm": { Hour: "4 pm" },
  "5pm": { Hour: "5 pm" },
  "6pm": { Hour: "6 pm" },
  "7pm": { Hour: "7 pm" },
  "8pm": { Hour: "8 pm" },
  "9pm": { Hour: "9 pm" },
  "10pm": { Hour: "10 pm" },
  "11pm": { Hour: "11 pm" },
  "12am": { Hour: "12 am" },

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

// Now we have to write a function to fetch the person from the grammar from the interpretation in the context.
function getPerson(context: DMContext): string | null {
  if (context.interpreatation) { // If the interpretation exists in the context
    for (const entity of context.interpreatation.entities) { // Loop through the entities in the interpretation
      if (entity.category === "Person") { // If the category of the entity is Person. This is our entity names in the Azure CLU.
        return entity.text; // Return the text of the entity
      }
    }
  }
  return null;
}

// Now we have to write a function to fetch the day from the grammar from the interpretation in the context.
function getDay(context: DMContext): string | null {
  if (context.interpreatation) {
    for (const entity of context.interpreatation.entities) {
      if (entity.category === "Day") {
        return entity.text;
      }
    }
  }
  return null;
}

// Now we have to write a function to fetch the hour from the grammar from the interpretation in the context.
function getHour(context: DMContext): string | null {
  if (context.interpreatation) {
    for (const entity of context.interpreatation.entities) { 
      if (entity.category === "Hour") {
        return entity.text;
      }
    }
  }
  return null;
}


function getConfirm(utterance: string) {
  return grammar[utterance.toLowerCase()]?.confirm;
}

const characterExplanation: Record<string, string> = {

  // good side
  "frodo": "Frodo Baggins is a hobbit of the Shire who inherits the One Ring from his uncle Bilbo Baggins and undertakes the quest to destroy it in the fires of Mount Doom.",
  "sam": "Samwise Gamgee, known as Sam, was a hobbit of the Shire. He was Frodo Baggins' gardener and best friend. Sam proved himself to be Frodo's closest and most dependable companion, the most loyal of the Fellowship of the Ring, and also played a critical role in protecting Frodo and destroying the One Ring.",
  "gandalf": "Gandalf is a wizard, member of the Istari order, as well as leader of the Fellowship of the Ring and the army of the West. He was initially known as Gandalf the Grey, but returns from death as Gandalf the White.",
  "aragorn": "Aragorn II, son of Arathorn. Aragorn was a Ranger of the North, first introduced with the name Strider at Bree, as the Hobbits continued to call him throughout their adventure. He was eventually revealed to be the heir of Isildur and rightful claimant to the thrones of Arnor and Gondor. Oh, and he is terribly handsome.",
  "arwen": "Arwen Undómiel, also known as Evenstar, was an Elf of Rivendell, daughter of Elrond and Celebrían. She was often called Arwen Evenstar, as she was the last of the line of the ancient Elven kings of Middle-earth in the Third Age. No offense, but I think she is out of your league.",
  "legolas": "Legolas was a Sindarin Elf of the Woodland Realm who was part of the Fellowship of the Ring in the Third Age. As he was the son of the Elvenking Thranduil of Mirkwood, Legolas was prince of the Woodland Realm.",
  "gimli": "Gimli, son of Glóin, was a well-respected dwarf warrior in Middle-earth during the Great Years. He was a member of the Fellowship of the Ring and was the only one of the dwarves to readily fight alongside elves in the war against Sauron at the end of the Third Age.",
  "boromir": "Boromir was a valiant warrior known in Gondor for his greatness, having already achieved great merit in Gondor before the War of the Ring. He was the eldest son of Denethor II, who was Steward of Gondor during the War of the Ring.",
  "merry": "Meriadoc Brandybuck, usually called Merry, was a Hobbit and one of Frodo's cousins and closest friends. He was a member of the Fellowship of the Ring.",
  "pippin": "Peregrin Took, commonly known as Pippin, was a Hobbit of the Shire, and one of Frodo Baggins' youngest, but closest friends. He was a member of the Fellowship of the Ring.",
  "bilbo": "Bilbo is a hobbit of the Shire who inherits the One Ring from his cousin Bilbo Baggins and undertakes the quest to destroy it in the fires of Mount Doom. He is a really old hobbit, but he is still alive and kicking. I am not sure if you want to date him though.",

  // bad side
  "sauron": "Sauron? Do you even know who you are talking about? He is the Dark Lord of Mordor, who forged the One Ring to enslave the other. You are really considering to date him? I am not sure if that is a good idea.",
  "saruman": "Ah Saruman... What do I have to say about his treachery? He was the head of the White Council, but he was corrupted by the power of the One Ring. He is not a good person to date, trust me.",
  "gollum": "Gollum is a creature who was once a hobbit-like creature known as Sméagol, but he was corrupted by the One Ring and has since lived in the dark caves beneath the Misty Mountains. If you really consider dating him, I am not sure if I can help you.",

  // some dummy people
  "jane": "Jane is a good person. You would love to meet her.",
  "john": "John is a good person. You would love to meet him.",
  "david": "David is a good person. You would love to meet him.",
  "anna": "Anna is a good person. You would love to meet her.",
  "jake": "Jake is a good person. You would love to meet him.",
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
        value: { nlu: true } // This line is important. It tells the SpeechState machine to use the NLU.
      }),



  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }), // Here we will spawn the SpeechState machine and the value will be stored in the context
    lastResult: null, 
    Person: null, 
    Day: null,
    Hour: null,
    confirm: null,
    interpreatation: null,
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
            target: "WhoIsPerson", 
            guard: ({ context }) => context.interpreatation?.topIntent === "WhoIsPerson", 
            actions: assign(({ context }) => ({ Person: getPerson(context) })),
          },

          { target: "MeetWithPerson", 
            guard: ({ context }) => context.interpreatation?.topIntent === "MeetWithPerson",
            actions: assign(({ context }) => ({ Person: getPerson(context), Day: getDay(context), Hour: getHour(context) })),
          },

          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Welcome to Tinder of Middle Earth. You can ask about people or ask me to organize a meeting with a character, also indicating an hour, and a day. I can also provide information about them.` }, 
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
                return { lastResult: event.value, interpreatation: event.nluValue }; // We will store the interpretation in the context
              }),
            },
            ASR_NOINPUT: { // If the user doesn't say anything, make the lastResult null.
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },

    AskForAnyOtherQuestion: { 
      initial: "Prompt", 
      on: { 
        LISTEN_COMPLETE: [

          {
            target: "WhoIsPerson", 
            guard: ({ context }) => context.interpreatation?.topIntent === "WhoIsPerson", 
            actions: assign(({ context }) => ({ Person: getPerson(context) })),
          },

          { target: "MeetWithPerson", 
            guard: ({ context }) => context.interpreatation?.topIntent === "MeetWithPerson",
            actions: assign(({ context }) => ({ Person: getPerson(context), Day: getDay(context), Hour: getHour(context) })),
          },

          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Do you have any other question? Perhaps you want to arrange a date with one of them on a specific day and hour?` }, 
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
                return { lastResult: event.value, interpreatation: event.nluValue }; // We will store the interpretation in the context
              }),
            },
            ASR_NOINPUT: { // If the user doesn't say anything, make the lastResult null.
              actions: assign({ lastResult: null }), 
            },
          },
        },
      },
    },

    
    WhoIsPerson:{
    entry: {
      type: "spst.speak",
      params: ({ context }) => {
        const person = context.Person;
        if (person) {
          return { utterance: characterExplanation[person.toLowerCase()] || `I don't know who ${person} is. Could you tell me more about them?` };
        } else {
          return { utterance: `You have to indicate the person you want to know more about.` };
        }
      },
    },
  on: { SPEAK_COMPLETE: "AskForAnyOtherQuestion" },
  },

    MeetWithPerson: {
      entry:{
        type: "spst.speak",
        params: ({ context }) => {
          const person = context.Person;
          const day = context.Day;
          const hour = context.Hour;
          if (person && day && hour) {
            return { utterance: `I have arranged a meeting with ${person} on ${day} at ${hour}. I hope you have fun and kill a lot of bad guys together.` };
          } else {
            return { utterance: `You have to indicate the person, date and time to meet with them.` };
          }
        }
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
