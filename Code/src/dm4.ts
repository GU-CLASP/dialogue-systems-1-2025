import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
import { getCelebrityInfo, isInPerson, getPerson, isInDay, getDay, isInTime, getTime, isYes, isNo } from "./grammars.ts";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};


const azureLanguageCredentials = {
  endpoint: "https://lang-res-labs.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "appointment" /** your Azure CLU deployment */,
  projectName: "appointment" /** your Azure CLU project name */,
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


function getAffirmativeSaying(value: string, valueType: string){
  return `You just said: ${value} and it is in the grammar for ${valueType}. ${valueType} saved.`
}

function getNegativeSaying(value: string, valueType: string){
  return `You just said: ${value} and it is not in the grammar for ${valueType}.` 
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
        value: {nlu: true}
      }),
    "save_person": function ({ context }){
      context.person = getPerson(context.lastResult![0].utterance.split(" ")[0]);
      context.lastResult = null;
    },
    "save_day": function ({ context }){
      context.day = getDay(context.lastResult![0].utterance.split(" ")[0]);
      context.lastResult = null;
    },
    "save_time": function ({ context }){
      context.time = getTime(context.lastResult![0].utterance.split(" ")[0]);
      context.lastResult = null;
    },
    "save_celebrity": function ({ context }){
      context.celebrity = context.lastNLU.entities[0].text
    },
    "tellinfo": function ({ context }){
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: getCelebrityInfo(context.celebrity),
        },
      })
    }
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    person: null,
    day: null,
    time: null,
    currentQuestion: null,
    celebrity: null,
    lastNLU: null
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
      id: "Greeting",
      entry: { type: "spst.speak", params: { utterance: `What would you like to do?` } },
      on: { SPEAK_COMPLETE: "AskType"}
    },
    AskType: {
      id: "AskType",
      initial: "Ask",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#Questions.Question_Again",
            guard: ({ context }) => context.lastNLU.topIntent == "create meeting",
          },
          {
            target: "CelebrityInfo",
            guard: ({ context }) => context.lastNLU.topIntent == "who is X",
          },
          { target: ".Ask" },
        ],
      },
      states: {
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastNLU: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastNLU: null }),
            },
          },
        },
      }
    },
    CelebrityInfo: {
      id: "CelebrityInfo",
      initial: "Start",
      states: {
        Start: {
          always: [
            {
              target: "TellInfo",
              actions: "save_celebrity",
              guard: ({ context }) => checkForCelebrity(context),
              },
            { target: "AskCelebrity" },
          ],
        },
        TellInfo: {
          entry: { type: "tellinfo" },
          on: { SPEAK_COMPLETE: "#Greeting" },
        },
        AskCelebrity: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Which celebrity do you want to know about?` },
          },
          on: { SPEAK_COMPLETE: "#AskType"}
        }
      }      
    },
    Listening: {
      initial: "Ask",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "#Questions.Question_Again",
            guard: ({ context }) => !!context.lastNLU,
          },
          { target: "#NoInput" },
        ],
      },
      states: {
        NoInput: {
          id: "NoInput",
          entry: {
            type: "spst.speak",
            params: { utterance: `I can't hear you!` },
          },
          on: { SPEAK_COMPLETE: "#Questions.Question_Again" },
        },
        Ask: {
          id: "Ask",
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event }) => {
                return { lastNLU: event.nluValue };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastNLU: null }),
            },
          },
        },
      },
    },
    Questions: {
      id: "Questions",
      initial: "PersonQuestion",
      states: {
        Question_Again: {
          type: "history",
          history: "shallow",
          target: "PersonQuestion"
        },
        PersonQuestion: {
          id: "PersonQuestion",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "#DayQuestion",
                  guard: ({ context }) => checkForPerson(context),
                },
                { target: "PersonPrompt" },
              ],
            },
            PersonPrompt: {
              entry: { type: "spst.speak", params: { utterance: `Who are you meeting with?` } },
              on: { SPEAK_COMPLETE: "#Ask" },
            },
          },
        },
        DayQuestion: {
          id: "DayQuestion",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "#TimeQuestion",
                  guard: ({ context }) => checkForDay(context),
                },
                { target: "DayPrompt" },
              ],
            },
            DayPrompt: {
              entry: { type: "spst.speak", params: { utterance: "On which day is your meeting?" } },
              on: { SPEAK_COMPLETE: "#Ask" },
            },
          },
        },
        TimeQuestion: {
          id: "TimeQuestion",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "#Confirm",
                  guard: ({ context }) => checkForTime(context),
                  },
                { target: "TimePrompt" },
              ],
            },
            TimePrompt: {
              entry: { type: "spst.speak", params: { utterance: "Which time is your meeting?" } },
              on: { SPEAK_COMPLETE: "#Ask" },
            },
          },
        },
        Confirm:{ 
          id: "Confirm",
          initial: "Start",
          states: {
            Start: {
              always: [
                {
                  target: "#Done",
                  guard: ({ context }) => checkForYes(context),
                },
                {
                  target: "#PersonQuestion",
                  guard: ({ context }) => checkForNo(context),
                },
                { target: "ConfirmPrompt" },
              ],
            },
            ConfirmPrompt: {
              entry: { type: "spst.speak", 
                params: ({ context }) => ({
                  utterance: `Do you want to create an appointment with ${context.person} on ${context.day} ${context.time == null ? "for the whole day" : "at" + context.time}?`,
                }),
              },
              on: { SPEAK_COMPLETE: "#Ask" },
            }, 
          },
        },
      },
    },
    Done: { 
      id: "Done",
      entry: {
        type: "spst.speak", params : {utterance: "Your appointment has been created. Thank you for using our service."}
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
function checkForCelebrity(context: DMContext): any {
  if (context.lastNLU != null 
      && context.lastNLU.entities.length > 0 
      && context.lastNLU.entities[0].category == "Celebrity"){
    return true
  } else {
    return false
  }
}

function checkForPerson(context: DMContext) {
  if (context.lastNLU != null){
    if (context.lastNLU.entities.length > 0){
      for (let i: number = 0; i < context.lastNLU.entities.length; i++){
        if (context.lastNLU.entities[i].category == "Person"){
          context.person = context.lastNLU.entities[i].text
          return true
        }
      }
    }
  }
  return false
}

function checkForDay(context: DMContext) {
  if (context.lastNLU != null){
    if (context.lastNLU.entities.length > 0){
      for (let i: number = 0; i < context.lastNLU.entities.length; i++){
        if (context.lastNLU.entities[i].category == "Day"){
          context.day = context.lastNLU.entities[i].text
          return true
        }
      }
    }
  }
  return false
}

function checkForTime(context: DMContext) {
  if (context.lastNLU != null){
    if (context.lastNLU.entities.length > 0){
      for (let i: number = 0; i < context.lastNLU.entities.length; i++){
        if (context.lastNLU.entities[i].category == "Time"){
          context.time = context.lastNLU.entities[i].text
          return true
        }
      }
    }
  }
  return false
}

function checkForYes(context: DMContext) {
  if (context.lastNLU != null){
    if (context.lastNLU.entities.length > 0){
      for (let i: number = 0; i < context.lastNLU.entities.length; i++){
        if (context.lastNLU.entities[i].category == "Positive Confirmation"){
          return true
        }
      }
    }
  }
  return false
}

function checkForNo(context: DMContext) {
  if (context.lastNLU != null){
    if (context.lastNLU.entities.length > 0){
      for (let i: number = 0; i < context.lastNLU.entities.length; i++){
        if (context.lastNLU.entities[i].category == "Negative Confirmation"){
          return true
        }
      }
    }
  }
  return false
}