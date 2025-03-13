import "./style.css";
import { setupButton } from "./dm4_test_fixed";

// Set up the main application UI

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class="card">
      <button id="speakButton" type="button">Speak</button>
    </div>
  </div>
`;

const speakButton = document.querySelector<HTMLButtonElement>("#speakButton");

if (speakButton) {
  console.log("✅ Speak button found and setting up!");
  speakButton.addEventListener("click", () => {
    console.log("🎤 Bot is now listening...");
    setupButton(speakButton); // Ensures the bot listens when Speak is clicked
  });
} else {
  console.error("❌ ERROR: Speak button not found in the DOM.");
}