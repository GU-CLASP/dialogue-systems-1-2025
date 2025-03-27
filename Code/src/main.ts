import "./style.css";
import { setupPersonButton, answer, dmActor } from "./project";

document.addEventListener("DOMContentLoaded", () => {
  const startGameButton = document.getElementById("startGame") as HTMLButtonElement;
  const helpButton = document.getElementById("help") as HTMLButtonElement;
  const personButtons = document.querySelectorAll<HTMLButtonElement>(".personButton");
  const answer_texts = document.querySelectorAll<HTMLParagraphElement>(".answer"); 
  
    startGameButton!!.addEventListener("click", () => {
      document.getElementById("instructions")!!.style.display="none";
      document.getElementById("startGame")!!.style.display="none";
      document.querySelector("h2")!!.style.display = "none";
      document.getElementById("wish")!!.style.display="none";
      document.getElementById("personButtons")!!.style.display="block";
      document.getElementById("help")!!.style.display="block";
      dmActor.send({ type: "CLICK" });
    });
    
  let helpMessageshown = false;
  helpButton!!.addEventListener("click", () => {
  const helpMessage = document.getElementById("helpMessage");
    if (helpMessageshown) {
       helpMessage!!.style.display = "none";
       helpMessageshown = false;
    } else {
       helpMessage!!.style.display = "block";
       helpMessageshown = true;
    }
  dmActor.send({ type: "CLICK" });
});


  dmActor.subscribe((snapshot) => {
    personButtons.forEach((button) => {
      setupPersonButton(button, snapshot.context.count);
    });
    answer_texts.forEach((paragraph) => {
      answer(paragraph, snapshot.context.place, snapshot.context.next);                         
    });
  });
});



/* import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupButton } from "./project.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
  </div>
`;

setupButton(document.querySelector<HTMLButtonElement>("#counter")!); */