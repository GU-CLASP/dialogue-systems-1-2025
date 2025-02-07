import { createMachine, assign, createActor } from "xstate"



export function setupCounter(element: HTMLButtonElement) {
  const countMachine = createMachine({
    context: {
      count: 0,
    },
    on: {
      INC: {
        actions: assign({
          count: ({ context }) => context.count + 1,
        }),
      },
    },
  });

  const countActor = createActor(countMachine).start();

  countActor.subscribe((state) => {
    element.innerHTML = `count is ${state.context.count}`;
  });
  element.addEventListener('click', () => countActor.send({ type: 'INC' }))

  element.innerHTML = `count is 0`;

}
