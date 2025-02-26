import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
import Fuse from 'fuse.js';

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
  confirmation?: boolean;
  intent?: string;
}

const entityGrammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  myself: { person: "Dylan Massey" },
  mum: { person: "Mom" },
  marco: { person: "Marco" },
  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },
  "12:00 am": { time: "00:00" },
  "1:00 am": { time: "01:00" },
  "2:00 am": { time: "02:00" },
  "3:00 am": { time: "03:00" },
  "4:00 am": { time: "04:00" },
  "5:00 am": { time: "05:00" },
  "6:00 am": { time: "06:00" },
  "7:00 am": { time: "07:00" },
  "8:00 am": { time: "08:00" },
  "9:00 am": { time: "09:00" },
  "10:00 am": { time: "10:00" },
  "11:00 am": { time: "11:00" },
  "12:00 pm": { time: "12:00" },
  "1:00 pm": { time: "13:00" },
  "2:00 pm": { time: "14:00" },
  "3:00 pm": { time: "15:00" },
  "4:00 pm": { time: "16:00" },
  "5:00 pm": { time: "17:00" },
  "6:00 pm": { time: "18:00" },
  "7:00 pm": { time: "19:00" },
  "8:00 pm": { time: "20:00" },
  "9:00 pm": { time: "21:00" },
  "10:00 pm": { time: "22:00" },
  "11:00 pm": { time: "23:00" },
  // yes: { confirmation: true },
  // no: { confirmation: false },
};

/** Models intents and other more complex behaviour */
const semGrammar: { [index: string]: GrammarEntry } = {
  "yes": { confirmation: true },
  "yes.": { confirmation: true },
  "no": { confirmation: false },
  "no.": { confirmation: false },
  "of course": { confirmation: true },
  "no way": { confirmation: false },
  "absolutely": { confirmation: true },
  "not at all": { confirmation: false },
  "sure": { confirmation: true },
  "nope": { confirmation: false },
  "yeah": { confirmation: true },
  "nah": { confirmation: false },
  "yep": { confirmation: true },
};

function entityRestrictedCheck(utterance: string, grammar: any,  demandedEntity: string, context: DMContext) {
  let arr = Object.keys(grammar).map((key) => [key, grammar[key]]);
  arr = arr.filter((o) => o[1].hasOwnProperty(demandedEntity));
  // console.log(arr);
  let arr2 = arr.map((o) => o[0]);
  // console.log(arr2)
  // Put fuzzy matching here
  arr2 = matchFuzzy(utterance, arr2);
  console.log(`Retrieved fuzzy items: ${ arr2 }`);
  // set to utterance to first matched fuzzy item
  if (arr2.length > 0) {
    utterance = arr2[0];
    context.lastResult![0].utterance = utterance;
  }
  return arr2.includes(utterance.toLowerCase());
}

function matchFuzzy(utterance:string, items: string[]) {
  const fuse = new Fuse(items, {
    threshold: 0.3,
  }); 
  const results = fuse.search(utterance).map((result) => result.item);
  return results;
}

function isInEntityOrSemGrammar(utterance: string, demandedEntity: string = "person", context: DMContext) {
  let demandedEnt = demandedEntity.split("_").length > 1 ? demandedEntity.split("_")[1]: demandedEntity;
  return entityRestrictedCheck(utterance, entityGrammar, demandedEntity, context) || entityRestrictedCheck(utterance, semGrammar, demandedEnt, context);
}

function getPerson(utterance: string) {
  return (entityGrammar[utterance.toLowerCase()] || {}).person;
}

function getDay(utterance: string) {
  return (entityGrammar[utterance.toLowerCase()] || {}).day;
}

function getTime(utterance: string) {
  return (entityGrammar[utterance.toLowerCase()] || {}).time;
}

