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
  confirmation?: string;
  negation?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },

  monday: { day: "Monday" },
  tuesday: { day: "Tuesday" },
  wednesday: { day: "Wednesday" },
  thursday: { day: "Thursday" },
  friday: { day: "Friday" },
  saturday: { day: "Saturday" },
  sunday: { day: "Sunday" },

  yes: {confirmation : "yes"},
  yeah: {confirmation : "yes"},
  "of course": {confirmation : "yes"},
  no: {negation : "no"},
  nah: {negation : "nah"},
  nope: {negation : "nope"},
  "no way": {negation : "no way"},

  "1": { time: "01:00" },
  "2": { time: "02:00" },
  "3": { time: "03:00" },
  "4": { time: "04:00" },
  "5": { time: "05:00" },
  "6": { time: "06:00" },
  "7": { time: "07:00" },
  "8": { time: "08:00" },
  "9": { time: "09:00" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "12": { time: "11:00" },
  noon: { time: "12:00" },
  
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
  "12:00 am": { time: "11:00" },

  "1:00 pm": { time: "01:00" },
  "2:00 pm": { time: "02:00" },
  "3:00 pm": { time: "03:00" },
  "4:00 pm": { time: "04:00" },
  "5:00 pm": { time: "05:00" },
  "6:00 pm": { time: "06:00" },
  "7:00 pm": { time: "07:00" },
  "8:00 pm": { time: "08:00" },
  "9:00 pm": { time: "09:00" },
  "10:00 pm": { time: "10:00" },
  "11:00 pm": { time: "11:00" },
  "12:00 pm": { time: "11:00" },

};

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

