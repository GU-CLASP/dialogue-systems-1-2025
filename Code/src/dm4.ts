import { assign, createActor, setup } from "xstate";
import { Hypothesis, Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { NLU_KEY } from "./azure";
import { DMContext, DMEvents, nluResponse } from "./types";

const inspector = createBrowserInspector();


const azureLanguageCredentials = {
  endpoint: "https://language-lab4vavanzan.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview",
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointment" /** your Azure CLU deployment */,
  projectName: "appointment" /** your Azure CLU project name */,
};

        

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};


const settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials, 
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};



const grammar: {[index: string]: string} = {
  "lady gaga": "Lady Gaga is a world-famous singer, songwriter, and actress known for hits like 'Bad Romance' and new album 'Mayhem'.",
  "fernanda torres": "Fernanda Torres is a Brazilian actress golden globe winner as best actress for her role in the movie 'I'm still here'.",
  "santos dumont": "Santos Dumont was a Brazilian aviation pioneer who invented the first airplane.",
  "paulo freire": "Paulo Freire was a Brazilian educator and philosopher, best known for his influential work 'Pedagogy of the Oppressed'.",
  "rbd": "RBD was a Mexican pop group formed from the telenovela 'Rebelde', achieving great international success.",
  "green day": "Green Day is an American rock band known for hits like 'Boulevard of Broken Dreams' and 'American Idiot. They are coming to Sweden and life will be better'."
};

function isInGrammar(entities: nluResponse["entities"] | undefined): string {
  if (!entities || entities.length === 0) {
    return "I have no clue what you're talking about. Don't make me waste my time with irrelevant people.";
  }
  
  const text = entities[0]["text"]?.toLowerCase();
  
  return text && text in grammar ? grammar[text] : "I have no clue what you're talking about.";
}


function getAnswer(entities: nluResponse["entities"]) {
  var answer: string[] = ["null","null","null"] 
  for (let i = 0; i < entities.length; i++) {
    if (entities[i]["category"] == "meeting with") { 
      answer[0] = entities[i]["text"]
    }
    else if (entities[i]["category"] == "meeting day") { 
      answer[1] = entities[i]["text"]
    }
    else if (entities[i]["category"] == "meeting time") { 
      answer[2] = entities[i]["text"]
    }
  }
  return answer;
}

function getEntity(response: nluResponse, entity: string) {
  for (let i = 0; i < response["entities"].length; i++) {
    if (response["entities"][i]["category"] == entity) {
      return true;
    }
  }
  return false;
}

function safeGetEntities (context: DMContext) {
  return context.lastResult && isNluResponse(context.lastResult) ? context.lastResult["entities"] : [];
}
//

