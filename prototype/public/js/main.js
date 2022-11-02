// This file contains functions for writing/drawing to the HTML page.

// sentiment counters
let positiveCount = 0;
let neutralCount = 0;
let negativeCount = 0;
  
// results
const sentiment = document.querySelector(".sentiment");

// submit_button.addEventListener("click",()=>{
        // Send POST request to server
        const options = {
            method : "POST",
            headers : new Headers({
                'Content-Type' : "application/json"
            })
        }

        // use fetch to request server
        fetch("/custom", options)
        .then(res=>res.json())
        .then((response)=>{
            console.log("hi" + response.sentiment_score);
  
            const score = response.sentiment_score;
  
            // separate responses according to sentiment_score
            if (score > 0)
            {
                sentiment.innerHTML = "<p>Positive</p>";
                // increment positiveCount to add a positive-sentiment ellipse
                positiveCount++;

            }
            else if (score === 0)
            {
                sentiment.innerHTML = "<p>Neutral</p>";
                // increment neutralCount to add a neutral-sentiment ellipse
                neutralCount++;
            }

            else {
                sentiment.innerHTML = "<p>Negative</p>";
                // increment negativeCount to add a negative-sentiment ellipse
                negativeCount++;
            }
  
        })
        .catch(err=>console.error("Error: ", err));
// });

// use p5 to draw the ellipses
function setup() {
    // console.log(i);
    let myCanvas = createCanvas(windowWidth, windowHeight, WEBGL);
    myCanvas.parent("myCanvas");
    background(255);
    noStroke();
    fill(255, 204, 100);
    for (let i = 0; i < 50; i++)
    {
        // generate a new random integer from -300 to 300, inclusive for horizontal axis position
        var randomX = int(random(-300, 301));

        // generate a new random integer from -200 to 200, inclusive for vertical axis position
        var randomY = int(random(-200, 201));

        // generate the ellipse
        ellipse(randomX, randomY, 10, 10);
    }
  }