// This function is extended version of isInGrammar, additionally I'm testing if the answer is in type that is requiered by this question.
function isInGrammar_spec(utterance: keyof typeof grammar, category: keyof GrammarEntry):boolean {
  return !!grammar[(utterance as string).toLowerCase()]?.[category];
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
    data_dict : {},

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
    // First state asking question "Who do you want to meet", edited version of given greeting state
    // I deleted check grammar as separate state and instead it is substype in each main state that asks questions
    Greeting: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Greeting.CheckGrammar",
            guard: ({ context }) => !!context.lastResult,

          },
          { target: ".NoInput" },
        ],
        
      },
      states: {
        Prompt: {
          entry: 
            { type: "spst.speak", params: { utterance: `Hello! Let's create an appoinment. Who are you meeting with?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! Who are you meeting with?` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ context, event }) => ({

                lastResult: event.value,  
                // Additionaly to last result variable, I'm keeping all important answers in dictionary. They will be used later for sum up of the meeting
                data_dict: {
                  ...context.data_dict,   
                  Q1: event.value[0]         
                }
              })), 
            },
            
            ASR_NOINPUT: {
              actions: assign({ lastResult: null }),
            },
          },
        },
        CheckGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              // Here I'm using my extended function, that includes category of the object in grammar. If object is from wrong category, the program will repeat the question, and will continue only if the word is in the frammar and category matches.
              utterance: isInGrammar_spec(context.lastResult![0].utterance, "person")
                ? "" 
                : `You just said: ${context.lastResult![0].utterance}. 
                   We don't have this option. Who are you meeting with?`
            })

          },
          on: { SPEAK_COMPLETE: 
            [{guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "person"),
              target: "#DM.Q2"
          },
              {target: "Ask"}],
        },
        },

      },
    },

    // "On which day is your meeting?" state - questions. The answers can be only days of the week
    Q2: { 
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE : [
          {
            target: "Q2.CheckGrammar",
            guard : ({context}) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ]
      },
      states: {
        Prompt : {
          entry: {type: "spst.speak", params: { utterance: `On which day is your meeting?`}},
          on: {SPEAK_COMPLETE : "Ask"}
        },

        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! On which day is your meeting?` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },

        Ask : {
          entry: {type: "spst.listen"},
          on: {
            RECOGNISED: {
              actions: assign(({ context, event }) => ({
                lastResult: event.value,  
                // storing the value in a dict
                data_dict: {
                  ...context.data_dict,   
                  Q2: event.value[0]         
                }
              })),
            
},
            ASR_NOINPUT : {
              actions: assign({ lastResult: null})
            }
          }
        },
        CheckGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              // again, checking if the category of the input is "day"
              utterance: isInGrammar_spec(context.lastResult![0].utterance, "day")
                ? "" 
                : `You just said: ${context.lastResult![0].utterance}. 
                   We don't have this option. On which day is your meeting?`
            })

          },
          on: { SPEAK_COMPLETE: 
            [{guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "day"),
              target: "#DM.Q3"
          },
              {target: "Ask"}],
        },
        },
      }
    },

    // "Will it take the whole day?" state - questions. The answers can be only yes, no, naah ect
    Q3: { 
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE : [
          {
            target: "Q3.CheckGrammar",
            guard : ({context}) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ]
      },
      states: {
        Prompt : {
          entry: {type: "spst.speak", params: { utterance: `Will it take the whole day?`}},
          on: {SPEAK_COMPLETE : "Ask"}
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! Will it take the whole day?` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask : {
          entry: {type: "spst.listen"},
          on: {
            RECOGNISED: {
              actions: assign(({ context, event }) => ({
                lastResult: event.value,  
                // storing the value in a dict
                data_dict: {
                  ...context.data_dict,   
                  Q3: event.value[0]         
                }
              })),
            
},
            ASR_NOINPUT : {
              actions: assign({ lastResult: null})
            }
          }
        },
        CheckGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              // checking if the category is either "confirmation" or "negation"
              utterance: isInGrammar_spec(context.lastResult![0].utterance, "confirmation") || isInGrammar_spec(context.lastResult![0].utterance, "negation")
                ? "" 
                : `You just said: ${context.lastResult![0].utterance}. 
                   We don't have this option. Will it take the whole day? Yes or no?`
            })

          },
          on: { SPEAK_COMPLETE: 
            // in following guards we have three options of moving forward:
            // if confirmation we are jumping to sumup
            [{guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "confirmation"),
              target: "#DM.SumUp"
          },
            // if negation we are going to question 4 that ask for precise time during the day
            {guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "negation"),
              target: "#DM.Q4"
          },
            // if answet doesn't match this categories we are asking question again
              {target: "Ask"}],
        },
        },
      }
    },

    // "What time do you want to have a meeting" state - questions. The answers can be only full hours, or full hours +PM or +AM
    Q4: { 
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE : [
          {
            target: "Q4.CheckGrammar",
            guard : ({context}) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ]
      },
      states: {
        Prompt : {
          entry: {type: "spst.speak", params: { utterance: `What time do you want to have a meeting?`}},
          on: {SPEAK_COMPLETE : "Ask"}
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you! What time do you want to have a meeting?` },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        
        Ask : {
          entry: {type: "spst.listen"},
          on: {
            RECOGNISED: {
              actions: assign(({ context, event }) => ({
                lastResult: event.value,  
                // storing the value in a dict
                data_dict: {
                  ...context.data_dict,   
                  Q4: event.value[0]         
                }
              })),
            
},
            ASR_NOINPUT : {
              actions: assign({ lastResult: null})
            }
          }
        },
        CheckGrammar: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              // checking if the category is "time"
              utterance: isInGrammar_spec(context.lastResult![0].utterance, "time")
                ? "" 
                : `You just said: ${context.lastResult![0].utterance}. 
                   We don't have this option. The meeting can only start at a full hour. What time do you want to have a meeting?`
            })

          },
          on: { SPEAK_COMPLETE: 
            [{guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "time"),
              target: "#DM.SumUp"
          },
              {target: "Ask"}],
        },
        },
      }
    },

    // SumUp state in wheach the user is confirming whether he wants the meeting or no. The answers can be only confirmation or negation
    SumUp: { initial: "Prompt",
      on: {
        LISTEN_COMPLETE : [
          {
            target: "SumUp.CheckGrammar",
            guard : ({context}) => !!context.lastResult,
          },
          { target: ".NoInput" },
        ]
      },
      states: {
        Prompt: {
          entry: {
            type: "spst.speak", 
            params: ({context}) => ({
              // Here the program is summing up all the data that were kept in dictionary. First it takes the stored value for person and day
              utterance: `Do you want me to create an appoinment with ${context.data_dict.Q1.utterance}, on ${context.data_dict.Q2.utterance}` +
              // And than it differentiates whether the meeting takes whole day or it's at specific hour
              (isInGrammar_spec(context.data_dict.Q3.utterance, "confirmation")
              ? `for the whole day?`
              : `at ${context.data_dict.Q4.utterance} ?`)
              })
            },
            on: {SPEAK_COMPLETE : "Ask"}
          },
            NoInput: {
              entry: {
                type: "spst.speak",
                params: { utterance: `I can't hear you! Do you confirm the meeting?` },
              },
              on: { SPEAK_COMPLETE: "Ask" },
            },
            Ask : {
              entry: {type: "spst.listen"},
              on: {
                RECOGNISED: {
                  // we don't need to store this answer in dictionary anymore
                  actions: assign(({ event }) => ({
                    lastResult: event.value, 
                  })),
                
    },
                ASR_NOINPUT : {
                  actions: assign({ lastResult: null})
                }
              }
            },
            CheckGrammar: {
              entry: 
                {
                  type: "spst.speak",
                  params: ({context}) => ({
                  // Depends if the user confirms the meeting he will three options 
                  utterance: isInGrammar_spec(context.lastResult![0].utterance, "confirmation")
                  // confirmation
                  ? "Thank you, your meeting has been created."
                  :isInGrammar_spec(context.lastResult![0].utterance, "negation")
                  // negation
                  ?""
                  // other
                  :`You just said: ${context.lastResult![0].utterance}. We don't have this option. Do you confirm this meeting? Yes or no?`
                  })
                },
              on: { SPEAK_COMPLETE: 
                // Depends if the user confirms the meeting he will continue to following states 
                // confirmation -> the end of program
                [{guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "confirmation"),
                  target: "#DM.Done"
              },
                // negation -> state that will ask him if he wants to repeat the whole process
                {guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "negation"),
                  target: "#DM.Repeat"
              },
                // wrong category -> repeat the question
                  {target: "Ask"}],
            },}
            

        },
      },

      
      // This state is only used if user doesn't confirm(says no) to the summed up proposition of meeting. Here he can decide if he's going through the process again.
      // question: "Would you like to try creating the appointment again?""
      Repeat: { 
        initial: "Prompt",
        on: {
          LISTEN_COMPLETE : [
            {
              target: "Repeat.CheckGrammar",
              guard : ({context}) => !!context.lastResult,
            },
            { target: ".NoInput" },
          ]
        },
        states: {
          Prompt : {
            entry: {type: "spst.speak", params: { utterance: `Would you like to try creating the appointment again?`}},
            on: {SPEAK_COMPLETE : "Ask"}
          },
          NoInput: {
            entry: {
              type: "spst.speak",
              params: { utterance: `I can't hear you! Would you like to try creating the appointment again?` },
            },
            on: { SPEAK_COMPLETE: "Ask" },
          },
          Ask : {
            entry: {type: "spst.listen"},
            on: {
              RECOGNISED: {
                // we don't need to store this answer in dictionary anymore
                actions: assign(({event }) => ({
                  lastResult: event.value,  
                })),
              
  },
              ASR_NOINPUT : {
                actions: assign({ lastResult: null})
              }
            }
          },
          CheckGrammar: {
            entry: {
              type: "spst.speak",
              params: ({context}) => ({
                // Again three speech answers of the machine:
                utterance: isInGrammar_spec(context.lastResult![0].utterance, "confirmation")
                // confirmation
                ? ""
                :isInGrammar_spec(context.lastResult![0].utterance, "negation")
                // negation
                ?"Thank you for your time, have a nice day"
                // neither = wrong categories
                :`You just said: ${context.lastResult![0].utterance}. We don't have this option. Would you like to try creating the appointment again? Yes or no?`
                })
  
            },
            on: { SPEAK_COMPLETE:
              // Three options of moving forward
              // Confirmation -> we are repeating the whole process of creating of an appointment
              [{guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "confirmation"),
                target: "#DM.Greeting"
            },
              // Negation -> machine switches off
              {guard: ({context}) => isInGrammar_spec(context.lastResult![0].utterance, "negation"),
                target: "#DM.Done"
            },
              // Not correct category -> repeat the question
                {target: "Ask"}],
          },
          },
        }
      },

      Done: {
        on: {
          CLICK: "Greeting",
        },
      },
    },
  },
);

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
