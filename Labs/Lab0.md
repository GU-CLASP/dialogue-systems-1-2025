# Part 1. JavaScript and TypeScript: exercises to get started

These exercises can be done in your browser. If you feel courageous
enough, you can start with Part 2 and get tooling to work and then
return to Part 1 to solve exercises in your text editor.

Try reading all exercises before starting. You can also take a
look at some entries under 'JavaScript Fundamentals' to get the
general idea here: https://javascript.info/ , but definitely check or
skim-read these first:

- https://javascript.info/variables
- https://javascript.info/operators
- https://javascript.info/logical-operators
- https://javascript.info/function-basics
- https://javascript.info/object

Also, feel free to message us on Discord.

*Most exercises were taken from this source, feel free to practice
with more of these if you feel like it:
https://www.w3resource.com/javascript-exercises/javascript-basic-exercises.php*


## Exercise 1: randomize and input/prompt

Write a program that takes a random integer between 1 and 10, and the user is then prompted to input a guess number. The
program displays (`console.log()` or `alert()`) a message `"Good Work"` if the input matches the guess
number otherwise `"Not matched"`.

Resources: 
- `prompt()` and `alert()` https://javascript.info/alert-prompt-confirm
- random https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

Solution in the source:
https://www.w3resource.com/javascript-exercises/javascript-basic-exercise-8.php
    
## Exercise 2: operations and functions

Write a function to check a pair of numbers and return true if one of
the numbers is 50 or if their sum is 50.

(advanced) What happens if one or both of the numbers is provided as string? What
is the possible solution to this?

## Exercise 3: finding string
In an array of names `const names = ["Anna", "Johannes", "Paula",
"Daisy"]` , how would you:
1. find the index for the name "Paula"?
2. check if the name "Paula" is in the list?
3. check if the name exists in the list if you could only search it
as: "PAULA" or "paula"?

Check these: 
- https://javascript.info/string
- https://javascript.info/array

## Exercise 4: strings and length

Write a JavaScript function to create a string from a given
string. This is done by taking the last 3 characters and adding them
at both the front and back. The string length must be 3 or more.  

For example: 
- `addThree(umbrella) // -> llaumbrellalla`
- `addThree(cap) // -> capcapcap`

One solution:
https://www.w3resource.com/javascript-exercises/javascript-basic-exercise-26.php
Maybe also check: https://javascript.info/ifelse

## Exercise 5: looping
Write a program that returns an array of strings (const) consisting of
every name in `names` (from Exercise 3) and their respective length
multiplied by two: `["Anna 8", "Johannes 16" ...]`

Take a careful look at this!: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map

## Exercise 6: objects
Create the following object: 

    let zooAnimals = {
      "giraffe": { "weight": 910, "origin": "Tanzania" },
      "lion": { "weight": 200, "origin": "Tanzania" },
      "elephant": { "weight": 5000, "origin": "India" },
      "penguin": { "weight": 30, "origin": "Argentina" },
      "koala": { "weight": 10, "origin": "Australia" },
    };

- How would you check if an animal exists in the object? 
- How would you check if an animal with a specific weight or a
  specific origin exists in the object?
- How would you add a new animal?
- (advanced) Create an object method named "about" which generates
  text about specified animal, e.g. `zooAnimals.about("giraffe") // ->
  "giraffe weights 910 kg and comes from Tanzania"`. If the animal is
  not in the zoo, return "we don't have this animal".

Tips: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Basics

## Exercise 7: creating types

Take a look at the following links:

This one explains why types are useful in JavaScript: https://www.typescriptlang.org/docs/handbook/2/basic-types.html

And this one some basics on the syntax: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

For this exercise, add types for each of the 6 exercises you have completed. Your file needs to be a TypeScript (.ts) one, instead of a JavaScript one (.js). Submit the TypeScript file.



# Part 2. Getting started with JavaScript tooling
1.  [Download and install NodeJS](https://nodejs.org/en/download/) (LTS version).
2.  [Install Yarn](https://yarnpkg.com/getting-started/install) dependency manager (you might have to use &rsquo;sudo&rsquo; for
    this to work). Run this in your Terminal:
    
        corepack enable

3.  Create [Vite](https://vitejs.dev/) starter project:
    
        yarn create vite
    
    -   specify the arbitrary but meaningful name
    -   select Vanilla framework
    -   select JavaScript variant
    -   follow the further instructions
4.  You will see the link to the development instance,
    i.e. <http://localhost:5173/>. Open it. You should see the &ldquo;Hello
    Vite!&rdquo; webpage.
5.  Study the `.js`, `.css` and `.html` files generated by Vite. Make
    sure you understand what&rsquo;s going on there. Some questions to
    help you understand the files:
    - How are the files connected together? 
    - What method is used in the script files to retrieve and alter the
      HTML element?
      
      
# Part 3. Your first XState program
1. Add XState to your project:
    
        yarn add xstate
     
2. Follow this documentation: https://stately.ai/docs/xstate and
   move the program logic in `counter.js` to a state chart:
   - Information about the counter is stored in the **context** of
     your state chart.
   - **Event** `INC` updates the counter. Clicking on the button should
     emit this event.
   - Log the counter following the example:
     https://stately.ai/docs/xstate#create-a-simple-machine
   - Then, adjust you code so that the page contents are updated
     according to the state. The variable `counter` should be removed
     from the `setupCounter(element)` function.
     
Resources:
1. https://stately.ai/docs/xstate
2. https://stately.ai/docs/actors#actor-snapshots

# Part 4. (optional) HTML exercises

Create an interface in HTML for Exercise 1. Replace `alert()` (or
`console.log()`) and `prompt()` with appropriate HTML elements. You
should have a input box,  a button to submit the input in the
box.

Edit the HTML so that you page looks better: write a title, write a
short message that tells the user how to use your mini program, choose
a background color and put your objects in the center of the page.
Try checking how CSS can help you with this.

Check:
- https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics
- https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics