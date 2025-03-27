import React, { useEffect, useState } from "react";
import { createActor, assign } from "xstate";
import { speechstate, Settings } from "speechstate";
import { setup } from "xstate"

const maze = [
  ["#", "#", "#", "#", "#"],
  ["#", "S", " ", "D", "#"],
  ["#", "#", "#", " ", "#"],
  ["#", "Q", "#", "E", "#"],
  ["#", "#", "#", "#", "#"],
];

const startPos = { x: 1, y: 1 };

const settings: Settings = {
  azureCredentials: {
    endpoint: "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
    key: "YOUR_AZURE_KEY",
  },
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

const grammar = {
  "go up": { move: "up" },
  "go down": { move: "down" },
  "go left": { move: "left" },
  "go right": { move: "right" },
  "where am i": { ask: "position" },
};

const getMoveDirection = (utterance: string): string | null => {
  return grammar[utterance]?.move || null;
};

const isAt = (pos: any, target: any) => pos.x === target.x && pos.y === target.y;

const getNextPos = (pos: any, dir: string) => {
  const delta: any = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const next = { x: pos.x + delta[dir].x, y: pos.y + delta[dir].y };
  return next;
};

const spMachine = setup({
  types: {
    context: {} as {
      spstRef: any;
      playerPos: { x: number; y: number };
      speech: string;
      moveDirection?: string;
    },
    events: {} as any,
  },
  actions: {
    speak: ({ context }, params: { utterance: string }) =>
      context.spstRef.send({ type: "SPEAK", value: { utterance: params.utterance } }),
    listen: ({ context }) => context.spstRef.send({ type: "LISTEN" }),
  },
}).createMachine({
  id: "maze",
  initial: "Prepare",
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    playerPos: startPos,
    speech: "",
  }),
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "Welcome" },
    },
    Welcome: {
      entry: {
        type: "speak",
        params: { utterance: "Welcome to the maze game. Where do you want to go?" },
      },
      on: { SPEAK_COMPLETE: "ListenCommand" },
    },
    ListenCommand: {
      entry: { type: "listen" },
      on: {
        RECOGNISED: {
          actions: assign(({ event }) => ({
            moveDirection: getMoveDirection(event.value[0].utterance),
          })),
          target: "MovePlayer",
        },
        ASR_NOINPUT: {
          actions: assign({ speech: "I couldn't hear you. Please say it again." }),
          target: "Speak",
        },
      },
    },
    MovePlayer: {
      always: [
        {
          cond: ({ context }) => {
            if (!context.moveDirection) return false;
            const next = getNextPos(context.playerPos, context.moveDirection);
            return maze[next.y][next.x] !== "#";
          },
          actions: assign(({ context }) => ({
            playerPos: getNextPos(context.playerPos, context.moveDirection!),
          })),
          target: "CheckEvent",
        },
        {
          actions: assign({ speech: "There's a wall. Try a different direction." }),
          target: "Speak",
        },
      ],
    },
    CheckEvent: {
      always: [
        {
          cond: ({ context }) => isAt(context.playerPos, { x: 3, y: 1 }),
          target: "DarkRoom",
        },
        {
          cond: ({ context }) => isAt(context.playerPos, { x: 1, y: 3 }),
          target: "QuizRoom",
        },
        {
          cond: ({ context }) => isAt(context.playerPos, { x: 3, y: 3 }),
          target: "Victory",
        },
        { target: "Speak" },
      ],
    },
    DarkRoom: {
      entry: assign({ speech: "It's too dark here. Move carefully." }),
      always: "Speak",
    },
    QuizRoom: {
      entry: assign({
        speech: "Riddle: 'It has no body and no shadow, it reflects in water but never gets wet. What is it?'",
      }),
      on: { "": "AskQuiz" },
    },
    AskQuiz: {
      entry: { type: "speak", params: ({ context }) => ({ utterance: context.speech }) },
      on: { SPEAK_COMPLETE: "GetQuizAnswer" },
    },
    GetQuizAnswer: {
      entry: { type: "listen" },
      on: {
        RECOGNISED: [
          {
            cond: ({ event }) => event.value[0].utterance.toLowerCase().includes("mirror"),
            actions: assign({ speech: "Correct! You may proceed." }),
            target: "Speak",
          },
          {
            actions: assign({ speech: "Incorrect. Try again." }),
            target: "Speak",
          },
        ],
      },
    },
    Speak: {
      entry: { type: "speak", params: ({ context }) => ({ utterance: context.speech }) },
      on: { SPEAK_COMPLETE: "ListenCommand" },
    },
    Victory: {
      entry: {
        type: "speak",
        params: { utterance: "Congratulations! You've escaped the maze." },
      },
    },
  },
});

const mazeActor = createActor(spMachine).start();

export default function App() {
  const [snapshot, setSnapshot] = useState(mazeActor.getSnapshot());

  useEffect(() => {
    const sub = mazeActor.subscribe(setSnapshot);
    return () => sub.unsubscribe();
  }, []);

  const pos = snapshot.context.playerPos;

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">🎙️ Voice Maze Game</h1>
      <div className="grid grid-cols-5 gap-1 w-fit mx-auto">
        {maze.map((row, y) =>
          row.map((cell, x) => {
            const isPlayer = pos.x === x && pos.y === y;
            return (
              <div
                key={`${x}-${y}`}
                className={`w-10 h-10 text-center text-xl flex items-center justify-center border
                  ${cell === "#" ? "bg-gray-700" :
                    cell === "E" ? "bg-green-400" :
                      cell === "Q" ? "bg-yellow-300" :
                        cell === "D" ? "bg-purple-300" :
                          "bg-white"}
                  ${isPlayer ? "border-4 border-blue-500" : ""}`}
              >
                {isPlayer ? "🧍" : ""}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 text-lg italic">{snapshot.context.speech}</div>
    </div>
  );
}
