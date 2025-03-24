import "./style.css";
import { setupButton } from "./dm_project.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<h1 class="heading">Voiced Crosswords</h1>  

<div>
    <div class="card">
      <button id="start" type="button"></button>
    </div>
    <div id="puzzle"></div>
</div>
`;

setupButton(document.querySelector<HTMLButtonElement>("#start")!);

