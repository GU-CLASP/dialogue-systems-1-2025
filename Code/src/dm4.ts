import { assign, createActor, setup } from "xstate";
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
    endpoint: "https://lab4resource.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
    key: NLU_KEY /** reference to your Azure CLU key */,
    deploymentName: "appointment" /** your Azure CLU deployment */,
    projectName: "appointment" /** your Azure CLU project name */,
  };

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials /** global activation of NLU */,
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
  answer?: string;
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
  "0": { time: "0:00" },
  "1": { time: "1:00" },
  "2": { time: "2:00" },
  "3": { time: "3:00" },
  "4": { time: "4:00" },
  "5": { time: "5:00" },
  "6": { time: "6:00" },
  "7": { time: "7:00" },
  "8": { time: "8:00" },
  "9": { time: "9:00" },
  "10": { time: "10:00" },
  "11": { time: "11:00" },
  "12": { time: "12:00" },
  "13": { time: "13:00" },
  "14": { time: "14:00" },
  "15": { time: "15:00" },
  "16": { time: "16:00" },
  "17": { time: "17:00" },
  "18": { time: "18:00" },
  "19": { time: "19:00" },
  "20": { time: "20:00" },
  "21": { time: "21:00" },
  "22": { time: "22:00" },
  "23": { time: "23:00" },
  "yes": { answer: "yes"},
  "of course": { answer: "yes"},
  "yeah": { answer: "yes"},
  "yes, please": { answer: "yes"},
  "sure": { answer: "yes"},
  "ok": { answer: "yes"},
  "okay": { answer: "yes"},
  "no": { answer: "no" },
  "nah": { answer: "no" },
  "no way": { answer: "no" },
  "no thank you": { answer: "no" },
  "no thanks": { answer: "no" },
};

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
        value: { nlu: true },
      }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    person: '',
    day: '',
    time: '',
    question: "How can I help you today?",
    intent: '',
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      on: { CLICK: "Begin" },
    },
    Begin: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: ".Prompt",
            guard: ({ context }) => !!context.lastResult && context.intent == "Create a meeting",
            actions: assign(({ context }) => {
              if (context.person != '' && context.day != '' && context.time != '') {
                context.question = `Do you want to make an appointment with ${context.person} on ${context.day} at ${context.time}?`
              } else if (context.person != '' && context.day != '' && context.time == '') {
                context.question = `Do you want to make an appointment with ${context.person} on ${context.day}?`
              } else {
                context.question = 'Please repeat your request with more details about your appointment.'
              }

              return { question: context.question, intent: '' }
            }),
          },
          {
            target: "WhoIsX",
            guard: ({ context }) => !!context.lastResult && context.intent == "WhoMerylStreep",
          },
          {
            target: ".Prompt",
            guard: ({ context }) => !!context.lastResult && (context.question == `Do you want to make an appointment with ${context.person} on ${context.day}?` || context.question == `Do you want to make an appointment with ${context.person} on ${context.day} at ${context.time}?`) && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).answer == "no",
            actions: assign({ question: "How can I help you today?" }),
          },
          {
            target: "Done",
            guard: ({ context }) => !!context.lastResult && (context.question == `Do you want to make an appointment with ${context.person} on ${context.day}?` || context.question == `Do you want to make an appointment with ${context.person} on ${context.day} at ${context.time}?`) && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).answer == "yes",
            actions: assign({ question: "How can I help you today?", person: '', day: '', time: '' }),
          },
          { target: ".Prompt" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: ({ context }) => ({ utterance: `${context.question}` }) },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: assign(({ event, context }) => {
                if (event.nluValue.topIntent == "Create a meeting" && event.nluValue.intents[0]['confidenceScore'] > 0.85) {
                  for (let i = 0; i < event.nluValue.entities.length; i++) {
                    if (event.nluValue.entities[i].category == "MeetingPerson") {
                      context.person = event.nluValue.entities[i].text
                    }

                    if (event.nluValue.entities[i].category == "MeetingDay") {
                      context.day = event.nluValue.entities[i].text
                    }

                    if (event.nluValue.entities[i].category == "MeetingTime") {
                      context.time = event.nluValue.entities[i].text
                    }
                  }
                  
                  context.intent = event.nluValue.topIntent
                } else if (event.nluValue.topIntent == "WhoMerylStreep" && event.nluValue.intents[0]['confidenceScore'] > 0.85) {
                  context.intent = event.nluValue.topIntent
                }
                
                return { lastResult: event.value };
              }),
            },
            ASR_NOINPUT: {
              actions: assign({ lastResult: null, intent: '' }),
            },
          }
        },
      }
    },
    WhoIsX: {
      entry: { type: "spst.speak", params: { utterance: "Meryl Streep is an American actress who has starred in many popular films, such as The Devil Wears Prada (2006) and Mamma Mia! (2006). She has received three Academy Awards." }},
      on: { CLICK: "Begin" }
    },
    Done: {
      entry: { type: "spst.speak" , params: { utterance: `Your appointment has been created!` }},
      on: { CLICK: "Begin", }
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