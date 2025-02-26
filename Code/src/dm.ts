//IMPORTS

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

//INTERFACE GRAMMARENTRY

interface GrammarEntry {
  Location?: string;
  Week?: string;
  Answer?: string;
  Person?: string;
  Day?: string;
  Time?: string;
  Duration?: string;
}

//GRAMMAR PERSON/DAY/TIME/ANSWER/LOCATION

const week_grammar: { [index:string]: GrammarEntry } = {
  "1": { Week: "Week 1" },
  "2": { Week: "Week 2" },
  "3": { Week: "Week 3" },
  "4": { Week: "Week 4" },
  "5": { Week: "Week 5" },
  "6": { Week: "Week 6" },
  "7": { Week: "Week 7" },
  "8": { Week: "Week 8" },
  "9": { Week: "Week 9" },
  "10": { Week: "Week 10" },
  "11": { Week: "Week 11" },
  "12": { Week: "Week 12"  },
  "13": { Week: "Week 13" },
  "14": { Week: "Week 14" },
  "15": { Week: "Week 15" },
  "16": { Week: "Week 16" },
  "17": { Week: "Week 17" },
  "18": { Week: "Week 18" },
  "19" : { Week : "Week 19" },
  "20" : { Week : "Week 20" },
};

const duration_grammar: { [index:string]: GrammarEntry } = {
  "15": { Duration: "15 minutes" },
  "30" : { Duration: "half an hour" },
  "45" : { Duration: "45 minutes" },
};


const grammar: { [index: string]: GrammarEntry } = {

  vlad: { Person: "Vladislav Maraev" },
  aya: { Person: "Nayat Astaiza Soriano" },
  victoria: { Person: "Victoria Daniilidou" },
  Hank: {Person: "Hank Best" },
  emma: {Person: "Emma Katz" },
  
  monday: { Day: "Monday" },
  tuesday: { Day: "Tuesday" },
  wednesday: { Day: "Wednesday" },
  thursday: { Day: "Thursday" },
  friday: { Day: "Friday" },

  "lab": { Location: "the lab" },
  "university": { Location: "the university offices" },
  "restaurant": { Location: "the university restaurant nackrosen" },

  "1": { Time: "1:00" },
  "2": { Time: "2:00" },
  "3": { Time: "3:00" },
  "4": { Time: "4:00" },
  "5": { Time: "5:00" },
  "6": { Time: "6:00" },
  "7": { Time: "7:00" },
  "8": { Time: "8:00" },
  "9": { Time: "9:00" },
  "10": { Time: "10:00" },
  "11": { Time: "11:00" },
  "12": { Time: "12:00" },

  "yes": { Answer: "positive" },
  "yeah": { Answer: "positive" },
  "ofcourse": { Answer: "positive" },      //!!
  "definitely": { Answer: "positive" },
  "affermative": { Answer: "positive" },
  "uhu": { Answer: "positive" },           //!!
  "positive": { Answer: "positive" },
  "no": { Answer: "negative" },            //!!
  "noway": { Answer: "negative" },         //!!
  "never": { Answer: "negative" },
  "not": { Answer: "negative" },
  "negative": { Answer: "negative" },
};

//FUNCTIONS (is in grammar/get Person/Answer/Day/Time)

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function isInWeekGrammar(utterance: string) {
  return utterance.toLowerCase() in week_grammar;
}

function isInDurationGrammar(utterance: string) {
  return utterance.toLowerCase()in duration_grammar;
}

function getWeek(utterance: string) {
  return (week_grammar[utterance.toLowerCase()] || {}).Week;
}

function getLocation(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).Location;
}

function getDuration(utterance: string) {
  return (duration_grammar[utterance.toLowerCase()] || {}).Duration;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).Person;
}

function getAnswer(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).Answer;
}

function getDay(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).Day;
}

function getTime(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).Time;
}