function getYesNo(utterance: string) {
  return (semGrammar[utterance.toLowerCase()] || {}).confirmation;
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
        appointments: [],
      }),
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
      }),
    "fetchAndStoreEntity": ({ context }) => {
      switch (context.demandedEntity) {
        case "person": {
          const ent = getPerson(context.lastResult![0].utterance)||"Unknown";
          context.currentAppointment = { person: ent };
        }
          break;
        case "day": {
          const ent = getDay(context.lastResult![0].utterance.toLowerCase())||"Unknown";
          context.currentAppointment = {
            meetingDay: ent, 
            person: context.currentAppointment?.person || "Unknown" };
        }
          break;
        case "time": {
          const ent = getTime(context.lastResult![0].utterance.toLowerCase())||"Unknown";
          context.currentAppointment = {
            meetingTime: ent,
            person: context.currentAppointment?.person || "Unknown",
            meetingDay: context.currentAppointment?.meetingDay || "Unknown",
          };
        }
          break;
        case "duration_confirmation": {
          const ent = getYesNo(context.lastResult![0].utterance.toLowerCase())||false;
          if (ent) {
            // Skip
          } else {
            // Push to slots
            context.slots.push("AskTime");
          }
        }
          break;
        case "appointment_confirmation": {
          const ent = getYesNo(context.lastResult![0].utterance.toLowerCase())||false;
          if (ent && context.currentAppointment) {
            context.appointments.push(context.currentAppointment);
            context.currentAppointment = {};
            // context.slots = ["AskPerson", "AskDay", "AskDuration", "AskConfirmation"].reverse();
          } else {
            // Skip
            context.currentAppointment = {};
            context.slots = ["NegReply"];
          }
        }
          break;
    }},
    "removeSlot": ({ context }) => {
      context.slots.pop();
    },
    "resetSlots": ({ context }) => {
      context.slots = ["AskPerson", "AskDay", "AskDuration", "AskConfirmation"].reverse();
      // context.slots = ["AskPerson", "AskConfirmation"].reverse();
    }
  }}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: [
        ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      ],
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      on: { CLICK: "Initialize" },
    },
    Initialize: {
      entry: [
        assign(({ context }) => {
          if(!context.hasOwnProperty("appointments")) {
            return { appointments: [] }
          } else {
            return { appointments: context.appointments }
          }
        }),
      ],
      always: {
        target: "MeetingCreation",
        actions: ["resetSlots"],
    }},
    MeetingCreation: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "CheckGrammar",
            guard: ({ context }) => !!context.lastResult, /* checks if lastResult is not null */
          },
          { target: ".NoInput" },
        ],
      },
      states: { 
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Hi, let's create an appointment!` } },
          on: { SPEAK_COMPLETE: "AskPerson" },
        },
        AskPerson: {
          entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
          on: { 
            SPEAK_COMPLETE: {
              target: "Ask",
              actions: assign({ demandedEntity: "person" }),
            }
          },
        },
        AskDay: {
          entry: { type: "spst.speak", params: { utterance: `On which day is your meeting?` } },
          on: { 
            SPEAK_COMPLETE: {
              target: "Ask",
              actions: assign({ demandedEntity: "day" }),
            }
          },
        },
        AskDuration: {
          entry: { type: "spst.speak", params: { utterance: `Will your meeting be the entire day?` } },
          on: { 
            SPEAK_COMPLETE: {
              target: "Ask",
              actions: assign({ demandedEntity: "duration_confirmation" }),
            }
          },
        },
        AskTime: {
          entry: { type: "spst.speak", params: { utterance: `At which time are you meeting?` } },
          on: { 
            SPEAK_COMPLETE: {
              target: "Ask",
              actions: assign({ demandedEntity: "time" }),
            }
          },
        },
        AskConfirmation: {
          entry: { type: "spst.speak", 
            params: ({ context }) => (
              { 
                utterance: 
                context.currentAppointment?.hasOwnProperty("meetingTime") ?
                `Do you want me to create an appointment with
                ${ context.currentAppointment?.person } 
                on ${ context.currentAppointment?.meetingDay } 
                at ${ context.currentAppointment?.meetingTime }?`
                : 
                `Do you want me to create an appointment with
                ${ context.currentAppointment?.person }
                on ${ context.currentAppointment?.meetingDay }
                for the whole day?`
              }
            )
          },
          on: { 
            SPEAK_COMPLETE: {
              target: "Ask",
              actions: assign({ demandedEntity: "appointment_confirmation" }),
            }
          },
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
        Router: {
          always: [
            { 
              target: "AskDay",
              guard: ({ context }) => context.slots[context.slots.length-1] === "AskDay" 
            },
            {
              target: "AskDuration",
              guard: ({ context }) => context.slots[context.slots.length-1] === "AskDuration"
            },
            {
              target: "AskTime",
              guard: ({ context }) => context.slots[context.slots.length-1] === "AskTime"
            },
            {
              target: "AskConfirmation",
              guard: ({ context }) => context.slots[context.slots.length-1] === "AskConfirmation"
            },
            {
              target: "NegReply",
              guard: ({ context }) => context.slots[context.slots.length-1] === "NegReply"
            },
            {
              target: "Done",
              guard: ({ context }) => context.slots.length === 0
            }
          ],
        },
        Done: {
          entry: [
            {
              type: "spst.speak",
              params: {
                utterance: 
                `Your appointment has been created.`
              },
            },
          ],
          on: {
            CLICK: {
              target: "#DM.Initialize",
            }
          },
        },
        NegReply: {
          entry: [
            {
              type: "spst.speak",
              params: {
                utterance: 
                `The appointment creation has been cancelled.`
              },
            },
          ],
          on: {
            CLICK: {
              target: "#DM.Initialize",
            }
          },
        },
      },
    },
    CheckGrammar: {
      entry: [{
        type: "spst.speak",
        params: ({ context }) => ({
          utterance: 
          `The demanded entity is of type ${ context.demandedEntity }. 
          You just said: ${context.lastResult![0].utterance}. 
          And it ${ isInEntityOrSemGrammar(context.lastResult![0].utterance, context.demandedEntity, context) ? "is" : "is not"
          } in the grammar under the given entity.`,
        }),
      }],
      on: { SPEAK_COMPLETE: [{
        target: "MeetingCreation.Router" , /**  */
        guard: ({ context }) => isInEntityOrSemGrammar(context.lastResult![0].utterance, context.demandedEntity, context),
        actions: [
          "removeSlot",
          "fetchAndStoreEntity",
          assign({ demandedEntity: undefined }),
        ],
      }, {
        target: "EntityNotFound"
      }]},
    },
    EntityNotFound: {
      entry: {
        type: "spst.speak",
        params: ({ context }) => ({ 
          utterance: `I'm sorry, I couldn't find this ${ context.demandedEntity } in the grammar. Could you repeat?` 
        }),
      },
      on: { SPEAK_COMPLETE: "MeetingCreation.Ask" },
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
