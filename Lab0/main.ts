import './style.css'
import { setupCounter } from './counter.ts'
import { setGuess } from './guess.ts'

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
setGuess(document.querySelector<HTMLInputElement>("#numGuess")!, 
document.querySelector<HTMLParagraphElement>("#output")!,
document.querySelector<HTMLButtonElement>("#submit")!
)