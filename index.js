const WebSocket = require("ws");
const matrix = require("@matrix-io/matrix-lite");
const https = require("http");
let fs = require('fs');

const ws = new WebSocket("ws://localhost:12101/api/events/intent");
console.log("**Started Web Socket Client**");

ws.on("open", function open() {
  console.log("\n**Connected**\n");
});

ws.on("close", function close() {
  console.log("\n**Disconnected**\n");
});

// Intents are passed through here
ws.on("message", function incoming(data) {
  data = JSON.parse(data);

  console.log("**Captured New Intent**");
  console.log(data);

  if ("SetLed" === data.intent.name) {
    matrix.led.set(data.slots["color"]);
    say("Device changed to: " + data.slots["color"]);
  }

  // the workout code
  if ("Workout" === data.intent.name)
  {
    let secondsArray = [1, 2, 3], workoutsArray = ['1', 'abc']; // initializing the arrays
    let sum = 0; // sum of milliseconds of workouts

    fs.readFile('workout.txt', 'utf8', function(err, data) // reading file
    {
    let arrayOfWorks = data.split(',');
    for(let i = 0; i < arrayOfWorks.length; i++) // main loop
    {
      arrayOfWorks[i] = trim(arrayOfWorks[i]); // trim (down below) removes spaces at the end and beginning of strings
      let seconds = arrayOfWorks[i].substring(arrayOfWorks[i].lastIndexOf(' ') + 1);
      secondsArray[i] = parseInt(seconds);
      workoutsArray[i] = arrayOfWorks[i].substring(0, arrayOfWorks[i].lastIndexOf(' '));
      // all of this code above splits the text in the file into workoutsArray and secondsArray

      setTimeout(function () // main code
      {
        let ledArray = new Array(matrix.led.length); 
        for(let z = 0; z < ledArray.length; z++)
        {
          ledArray[z] = 'red'; // change to whatever color you want
        } // using the matrix led length to be compatible with either product 
        matrix.led.set(ledArray);
        say(workoutsArray[i] + ' for ' + secondsArray[i] + ' seconds'); // tells rhasspy to say the workout
        setTimeout(function () // code for the timer
        {
          let intervalThing = secondsArray[i]/matrix.led.length*1000; // interval in ms between changing lights
          for (let bruh = 0; bruh < matrix.led.length; bruh++) // cycles through each light
          {
            setTimeout(function ()
            {
              ledArray[bruh] = 'black'; // changes one light to be off; change the color if you want
              matrix.led.set(ledArray); //
              console.log(`${workoutsArray[i]}: ${bruh * intervalThing}`);
            }, bruh*intervalThing); // time between changes is based on the interval and light
          }
        }, 3000); // wait 3 seconds between saying the workout and starting the time
      }, sum+3000*i); // sum starts at 0 and then changes between loops while accounting for 3 second delay
      sum+=(secondsArray[i]*1000); // ^
    }

    setTimeout(function () // after everything is done, tell the user they have finished
    {
      say('You have finished your workout.');
    }, sum+(arrayOfWorks.length*3000));
    });
    

  }
});

function trim(variable)
{
    return variable.toString().replace(/^\s+|\s+$/g, '');
}

// Text to speech for string argument
function say(text) {
  const options = {
    hostname: "localhost",
    port: 12101,
    path: "/api/text-to-speech",
    method: "POST"
  };

  const req = https.request(options);

  req.on("error", error => {
    console.error(error);
  });

  req.write(text);
  req.end();
}