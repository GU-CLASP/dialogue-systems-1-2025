import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents, nluResponse } from "./types";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://lr4.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview",
  key: NLU_KEY,
  deploymentName: "appointment",
  projectName: "appointment",
};


const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};


const grammar: {[index: string]: string} = {
  "timothée de fombelle" : "timothée de fombelle is the author of my favourite book, called Toby Alone",
  "philip pullman" : "philip pullman is a well known writer, his books include the fantasy trilogy His Dark Materials",
  "violet sorrengail" : "violet sorrengail is the main character of the book series Fourth Wing",
  "rebecca yarros" : "rebecca yarros is the author of the book series Fourth Wing",
  "winnie the pooh" : "winnie the pooh is the main character of the beloved homonymous book series and movies",
  "spiderman" : "spiderman is one of the most loved Marvel Comics' characters",
  "benedict cumberbatch" : "benedict cumberbatch is a well known actor who plays Doctor Strange in the Marvel movies",
  "harry potter" : "harry potter is the main character of the world-wide known homonymous book series",
  "emma watson" : "emma watson is a very well known actress who plays Hermione in the Harry Potter movies",
  "chris hemsworth" : "chris hemsworth is a well known actor who plays Thor in the Marvel movies",
}

function isInGrammar(entities:  nluResponse["entities"]) {
  if (entities.length != 0) { //necessary for when the name of the person isn't provided, so there is no entity
    if (entities[0]["text"].toLowerCase() in grammar) {
      return grammar[entities[0]["text"].toLowerCase()]
    }
  }
  return "I don't know who this person is";
}

function getAnswer(entities: nluResponse["entities"]) {
  var answer: string[] = ["0","0","0"] //initalize array for person, day and time of meeting
  for (let i = 0; i < entities.length; i++) {
    if (entities[i]["category"] == "meeting with") { //if the person is retrieved by the model, the answer will contain the name instead of 0 ...
      answer[0] = entities[i]["text"]
    }
    else if (entities[i]["category"] == "meeting day") { //... and so for day ...
      answer[1] = entities[i]["text"]
    }
    else if (entities[i]["category"] == "meeting time") { //... and time.
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
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    meetingWith: null, 
    meetingDay: null,
    meetingTime: null,
    famousPerson: null,
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
            target: "Exit",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "exit",
          },
          {
            target: "Meeting",
            guard: ({ context }) => !!context.lastResult && context.lastResult!["topIntent"] == "create a meeting",
            actions: assign(({ context }) => ({
                        meetingWith: getAnswer(context.lastResult!["entities"])[0],
                        meetingDay: getAnswer(context.lastResult!["entities"])[1],
                        meetingTime: getAnswer(context.lastResult!["entities"])[2],
                      }))
          },
          {
            target: "WhoIsX",
            guard: ({ context }) => !!context.lastResult &&  context.lastResult!["topIntent"] == "who is X",
            actions: assign(({ context }) => ({
              famousPerson: isInGrammar(context.lastResult!["entities"]),
            }))
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Hello! What can I help you with today?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
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
            target: "Summary" //when all information is retrieved, summarize the appointment
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
            actions: assign({ meetingTime: null }) //so the guard for the time in Meeting won't be triggered
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
              meetingWith: getAnswer(context.lastResult!["entities"])[0], //only retrieve the part of the array that contains the relevant info
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
              meetingDay: getAnswer(context.lastResult!["entities"])[1], //only retrieve the part of the array that contains the relevant info
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
              meetingTime: getAnswer(context.lastResult!["entities"])[2], //only retrieve the part of the array that contains the relevant info
            })),
            target: "Meeting",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "At what time is your meeting?" } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen.nlu" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
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
            target: "Meeting", //if the appointment is wrong, delete all info and ask again
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: {
                  type: "spst.speak",
                  params: ({ context }) => ({
                    utterance: `Do you want me to create an appointment with ${context.meetingWith}
                      ${context.meetingTime == null ? `${context.meetingDay} for the whole day?` //specific formula for full day or not
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
    AppointmentCreated: {
        entry: { type: "spst.speak", params: { utterance: "Your appointment has been created!" } },
        on: { SPEAK_COMPLETE: "Done" },
    }, 
    Exit: {
      entry: { type: "spst.speak", params: { utterance: "Exiting the program without an appointment." } },
      on: { SPEAK_COMPLETE: "Done" },
    },
    Done: {
      on: {
        CLICK: [
          {
            target: "Greeting",
            actions: assign({ meetingWith: null,  meetingDay: null, meetingTime: null, famousPerson: null }),
          } //reassign everything to null to avoid having old information when trying to book a new meeting
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