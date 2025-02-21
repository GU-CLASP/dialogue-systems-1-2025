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
  whole?: string;
  decision?: string;
  menu?: string;
  intent: string;
  entities: {
    [index: string]: string;
  };
};


const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },

  "karoake night": {
    intent: "None",
    entities: { title: "Karaoke night" },
  },
  lunch: {
    intent: "None",
    entities: { title: "Lunch at Mercado" },
  },
  "on friday": {
    intent: "None",
    entities: { day: "Friday" },
  },
  "at 8:00 am": {
    intent: "None",
    entities: { time: "8:00 AM" },
  },
  "at 9:00 am": {
    intent: "None",
    entities: { time: "9:00 AM" },
  },
  "at 10:00 am": {
    intent: "None",
    entities: { time: "10:00 AM" },
  },
  "at 11:00 am": {
    intent: "None",
    entities: { time: "11:00 AM" },
  },
  "at noon": {
    intent: "None",
    entities: { time: "12:00 PM" },
  },
  "at 12:00 am": {
    intent: "None",
    entities: { time: "12:00 PM" },
  },
  "at 1:00 pm": {
    intent: "None",
    entities: { time: "1:00 PM" },
  },
  "at 2:00 pm": {
    intent: "None",
    entities: { time: "2:00 PM" },
  },
  "at 3:00 pm": {
    intent: "None",
    entities: { time: "3:00 PM" },
  },
  "at 4:00 pm": {
    intent: "None",
    entities: { time: "4:00 PM" },
  },
  "at 5:00 pm": {
    intent: "None",
    entities: { time: "5:00 PM" },
  },
  "at 6:00 pm": {
    intent: "None",
    entities: { time: "6:00 PM" },
  },
  "at 7:00 pm": {
    intent: "None",
    entities: { time: "7:00 PM" },
  },
  "on monday": {
    intent: "None",
    entities: { day: "Monday" },
  },
  "on tuesday": {
    intent: "None",
    entities: { day: "Tuesday" },
  },
  "on wednesday": {
    intent: "None",
    entities: { day: "Wednesday" },
  },
  "on thursday": {
    intent: "None",
    entities: { day: "Thursday" },
  },
  "on saturday": {
    intent: "None",
    entities: { day: "Saturday" },
  },
  "on sunday": {
    intent: "None",
    entities: { day: "Sunday" },
  },
  "yes": {
    intent: "None",
    entities: { whole: "Yes", decision: "Yes", meeting: "Yes" },
  },
  "no": {
    intent: "None",
    entities: { whole: "No", decision: "No", meeting: "No" },
  },
  "create a meeting": {
    intent: "None",
    entities: { menu: "meeting" },

    yes: { whole: "Yes", decision: "Yes", meeting: "Yes" },
    yeah: { whole: "Yes", decision: "Yes", meeting: "Yes" },
    yep: { whole: "Yes", decision: "Yes", meeting: "Yes" },
    no: { whole: "No", decision: "No", meeting: "No" },
    nope: { whole: "No", decision: "No", meeting: "No" },
    "create a meeting": { menu: "meeting" },
    "set up a meeting": { menu: "meeting" },
    "book a meeting": { menu: "meeting" },
  };






  function isInGrammar(utterance: string) {
    return utterance.toLowerCase() in grammar;
  }


  // function for getEntity
  function getEntity(utterance: string, entityType: keyof GrammarEntry) { // <--- Function Definition
    return (grammar[utterance.toLowerCase()] || {})[entityType];
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
    actions: {
      "spst.speak": ({ context }, params: { utterance: string }) =>
        context.spstRef.send({
          type: "SPEAK",
          value: {
            utterance: params.utterance,
          },
        }),
      },

      "spst.listen": ({ context }) =>
        context.spstRef.send({
          type: "LISTEN",
        }),

      "assignMeetingPartner": assign(({ event }) => {
        const utterance = event.value[0].utterance;
        return { meetingPartnerName: getEntity(utterance, 'person') || utterance };
      }),
      "assignMeetingDay": assign(({ event }) => {
        const utterance = event.value[0].utterance;
        return { meetingDay: getEntity(utterance, 'day') || utterance };
      }),
      "assignMeetingTime": assign(({ event }) => {
        const utterance = event.value[0].utterance;
        return { meetingTime: getEntity(utterance, 'time') || utterance };
      }),
      "assignWholeDay": assign(({ event }) => {
        const utterance = event.value[0].utterance;
        return { wholeDayAppointment: getEntity(utterance, 'whole') === 'Yes' };
      }),
      "assignDecision": assign(({ event }) => {
        const utterance = event.value[0].utterance;
        return { finalDecision: getEntity(utterance, 'decision') === 'Yes' };
      }),

      "clearContext": assign({
        meetingPartnerName: null,
        meetingDay: null,
        meetingTime: null,
        wholeDayAppointment: false,
        finalDecision: false,
        lastResult: null,
      }),

    },

  }).createMachine({
    context: ({ spawn }): DMContext => ({
      spstRef: spawn(speechstate, { input: settings }),
      lastResult: null,
      meetingPartnerName: null,
      meetingDay: null,
      meetingTime: null,
      wholeDayAppointment: false,
      finalDecision: false

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
              target: "AskMenu",
              guard: ({ context }) => !!context.lastResult && isInGrammar(context.lastResult![0].utterance),
            },
            { target: ".NoInput" },
          ],
        },
        states: {
          Prompt: {
            entry: { type: "spst.speak", params: { utterance: `Welcome to the Appoitment setter! Would you like to create a meeting` } },
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
            utterance: `You just said: ${context.lastResult![0].utterance}. And it ${isInGrammar(context.lastResult![0].utterance) ? "is" : "is not"
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

AskMenu: { 
    entry: {
      type: "spst.speak",
      params: { utterance: `What do you want to do? You can say "Create a meeting".` },
    },
    initial: "Prompt",
    states: {
      Prompt: {
        on: { SPEAK_COMPLETE: "ListenForMenu" },
      },
      ListenForMenu: {
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: [
            {
              target: "#DM.info_meeting",
              cond: ({ event }) => getEntity(event.value[0].utterance, "menu") === "meeting",
            },
            {
              target: ".NoInputMenu",
            },
          ],
          ASR_NOINPUT: { target: ".NoInputMenu" },
        },
      },
      NoInputMenu: {
        entry: {
          type: "spst.speak",
          params: { utterance: `Sorry, I didn't catch that. You can say "Create a meeting" to book an appointment.` },
        },
        on: { SPEAK_COMPLETE: "ListenForMenu" },
      },
    },
  },

  info_meeting: {
    entry: {
      type: "spst.speak",
      params: { utterance: "OK, let's create a meeting. Who are you meeting with?" },
    },
    on: { SPEAK_COMPLETE: "getName" },
  },
  getName: {
    initial: "prompt",
    states: {
      prompt: {
        entry: { type: "spst.speak", params: { utterance: "Who are you meeting with?" } },
        on: { SPEAK_COMPLETE: "ask" },
      },
      ask: {
        entry: { type: "spst.listen" },
      },
      nomatch: {
        entry: {
          type: "spst.speak",
          params: { utterance: "Sorry, I didn't catch the name. Could you repeat it?" },
        },
        on: { SPEAK_COMPLETE: "ask" },
      },
    },
    on: {
      RECOGNISED: [
        {
          target: "info_name",
          actions: "assignMeetingPartner",
          cond: ({ event }) => !!getEntity(event.value[0].utterance, "person") || !!event.value[0].utterance,
        },
        {
          target: ".nomatch",
        },
      ],
      TIMEOUT: ".prompt",
    },
  },

  info_name: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `OK, meeting with ${context.meetingPartnerName}. On which day is your meeting?`,
      }),
    },
    on: { SPEAK_COMPLETE: "day" },
  },
  day: {
    initial: "prompt",
    states: {
      prompt: {
        entry: { type: "spst.speak", params: { utterance: "On which day is it?" } },
        on: { SPEAK_COMPLETE: "ask" },
      },
      ask: {
        entry: { type: "spst.listen" },
      },
      nomatch: {
        entry: {
          type: "spst.speak",
          params: { utterance: "Sorry, I don't understand which day you are referring to." },
        },
        on: { SPEAK_COMPLETE: "ask" },
      },
    },
    
    on: {
      RECOGNISED: [
        {
          target: "info_day",
          actions: "assignMeetingDay",
          cond: ({ event }) => !!getEntity(event.value[0].utterance, "day") || !!event.value[0].utterance,
        },
        {
          target: ".nomatch",
        },
      ],
      TIMEOUT: ".prompt",
    },
  },
  info_day: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `OK, ${context.meetingDay}. Will it take the whole day?`,
      }),
    },
    on: { SPEAK_COMPLETE: "whole" },
  },
  whole: {
    initial: "prompt",
    states: {
      prompt: {
        entry: { type: "spst.speak", params: { utterance: "Will it take the whole day?" } },
        on: { SPEAK_COMPLETE: "ask" },
      },
      ask: {
        entry: { type: "spst.listen" },
      },
      nomatch: {
        entry: {
          type: "spst.speak",
          params: { utterance: "Sorry, I don't understand your answer. Please answer yes or no." },
        },
        on: { SPEAK_COMPLETE: "ask" },
      },
    },
    on: {
      RECOGNISED: [
        {
          target: "info_whole",
          cond: ({ event }) => getEntity(event.value[0].utterance, "whole") === "Yes",
          actions: "assignWholeDay",
        },
        {
          target: "info_whole_no",
          cond: ({ event }) => getEntity(event.value[0].utterance, "whole") === "No",
          actions: "assignWholeDay",
        },
        {
          target: ".nomatch",
        },
      ],
      TIMEOUT: ".prompt",
    },
  },
  info_whole_no: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `OK, not the whole day. What time is your meeting?`,
      }),
    },
    on: { SPEAK_COMPLETE: "time" },
  },
  time: {
    initial: "prompt",
    states: {
      prompt: {
        entry: { type: "spst.speak", params: { utterance: "What time is your meeting?" } },
        on: { SPEAK_COMPLETE: "ask" },
      },
      ask: {
        entry: { type: "spst.listen" },
      },
      nomatch: {
        entry: {
          type: "spst.speak",
          params: { utterance: "Sorry, I don't understand what time you are referring to." },
        },
        on: { SPEAK_COMPLETE: "ask" },
      },
    },
    on: {
      RECOGNISED: [
        {
          target: "final_time_ask",
          actions: "assignMeetingTime",
          cond: ({ event }) => !!getEntity(event.value[0].utterance, "time") || !!event.value[0].utterance,
        },
        {
          target: ".nomatch",
        },
      ],
      TIMEOUT: ".prompt",
    },
  },
  final_time_ask: {
    initial: "prompt",
    states: {
      prompt: {
        entry: {
          type: "spst.speak",
          params: ({ context }) => ({
            utterance: `Do you want me to create a meeting with ${context.meetingPartnerName} on ${context.meetingDay} at ${context.meetingTime}?`,
          }),
        },
        on: { ENDSPEECH: "ask" },
      },
      ask: {
        entry: { type: "spst.listen" },
      },
      nomatch: {
        entry: {
          type: "spst.speak",
          params: { utterance: "Sorry, please confirm again if you want to create the meeting." },
        },
        on: { SPEAK_COMPLETE: "ask" },
      },
    },
    on: {
      RECOGNISED: [
        {
          target: "info_final_ask",
          cond: ({ event }) => getEntity(event.value[0].utterance, "decision") === "Yes",
          actions: "assignDecision",
        },
        {
          target: "idle",
          cond: ({ event }) => getEntity(event.value[0].utterance, "decision") === "No",
          actions: "assignDecision",
        },
        {
          target: ".nomatch",
        },
      ],
      TIMEOUT: ".prompt",
    },
  },
  info_whole: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `OK, i understdoo ! Whole day meeting.`,
      }),
    },
    on: { SPEAK_COMPLETE: "final_ask" },
  },
  final_ask: {
    initial: "prompt",
    states: {
      prompt: {
        entry: {
          type: "spst.speak",
          params: ({ context }) => ({
            utterance: `Do you want me to create a meeting with ${context.meetingPartnerName} on ${context.meetingDay} for the whole day?`,
          }),
        },
        on: { ENDSPEECH: "ask" },
      },
      ask: {
        entry: { type: "spst.listen" },
      },
      nomatch: {
        entry: {
          type: "spst.speak",
          params: { utterance: "Sorry, please confirm again if you want to create the meeting (yes or no)." },
        },
        on: { SPEAK_COMPLETE: "ask" },
      },
    },
    on: {
      RECOGNISED: [
        {
          target: "info_final_ask",
          cond: ({ event }) => getEntity(event.value[0].utterance, "decision") === "Yes",
          actions: "assignDecision",
        },
        {
          target: "idle",
          cond: ({ event }) => getEntity(event.value[0].utterance, "decision") === "No",
          actions: "assignDecision",
        },
        {
          target: ".nomatch",
        },
      ],
      TIMEOUT: ".prompt",
    },
  },
  info_final_ask: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `OK, I'll take that as ${context.finalDecision ? 'yes' : 'no'}.`,
      }),
    },
    on: { ENDSPEECH: "final_prompt" },
  },
  final_prompt: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `Your meeting has been created!`,
      }),
    },
    on: { SPEAK_COMPLETE: "idle" },
  },
  failure: {
    entry: {
      type: "spst.speak",
      params: ({ context }) => ({
        utterance: `I'm sorry, there was an issue creating the appointment. We can start over`,
      }),
    },
    on: { SPEAK_COMPLETE: "menu" },
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
