import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
import Fuse from 'fuse.js';

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://dialogue-systems-clu.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "dialogue-systems-clu-dep" /** your Azure CLU deployment */,
  projectName: "dialogue-systems-clu-sol" /** your Azure CLU project name */,
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  // locale: "en-US",
  locale: "en-GB",
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
  "on monday": { day: "Monday" },
  "on tuesday": { day: "Tuesday" },
  "on wednesday": { day: "Wednesday" },
  "on thursday": { day: "Thursday" },
  "on friday": { day: "Friday" },
  "on saturday": { day: "Saturday" },
  "on sunday": { day: "Sunday" },
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

const personDossiers: { [index: string]: string } = {
  "martin seligman": "Martin Seligman is an American psychologist, educator, and author of self-help books.",
  "mihaly csikszentmihalyi": "Mihaly Csikszentmihalyi is a Hungarian-American psychologist. He recognized and named the psychological concept of flow.",
  "sigmund freud": "Sigmund Freud was an Austrian neurologist and the founder of psychoanalysis, a clinical method for treating psychopathology through dialogue between a patient and a psychoanalyst.",
  "jacques lacan": "Jacques Lacan was a French psychoanalyst and psychiatrist who has been called the most controversial psycho-analyst since Freud.",
}

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

function getPersonDossier(entity: string) {
  console.log("Entity: ", entity);
  return personDossiers[entity];
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
    "clu.listen": ({ context }) =>
      // context.ssRef.send({
      context.spstRef.send({
        type: "LISTEN",
        value: { nlu: true } /** Local activation of NLU */,
      }),
    "fetchAndStoreEntity": ({ context }) => {
      switch (context.demandedEntity) {
        case "person": {
          const ent = getPerson(context.lastResult![0].utterance)||"Unknown";
          context.currentAppointment = {...context.currentAppointment, person: ent };
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
    },
    "prefillSlots": ({ context }) => {
      // Function that handles pre-filling of person and day from the intent statement if present.
      // Skip asking person and day when this information is understandable and and in the entities data.
      // context.slots = ["AskPerson", "AskDay", "AskDuration", "AskConfirmation"].reverse();
      console.log("Prefill slots triggered.");
      if(context.extractedEntities.person && context.extractedEntities.day) {
        context.currentAppointment = {
          person: context.extractedEntities.person,
          meetingDay: context.extractedEntities.day,
        };
        console.log("Prefilled slots with person and day TRIGGERED.");
        context.slots = ["AskDuration", "AskConfirmation"].reverse();
      } else if(context.extractedEntities.person) {
        context.currentAppointment = {
          person: context.extractedEntities.person,
        };
        context.slots = ["AskDay", "AskDuration", "AskConfirmation"].reverse();
      } else if(context.extractedEntities.day) {
        context.currentAppointment = {
          meetingDay: context.extractedEntities.day,
        };
        context.slots = ["AskPerson", "AskDuration", "AskConfirmation"].reverse();
      } else {
        context.slots = ["AskPerson", "AskDay", "AskDuration", "AskConfirmation"].reverse();
    }
  }}}).createMachine({
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
      entry: { 
        type: "spst.speak", 
        params: { 
          utterance: `Hey there! What's your intent for now?` 
        } 
      },
      on: { 
        SPEAK_COMPLETE: {
          target: "AskIntent", 
          actions: ["resetSlots"]
        }
      },
    },
    AskIntent: {
      entry: { type: "clu.listen" },
      on: {
        RECOGNISED: { 
            actions: [
              assign(({ event }) => {
                console.log(`EVENT NLU VALUE TOP-INTENT: ${ event.nluValue.topIntent }`);
                if (event.nluValue.topIntent === "create a meeting") {
                  // Extract relevant entities 
                  let personName, dayName = null;
                  if(event.nluValue.entities.filter((o: { category: string; }) => o.category === "Person").length !== 0) {
                    personName = event.nluValue.entities.filter((o: { category: string; }) => o.category === "Person")[0].text;
                  }
                  if(event.nluValue.entities.filter((o: { category: string; }) => o.category === "Day").length !== 0) {
                    dayName = event.nluValue.entities.filter((o: { category: string; }) => o.category === "Day")[0].text;
                  }
                  return { 
                    currentIntent: event.nluValue.topIntent,
                    extractedEntities: personName && dayName ? 
                      { person: personName, day: dayName }  : personName 
                      ? { person: personName } 
                      : dayName 
                      ? { day: dayName } 
                      : null
                  };
                }
                else if (event.nluValue.topIntent === "Who is Mihaly Csikszentmihalyi") {
                  return { 
                    currentIntent: event.nluValue.topIntent,
                    extractedEntities: { person : event.nluValue.entities[0].text },
                  };
                }
                return { currentIntent: event.nluValue.topIntent };
              }),
            ],
          },
          ASR_NOINPUT: {
            actions: assign({ currentIntent: null }),
          },
          LISTEN_COMPLETE: {
            target: "IntermediateStep",
          }
        },
      },
    IntermediateStep: {
          always: [
            {
              target: "InitializeAppointments",
              guard: ({ context }) => context.currentIntent === "create a meeting"
            },
            {
              target: "InformAboutPerson",
              guard: ({ context }) => context.currentIntent === "Who is Mihaly Csikszentmihalyi"
            },
        ] 
    },
    InformAboutPerson: {
      /** This state is not completed yet. */
      entry: { 
        type: "spst.speak", 
        params: ({ context }) => ({
          utterance: getPersonDossier(context.extractedEntities.person.toLowerCase()) || "I'm sorry, I don't have information about this person."
        })
      },
      on: {
        SPEAK_COMPLETE: "Done",
      }
    },
    InitializeAppointments: {
      entry: [
        assign(({ context }) => {
          if(!context.hasOwnProperty("appointments")) {
            return { appointments: [] }
          } else {
            return { appointments: context.appointments }
          }
        }),
      ],
      always: [
        {
          actions: ["prefillSlots"],
          target: "RouteMeetingCreation",
        },
      ]
    },
    RouteMeetingCreation: {
      always: [
        {
          target: "MeetingCreation",
          guard: ({ context }) => context.slots.length === 4,
        },
        {
          target: "MeetingCreation.Router",
          guard: ({ context }) => context.slots.length !== 4,
        },
      ]
    },
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
          entry: { type: "spst.speak", params: { utterance: `So, let's create an appointment!` } },
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
              target: "AskPerson",
              guard: ({ context }) => context.slots[context.slots.length-1] === "AskPerson"
            },
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
    Done: {
      entry: [
        {
          type: "spst.speak",
          params: {
            utterance: 
            `Hope this helped.`
          },
        },
      ],
      on: {
        CLICK: {
          target: "Initialize",
        }
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