//DM machine

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
      on: { CLICK: "Introduction" },
    },
    Introduction: {
      entry: { type: "spst.speak", params: { utterance: `Hi, let's create an appointment.`}},
      on: {SPEAK_COMPLETE: "Question_Person"}
    },
    Question_Person: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          { target: "Confirmation_Person",
           guard: ({ context }) => !!context.Person && isInGrammar(context.Person![0].utterance) 
          },
          { target: ".UnknownInput",
            guard: ({ context }) => !!context.Person && !isInGrammar(context.Person![0].utterance)
          },
          { target: ".NoInput" } 
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` },},
          on: { SPEAK_COMPLETE: "Ask" },
        },
        UnknownInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't make an appointment with that person.` },},
          on: { SPEAK_COMPLETE: "Prompt" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you.` },},
          on: { SPEAK_COMPLETE: "Prompt" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: { actions: assign(({ event }) => {return { Person: event.value };}),
            },
            ASR_NOINPUT: { actions: assign({ Person: null }),
            },
          },
        },
       }
      },
    Confirmation_Person: {

              initial: "Prompt",
              
              on: {
              
                LISTEN_COMPLETE: [
                  {
                    target: "Question_Location",
                    guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive"
                  },
                  {
                    target: "Question_Person",
                    guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
                  },
                  {
                    target: ".UnknownInput",
                    guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
                  },
                  { target: ".NoInput" }
                ],
              },
              
              states: {
              
                Prompt: {
                  entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `Please confirm. Do you want to meet with ${getPerson(context.Person![0].utterance)}?`}) },
                  on: { SPEAK_COMPLETE: "Ask" },
                },
                
                UnknownInput: {
                  entry: {
                    type: "spst.speak",
                    params: { utterance: `Please, answer the question.` },
                  },
                  on: { SPEAK_COMPLETE: "Prompt" },
                },
                
                NoInput: {
                  entry: {
                    type: "spst.speak",
                    params: { utterance: `I can't hear you.` },
                  },
                  on: { SPEAK_COMPLETE: "Prompt" },
                },
               
                Ask: {
                  entry: { type: "spst.listen" },
                  on: {
                    RECOGNISED: {
                      actions: assign(({ event }) => {
                        return { Answer: event.value };
                      }),
                    },
                    ASR_NOINPUT: {
                      actions: assign({ Answer: null }),
                    },
                  },
                },
              },
      },

    Question_Location: {
        initial: "Prompt",
        on: {
          LISTEN_COMPLETE: [
            { target: "Confirmation_Location",
             guard: ({ context }) => !!context.Location && isInGrammar(context.Location![0].utterance) 
            },
            { target: ".UnknownInput",
              guard: ({ context }) => !!context.Location && !isInGrammar(context.Location![0].utterance)
            },
            { target: ".NoInput" }
          ],
        },
        states: {
          Prompt: {
            entry: { type: "spst.speak", params: { utterance: `Where is your meeting?` },},
            on: { SPEAK_COMPLETE: "Ask" },
          },
          UnknownInput: {
            entry: {
              type: "spst.speak",
              params: { utterance: `I can't make an appointment at that location.` },},
            on: { SPEAK_COMPLETE: "Prompt" },
          },
          NoInput: {
            entry: {
              type: "spst.speak",
              params: { utterance: `I can't hear you.` },},
            on: { SPEAK_COMPLETE: "Prompt" },
          },
          Ask: {
            entry: { type: "spst.listen" },
            on: {
              RECOGNISED: { actions: assign(({ event }) => {return { Location: event.value };}),
              },
              ASR_NOINPUT: { actions: assign({ Location: null }),
              },
            },
          },
        },
      },

  Confirmation_Location: {

    initial: "Prompt",
    
    on: {
    
      LISTEN_COMPLETE: [
    {
          target: "Question_Week",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive"
        },
    {
          target: "Question_Location",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
        },
        {
          target: ".UnknownInput",
          guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
        },
        { target: ".NoInput" }
      ],
    },
    
    states: {
    
      Prompt: {
        entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `Please confirm. Do you want to meet at ${getLocation(context.Location![0].utterance)}?`}) },
        on: { SPEAK_COMPLETE: "Ask" },
      },
      
      UnknownInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `Please, answer the question.` },
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },
      
      NoInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `I can't hear you.` },
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },
     
      Ask: {
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: {
            actions: assign(({ event }) => {
              return { Answer: event.value };
            }),
          },
          ASR_NOINPUT: {
            actions: assign({ Answer: null }),
          },
        },
      },
    },
  },
      Question_Week: {
        initial: "Prompt",
        on: {
          LISTEN_COMPLETE: [
            { target: "Confirmation_Week",
             guard: ({ context }) => !!context.Week && isInWeekGrammar(context.Week![0].utterance) 
            },
            { target: ".UnknownInput",
              guard: ({ context }) => !!context.Week && !isInWeekGrammar(context.Week![0].utterance)
            },
            { target: ".NoInput" } 
          ],
        },
        states: {
          Prompt: {
            entry: { type: "spst.speak", params: { utterance: `In which week is your meeting?` },},
            on: { SPEAK_COMPLETE: "Ask" },
          },
          UnknownInput: {
            entry: {
              type: "spst.speak",
              params: { utterance: `I can't make an appointment in that week, only from week 1 to 20.` },},
            on: { SPEAK_COMPLETE: "Prompt" },
          },
          NoInput: {
            entry: {
              type: "spst.speak",
              params: { utterance: `I can't hear you.` },},
            on: { SPEAK_COMPLETE: "Prompt" },
          },
          Ask: {
            entry: { type: "spst.listen" },
            on: {
              RECOGNISED: { actions: assign(({ event }) => {return { Week: event.value };}),
              },
              ASR_NOINPUT: { actions: assign({ Week: null }),
              },
            },
          },
        },
      },

  Confirmation_Week: {

    initial: "Prompt",
    
    on: {
    
      LISTEN_COMPLETE: [
    {
          target: "Question_Day",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive"
        },
    {
          target: "Question_Week",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
        },
        {
          target: ".UnknownInput",
          guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
        },
        { target: ".NoInput" },
      ],
    },
    
    states: {
    
      Prompt: {
        entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `Please confirm. Do you want to meet in ${getWeek(context.Week![0].utterance)}?`}) },
        on: { SPEAK_COMPLETE: "Ask" },
      },
      
      UnknownInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `Please, answer the question.` },
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },
      
      NoInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `I can't hear you.` },
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },
     
      Ask: {
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: {
            actions: assign(({ event }) => {
              return { Answer: event.value };
            }),
          },
          ASR_NOINPUT: {
            actions: assign({ Answer: null }),
          },
        },
      },
    },
  },

        Question_Day: {
          initial: "Prompt",
          on: {
            LISTEN_COMPLETE: [
              { target: "Confirmation_Day",
               guard: ({ context }) => !!context.Day && isInGrammar(context.Day![0].utterance) 
              },
              { target: ".UnknownInput",
                guard: ({ context }) => !!context.Day && !isInGrammar(context.Day![0].utterance)
              },
              { target: ".NoInput" } 
            ],
          },
          states: {
            Prompt: {
              entry: { type: "spst.speak", params: { utterance: `On which day is your meeting?` },},
              on: { SPEAK_COMPLETE: "Ask" },
            },
            UnknownInput: {
              entry: {
                type: "spst.speak",
                params: { utterance: `I can't make an appointment on that day. Available days are Monday through Friday.` },},
              on: { SPEAK_COMPLETE: "Prompt" },
            },
            NoInput: {
              entry: {
                type: "spst.speak",
                params: { utterance: `I can't hear you.` },},
              on: { SPEAK_COMPLETE: "Prompt" },
            },
            Ask: {
              entry: { type: "spst.listen" },
              on: {
                RECOGNISED: { actions: assign(({ event }) => {return { Day: event.value };}),
                },
                ASR_NOINPUT: { actions: assign({ Day: null }),
                },
              },
            },
          },
        },

    Confirmation_Day: {

      initial: "Prompt",
      
      on: {
      
        LISTEN_COMPLETE: [
      {
            target: "Question_Whole_Day",
            guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive"
          },
      {
            target: "Question_Day",
            guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
          },
          {
            target: ".UnknownInput",
            guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
          },
          { target: ".NoInput" }
        ],
      },
      
      states: {
      
        Prompt: {
          entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `Please confirm. Do you want to meet on ${getDay(context.Day![0].utterance)}?`}) },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        
        UnknownInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Please, answer the question.` },
          },
          on: { SPEAK_COMPLETE: "Prompt" },
        },
        
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you.` },
          },
          on: { SPEAK_COMPLETE: "Prompt" },
        },
       
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { Answer: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ Answer: null }),
            },
          },
        },
      },
    },

    Question_Whole_Day: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Confirmation_Format_Whole_Day",
            guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive" 
          },
          {
            target: "Question_Time",
            guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
          },
          {
            target: ".UnknownInput",
            guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
          },
          { target: ".NoInput" }, 
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Will it take the whole Day?` }, },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        UnknownInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Please, answer the question.` },},
          on: { SPEAK_COMPLETE: "Prompt" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you.` },},
          on: { SPEAK_COMPLETE: "Prompt" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => { return { Answer: event.value };}),
            },
            ASR_NOINPUT: {
              actions: assign({ Answer: null }),
            },
          },
        },
      },
    },

    Confirmation_Format_Whole_Day: {
         
    initial: "Prompt",
    on: {
      LISTEN_COMPLETE: [
        {
          target: "Final_Confirmation",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive" 
        },
        {
          target: "Question_Person",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
        },
        {
          target: ".UnknownInput",
          guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
        },
        { target: ".NoInput" } 
      ],
    },

    states: {
      Prompt: {
        entry: { type: "spst.speak", params:  ({context}) => ({ utterance: `Do you want me to create an appointment with ${getPerson(context.Person![0].utterance)}, in ${getWeek(context.Week![0].utterance)}, on ${getDay(context.Day![0].utterance)}, at ${getLocation(context.Location![0].utterance)} for the whole day?.`}) },
        on: { SPEAK_COMPLETE: "Ask" },
      },
      
      UnknownInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `Please, answer the question.` },
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },

      NoInput: {
        entry: {
          type: "spst.speak",
          params:  { utterance: `I can't hear you.`},
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },

      Ask: {
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: {
            actions: assign(({ event }) => {
              return { Answer: event.value };
            }),
          },
          ASR_NOINPUT: {
            actions: assign({ Answer: null }),
          },
        },
      },
    }
    },

    Question_Time: {

      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Confirmation_Time",
            guard: ({ context }) => !!context.Time && isInGrammar(context.Time![0].utterance)
          },
          {
            target: ".UnknownInput",
            guard: ({ context }) => !!context.Time && !isInGrammar(context.Time![0].utterance) 
          },
          { target: ".NoInput",
            guard: ({ context }) => !context.Time
           }, 
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `What time does your meeting start?` } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        
        UnknownInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't book a meeting at that time. I can book meetings with starting times at 8:00 in the morning to 6:00 in the evening.` }, 
          },
          on: { SPEAK_COMPLETE: "Prompt" },
        },

        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you.` },
          },
          on: { SPEAK_COMPLETE: "Prompt" },
        },

        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { Time: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ Time: null }),
            },
          },
        },
      }
    },
    
  Confirmation_Time: {
    
    initial: "Prompt",
    on: {
      LISTEN_COMPLETE: [
        {
          target: "Question_Duration",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive" 
        },
        {
          target: "Question_Time",
          guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
        },
        {
          target: ".UnknownInput",
          guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
        },
        { target: ".NoInput" } 
      ],
    },
    states: {
      Prompt: {
        entry: { type: "spst.speak", params:  ({context}) => ({ utterance: `Please confirm. Do you want me to create an appointment that starts at ${getTime(context.Time![0].utterance)}?`}) },
        on: { SPEAK_COMPLETE: "Ask" },
      },
      
      UnknownInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `Please, answer the question.` },
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },

      NoInput: {
        entry: {
          type: "spst.speak",
          params:  { utterance: `I can't hear you.`},
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },

      Ask: {
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: {
            actions: assign(({ event }) => {
              return { Answer: event.value };
            }),
          },
          ASR_NOINPUT: {
            actions: assign({ Answer: null }),
          },
        },
      },
    }
  },

  Question_Duration: {

    initial: "Prompt",
    on: {
      LISTEN_COMPLETE: [
        {
          target: "Confirmation_Duration",
          guard: ({ context }) => !!context.Time && isInDurationGrammar(context.Duration![0].utterance)
        },
        {
          target: ".UnknownInput",
          guard: ({ context }) => !!context.Time && !isInDurationGrammar(context.Duration![0].utterance) 
        },
        { target: ".NoInput" } 
      ],
    },
    states: {
      Prompt: {
        entry: { type: "spst.speak", params: { utterance: `Do you want to book a meeting for 15, 30, 45 minutes?` } },
        on: { SPEAK_COMPLETE: "Ask" },
      },
      
      UnknownInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `I can't book a meeting for that duration.` }, 
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },

      NoInput: {
        entry: {
          type: "spst.speak",
          params: { utterance: `I can't hear you.` },
        },
        on: { SPEAK_COMPLETE: "Prompt" },
      },

      Ask: {
        entry: { type: "spst.listen" },
        on: {
          RECOGNISED: {
            actions: assign(({ event }) => {
              return { Duration: event.value };
            }),
          },
          ASR_NOINPUT: {
            actions: assign({ Duration: null }),
          },
        },
      },
    }
  },
  
 Confirmation_Duration: {
  
  initial: "Prompt",
  on: {
    LISTEN_COMPLETE: [
      {
        target: "Confirmation_Format_Timeslot",
        guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive" 
      },
      {
        target: "Question_Duration",
        guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
      },
      {
        target: ".UnknownInput",
        guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
      },
      { target: ".NoInput" }, 
    ],
  },
  states: {
    Prompt: {
      entry: { type: "spst.speak", params:  ({context}) => ({ utterance: `Please confirm. Do you want me to create an appointment for ${getDuration(context.Duration![0].utterance)}?`}) },
      on: { SPEAK_COMPLETE: "Ask" },
    },
    
    UnknownInput: {
      entry: {
        type: "spst.speak",
        params: { utterance: `Please, answer the question.` },
      },
      on: { SPEAK_COMPLETE: "Prompt" },
    },

    NoInput: {
      entry: {
        type: "spst.speak",
        params:  { utterance: `I can't hear you.`},
      },
      on: { SPEAK_COMPLETE: "Prompt" },
    },

    Ask: {
      entry: { type: "spst.listen" },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            return { Answer: event.value };
          }),
        },
        ASR_NOINPUT: {
          actions: assign({ Answer: null }),
        },
      },
    },
  }
},

