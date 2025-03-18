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

const scentenceFalseFriend = [{prompt: "sentence0", key: "Cat", clue1: "guess better", clue2: "stupid"}, 
{prompt: "sentence1", key: "falseFriend1", clue1: "guess more", clue2: "better"}]

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
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
  /** @xstate-layout N4IgpgJg5mDOIC5QBECyA6ACgJzABwENcBiAQQGUAlAFWvIH1KBRU5ATQG0AGAXUVDwB7WAEsALiMEA7fiAAeiAExcu6AJwBWAMwBGHVq4AWHYrVrDAGhABPRDqPpDZswHZFWzTsNaAbAF8-KzR0AHUCcWpBcjEiMWIAYQAZAEl4gGluPiQQIVEJaVkFBA1FK1tigA4NRy4fRRKuLx0NCq0AoIwAcVwwCSkoYhTyaiYAOXp4gHlUTESmEczZXPFJGWyivUVFdBcKk3cuNR8dF0NSm0QNNRd1WvrlJpa2wJBg7rBekX7B5OGxiems3mTA4OiyAmEKwK6zsalUXCqalMPi4pmuJzKlzctzqDUerXary6PT6UCw2EEAFs8HFyJgWGkATM5gteEtIfk1qAii5UeguLp3G47k5zuUfLsanUzqi1FoKj4KoS3iSvmTRoJklI8ABXWn00iMqbM4GLbLLTmFRC87YCkxaYXSpGY4rYuG4h7GJ7K4kfUnoUiwADWxGYU06o1+TGQZoheVWVoQSNUB0Mhiq9U2Lo02nU2j0LiROd2Gh96Hen36AeDZCo9FGk2So0wAFVqLGchyEzCkzofOgtFplFxeYZdqYxYhDBobk4zBU5Yo6hUqmX4gALMAAYyD3QIlMpRGIdIZTKBrPBnfj0O5iDqLs2WnQPg0dV8Rl0SKVL2CyGkYASFJ0g7C1u1vBBmmqBErmRWV0RcF0qh0dBmjfXkHRUHQAheKRBAgOBZDQdlry5eREAAWh8F1KLLHB8CIMBiKhUiijORDkI0FRMJcLQ538H8MDCCIohibAxCYy0e3lZDFDOE5WhfIdBwfBxnFcdxPG8Z4OnLVV+gksCyIgs5+URWC0RcDELgQXw1HUNSTk4rZpzLCt-RwKkaQMm8jM4ip1BcF9jkC5Q0wqF0X2qQwRRfWSFVXATdL9NV0A1LVdXE80ux8oo-ICoKTjqIx02zJwcXqF9Dh8QxXL0slAyDbyWMQOEn2CvsHjUE4zAinMpVk2L00VUtEo3bdd2wfdD2wJrEyaJ8Sl4oxdmuDQx2zU5yvcdw9lab8dL-KRGKykjEyXBazPTEw5VqB9rp2DxXyRewFy8bC-CAA */
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    currentSentenceIndex: 0,
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
            target: ".rightWord",
            actions: assign({currentSentenceIndex: ({context}) => context.currentSentenceIndex + 1}),
            guard: ({context}) => scentenceFalseFriend[context.currentSentenceIndex]['key'] == context.lastResult![0].utterance,
          },
          //{ target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: ({context}) =>  ({utterance: scentenceFalseFriend[context.currentSentenceIndex]['prompt']}) },
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
              actions: assign(({event}) => {return {lastResult: event.value};})
            }
              //{target: "wrongGuess"}
          },
        },
        rightWord: {
          entry: {type: "spst.speak", params: {utterance: "Congratulations! You figured it out"}},
          on: {SPEAK_COMPLETE: [
              {guard: ({context}) =>  (context.currentSentenceIndex < scentenceFalseFriend.length),
              target: "Prompt"},
              //{guard: ({context}) => {return (context.currentSentenceIndex >= scentenceFalseFriend.length - 1) ? true:false;},
              {target: "Guess"},
          ]}
        },
        Guess: {
          entry: {type: "spst.speak", params: {utterance: "Any guess?"}},
          on: {SPEAK_COMPLETE: "Ask"}
        },
        // nextSentence: {
        //   entry: assign({currentSentenceIndex: ({context}) => context.currentSentenceIndex + 1}),
        //   on: {SPEAK_COMPLETE: [
        //       {guard: ({context}) => context.currentSentenceIndex < scentenceFalseFriend.length,
        //       target: "Prompt"},
        //       // {target: "exit"}
        //   ]}
        // },
      },
    },
    CheckGrammar: {
        id: "CheckGrammar",
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