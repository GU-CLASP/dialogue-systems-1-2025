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
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person;
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
            guard: ({ context }) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Welcome to the Appoitment setter!` } },
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


  AskWho: { // State for "Who do you want to meet?"
    entry: {
      type: "spst.speak",
      params: { utterance: `Who do you want to meet with?` }
    },
    initial: "Prompt", 
    states: {
      Prompt: {
        on: { SPEAK_COMPLETE: "ListenForWho" }, 
      },
      ListenForWho: { 
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: {
            target: "#DM.GetWho1", /
            actions: assign(({ event }) => {
              const utterance = event.value[0].utterance;
              // have to implement the logic to extract person's name from the utterance but for now i will use a placeholder
              
              const meetingPartnerName = utterance; 
              return { meetingPartnerName }; 
            }),
          },
          ASR_NOINPUT: { target: ".NoInput" }, 
        },
      },
      NoInput: { 
        entry: {
          type: "spst.speak",
          params: { utterance: `Please tell me again who you want to meet with.` }, 
        },
        on: { SPEAK_COMPLETE: "ListenForWho" }, 
      },
    },
    
  },

  // state that validates getwho
  GetWho1: { 
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `You said you want to meet with ${context.meetingPartnerName}. Is that correct?`, // Confirmation
      }),
    },
    // need to Add  transitions to handle validation + "yes/no" responses about the name but i will transition to GetWhen
    
    on: { SPEAK_COMPLETE: "GetWhen" }, 
  },

  GetWhen: { 
    entry: {
      type: "spst.speak",
      params: { utterance: `On which day do you want to meet?` }, 
    },
    initial: "Prompt", 
      Prompt: {
        on: { SPEAK_COMPLETE: "ListenForWhen" }, 
      },
      ListenForWhen: {
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: {
            //transitioning to
            target: "#DM.AskMeetingTime", 
            actions: assign(({ event }) => {
              const utterance = event.value[0].utterance;
              //  have to Implement logic to extract day from utterance
              // 
              const meetingDay = utterance; 
              return { meetingDay }; 
            }),
          },
          ASR_NOINPUT: { target: ".NoInput" }, 
        },
      },
      NoInput: { 
        entry: {
          type: "spst.speak",
          params: { utterance: `Please tell me the day for the meeting.` }, 
        },
        on: { SPEAK_COMPLETE: "ListenForWhen" },
      },
    },
    
  },

  
},



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
