import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupButton } from "./dm_project.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
  </div>
`;

setupButton(document.querySelector<HTMLButtonElement>("#counter")!);
