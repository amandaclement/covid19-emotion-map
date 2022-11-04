// this file contains functions for writing/drawing to the HTML page

// counters
let totalCount = 0;
let positiveCount = 0;
let neutralCount = 0;
let negativeCount = 0;
  
// to store results
const sentiment = document.querySelector(".sentiment");

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
    const scores = response.sentimentsArray; 
    totalCount = scores.length;

    // iterate over scores array, which holds the sentiment scores, and increment counters accordingly so we that we
    // know how many tweets we have for each sentiment category (postive, negative, neutral)
    for (let i = 0; i < totalCount; i++)
    {
        if (scores[i] > 0) {
            positiveCount++;    // increment positiveCount to add a positive-sentiment ellipse
        } else if (scores[i] < 0) {
            negativeCount++;    // increment negativeCount to add a negative-sentiment ellipse
        } else {
            neutralCount++;     // increment neutralCount to add a neutral-sentiment ellipse
            }
        } 
    })
    .catch(err=>console.error("Error: ", err));

// use p5 to draw the ellipses
function setup() {
    // log the # of tweets for each category along with their percentages
    console.log("Total " + totalCount + " tweets");
    console.log("Positive " + positiveCount + " tweets = " + (positiveCount/totalCount)*100 + "%");
    console.log("Positive " + negativeCount + " tweets = " + (negativeCount/totalCount)*100 + "%");
    console.log("Neutral " + neutralCount + " tweets = " + (neutralCount/totalCount)*100 + "%");

    // prepare the canvas
    let myCanvas = createCanvas(windowWidth, windowHeight, WEBGL);
    myCanvas.parent("myCanvas");
    background(255);
    noStroke();

    // canvas margins
    let horizontalMargin = 650;
    let verticalMargin = 420;
    let ellipseSize = 8;

    // drawing the yellow (positive) ellipses
    fill(255, 204, 100); // yellow
    for (let i = 0; i < positiveCount; i++)
    {
        // generate a new random integer for horizontal position
        var randomX = int(random(-windowWidth + horizontalMargin, windowWidth - horizontalMargin));

        // generate a new random integer for vertical position
        var randomY = int(random(-windowHeight + verticalMargin, windowHeight - verticalMargin));

        // generate the ellipse
        ellipse(randomX, randomY, ellipseSize, ellipseSize);
    }

    // drawing the blue (negative) ellipses
    fill(153, 204, 255); // blue
    for (let i = 0; i < negativeCount; i++)
    {
        // generate a new random integer for horizontal position
        var randomX = int(random(-windowWidth + horizontalMargin, windowWidth - horizontalMargin));

        // generate a new random integer for vertical position
        var randomY = int(random(-windowHeight + verticalMargin, windowHeight - verticalMargin));

        // generate the ellipse
        ellipse(randomX, randomY, ellipseSize, ellipseSize);
    }

    // drawing the grey (neutral) ellipses
    fill(192, 192, 192); // light grey
    for (let i = 0; i < neutralCount; i++)
    {
        // generate a new random integer for horizontal position
        var randomX = int(random(-windowWidth + horizontalMargin, windowWidth - horizontalMargin));

        // generate a new random integer for vertical position
        var randomY = int(random(-windowHeight + verticalMargin, windowHeight - verticalMargin));

        // generate the ellipse
        ellipse(randomX, randomY, ellipseSize, ellipseSize);
    }
  }