Confirmation_Format_Timeslot: {
         
  initial: "Prompt",
  on: {
    LISTEN_COMPLETE: [
      {
        target: "Final_Confirmation",
        guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "positive" 
      },
      {
        target: "Question_Person",
        guard: ({ context }) => !!context.Answer && isInGrammar(context.Answer![0].utterance) && getAnswer(context.Answer![0].utterance) == "negative"
      },
      {
        target: ".UnknownInput",
        guard: ({ context }) => !!context.Answer && !isInGrammar(context.Answer![0].utterance) 
      },
      { target: ".NoInput" }
    ],
  },

  states: {
    Prompt: {
      entry: { type: "spst.speak", params:  ({context}) => ({ utterance: `Do you want me to create an appointment with ${getPerson(context.Person![0].utterance)}, in ${getWeek(context.Week![0].utterance)}, on ${getDay(context.Day![0].utterance)}, at ${getLocation(context.Location![0].utterance)}, at ${getTime(context.Time![0].utterance)}, for ${getDuration(context.Duration![0].utterance)}?.`}) },
      on: { SPEAK_COMPLETE: "Ask" },
    },
    
    UnknownInput: {
      entry: {
        type: "spst.speak",
        params: { utterance: `Please, answer the question.` },
      },
      on: { SPEAK_COMPLETE: "Prompt" },
    },

    NoInput: {
      entry: {
        type: "spst.speak",
        params:  { utterance: `I can't hear you.`},
      },
      on: { SPEAK_COMPLETE: "Prompt" },
    },

    Ask: {
      entry: { type: "spst.listen" },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => {
            return { Answer: event.value };
          }),
        },
        ASR_NOINPUT: {
          actions: assign({ Answer: null }),
        },
      },
    },
  }
  },

  Final_Confirmation: {
      entry: {
         type: "spst.speak", params:  { utterance: `Your appointment has been created.`}
      },
      on: {SPEAK_COMPLETE: "WaitToStart"}
    },
    },
}
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