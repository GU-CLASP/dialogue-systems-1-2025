import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupButton, setupText, setupBackground, setupPerson, setupCat, setupEyes, setupAccessory } from "./dm.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class="card">
      <h3 id="room_info"></h3>
      <div class="images">
        <img class="background" id="background" src='./public/menu.png'></img>
        <img class="person" id="person" src='./public/empty.png'></img>
        <img class="cat" id="cat" src='./public/empty.png'></img>
        <img class="eyes" id="eyes" src='./public/empty.png'></img>
        <img class="accessory" id="accessory" src='./public/empty.png'></img>
      </div>
      <br>
      <button id="counter" type="button"></button>
    </div>
  </div>
`;

setupText(document.querySelector<HTMLHeadingElement>("#room_info")!);
setupButton(document.querySelector<HTMLButtonElement>("#counter")!);
setupBackground(document.querySelector<HTMLImageElement>("#background")!);
setupPerson(document.querySelector<HTMLImageElement>("#person")!);
setupCat(document.querySelector<HTMLImageElement>("#cat")!);
setupEyes(document.querySelector<HTMLImageElement>("#eyes")!);
setupAccessory(document.querySelector<HTMLImageElement>("#accessory")!);