function isNluResponse(obj: any): obj is nluResponse {
  return obj && typeof obj === "object" && "topIntent" in obj;
}




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
    "spst.listen.nlu" :({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
        value: { nlu: true },
      }),  
  },
}).createMachine({
  id: "DM",
  initial: "Prepare",
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null as nluResponse | Hypothesis[] | null, //undefined
    meetingWith: null, 
    meetingDay: null,
    meetingTime: null,
    famousPerson: null,
    enableNLU: true,
  }),
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
            target: "Exit",   

            guard: ({ context }) => !!context.lastResult && isNluResponse (context.lastResult) && context.lastResult.topIntent === "exit",
          },
          {
            target: "Meeting",
            guard: ({ context }) => !!context.lastResult && isNluResponse(context.lastResult) && context.lastResult.topIntent === "create a meeting",
            actions: assign(({ context }) => ({
                        meetingWith: getAnswer(context.lastResult!["entities"])[0], //context.lastResult as nluResponsez
                        meetingDay: getAnswer(context.lastResult!["entities"])[1],
                        meetingTime: getAnswer(context.lastResult!["entities"])[2],  //const entities = isNluResponse(context.lastResult) ? context.lastResult.entities : [];

                      }))
          },
          {
            target: "WhoIsX",
            guard: ({ context }) => !!context.lastResult &&  isNluResponse(context.lastResult) && context.lastResult.topIntent === "who is X",
            actions: assign(({ context }) => ({
              famousPerson: isInGrammar(context.lastResult!["entities"]),
            }))
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Hey there! What's the adventure today?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                console.log("NLU Recognised Event:", event);
                console.log("nluValue:", event.nluValue);
                return { lastResult: event.nluValue }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
          },
        },
        NoInput: {
          entry: { type: "spst.speak", params: { utterance: "Sorry, I'm just a bot ha ha ha ha. Please, repeat." } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
      },
    },
    Meeting: {
      entry: { type: "spst.speak", params: { utterance: "Ok!" } },
      on: { 
        SPEAK_COMPLETE: [
          {
            guard: ({ context }) => context.meetingWith == "0",
            target: "MeetingWith"
          },
          {
            guard: ({ context }) => context.meetingTime == "0",
            target: "FullDay"
          },
          {
            guard: ({ context }) => context.meetingDay == "0",
            target: "MeetingDay"
          },
          {
            guard: ({ context }) => context.meetingTime != "0" && context.meetingWith != "0" && context.meetingDay != "0",
            target: "Summary" 
          },
        ]},
    },
    WhoIsX: {
      entry: { type: "spst.speak", 
        params: ({ context }) => ({
          utterance: `${context.famousPerson}`,
        }),
       },
      on: { SPEAK_COMPLETE: "Done" },
    },
    FullDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "exit",
          },
          {
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "yes",
            target: "Meeting",
            actions: assign({ meetingTime: null }) 
          },
          {
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "no",
            target: "MeetingTime",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Will it take the whole day?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                console.log("NLU Recognised Event:", event);
                console.log("nluValue:", event.nluValue);
                return { lastResult: event.nluValue }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "Sorry, I'm just a bot ha ha ha ha. Please, repeat." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
    },
    MeetingWith: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "exit",
          },
          {
            guard: ({ context }) => !!context.lastResult && getEntity(context.lastResult, "meeting with"),
            actions: assign(({ context }) => ({
              meetingWith: getAnswer(context.lastResult!["entities"])[0], 
            })),
            target: "Meeting",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Who are you meeting with?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                console.log("NLU Recognised Event:", event);
                console.log("nluValue:", event.nluValue);
                return { lastResult: event.nluValue }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "Sorry, I'm just a bot ha ha ha ha. Please, repeat." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
    },
    MeetingDay: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "exit",
          },
          {
            guard: ({ context }) => !!context.lastResult && getEntity(context.lastResult, "meeting day"),
            actions: assign(({ context }) => ({
              meetingDay: getAnswer(context.lastResult!["entities"])[1],
            })),
            target: "Meeting",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "What day is your meeting?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                console.log("NLU Recognised Event:", event);
                console.log("nluValue:", event.nluValue);
                return { lastResult: event.nluValue }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "I didn't catch that, please try again." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
    },
    MeetingTime: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "exit",
          },
          {
            guard: ({ context }) => !!context.lastResult && getEntity(context.lastResult, "meeting time"),
            actions: assign(({ context }) => ({
              meetingTime: getAnswer(context.lastResult!["entities"])[2], 
            })),
            target: "Meeting",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "What time is your meeting?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                console.log("NLU Recognised Event:", event);
                console.log("nluValue:", event.nluValue);
                return { lastResult: event.nluValue }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "Sorry, I'm just a bot ha ha ha ha. Please, repeat." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
    },
    Summary: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "exit",
          },
          {
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "yes",
            target: "AppointmentCreated",
          },
          {
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "no",
            actions: assign({ meetingWith: "0",  meetingDay: "0", meetingTime: "0" }),
            target: "Meeting",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: {
                  type: "spst.speak",
                  params: ({ context }) => ({
                    utterance: `Are you sure you want me to create an appointment with ${context.meetingWith}
                      ${context.meetingTime == null ? `${context.meetingDay} for the whole day? Don't you have anything better to do with your time`
                        : `${context.meetingDay} ${context.meetingTime}?`} `,
                  }),
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                console.log("NLU Recognised Event:", event);
                console.log("nluValue:", event.nluValue);
                return { lastResult: event.nluValue }
              }),
            },
            ASR_NOINPUT: { actions: assign({ lastResult: null }) },
            },
          },
          NoInput: {
            entry: { type: "spst.speak", params: { utterance: "Sorry, I'm just a bot ha ha ha ha. Please, repeat." } },
            on: { SPEAK_COMPLETE: "Listen" },
          },
        },
    },
    AppointmentCreated: {
        entry: { type: "spst.speak", params: { utterance: "Oh, well! Your appointment has been created!" } },
        on: { SPEAK_COMPLETE: "Done" },
    }, 
    Exit: {
      entry: { type: "spst.speak", params: { utterance: "Bye! Thank you for wasting my time. At least I don't have a social life." } },
      on: { SPEAK_COMPLETE: "Done" },
    },
    Done: {
      on: {
        CLICK: [
          {
            target: "Greeting",
            actions: assign({ meetingWith: null,  meetingDay: null, meetingTime: null, famousPerson: null }),
          }
      ]},
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
  console.log("nlu response:", state.context.lastResult);
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