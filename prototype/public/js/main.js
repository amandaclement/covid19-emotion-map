// this file contains functions for writing/drawing to the HTML page

// counters
let totalCount = 0;
let positiveCount = 0;
let neutralCount = 0;
let negativeCount = 0;
let positiveText = [];
let negativeText = [];
let neutralText = [];
  
// to store results
// const sentiment = document.querySelector(".sentiment");

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
    const posts = response.postsArray;
    const scores = response.sentimentsArray; 
    totalCount = scores.length;

    // iterate over scores array, which holds the sentiment scores, to track how many tweets there are in each
    // category and to populate the appropriate arrays with the Tweet text
    for (let i = 0; i < totalCount; i++)
    {
        // only considering scores greater than 0.13 due to tendency for algorithm to assign low positive scores
        // to Tweets better categorized as neutral
        if (scores[i] > 0.13)
        {
            positiveText[positiveCount] = posts[i];
            positiveCount++;
        }
        else if (scores[i] < 0)
        {
            negativeText[negativeCount] = posts[i];
            negativeCount++;
        }
        else 
        {
            neutralText[neutralCount] = posts[i];
            neutralCount++;
        }
    } 
    })
    .catch(err=>console.error("Error: ", err));


// declare variables
var circlesPositive = [];
var circlesNegative = [];
var circlesNeutral = [];
var legendPositive;
var legendNegative;
var legendNeutral;
var alphaPositive;
var alphaNegative;
var alphaNeutral;
let buttonPositive;
let buttonNegative;
let buttonNeutral;
let buttonReset;
let sampleInfo;
let textDiv;

// Circle function (class) for drawing an ellipse
function Circle(tweetText)
{
    // for positioning ellipses in larger ring
    this.theta = random(0, TWO_PI);                                
    this.h = randomGaussian(3.05); 
    this.r = (exp(this.h) - 1) / (exp(this.h) + 1);          
    this.x = (width/2 - 20) * this.r * cos(this.theta);
    this.y = (height/2 - 20) * this.r * sin(this.theta);

    // for sizing the ellipses (which changes dynamically based on user interactions)
    this.ellipseSizeDefault = random(1.5, 11);
    this.ellipseSizeExpanded = this.ellipseSizeDefault + 12;
    this.ellipseSize = this.ellipseSizeDefault;
    
    // for managing movement of ellipses
    this.angle = 0;
    this.angleIncrement = random(0.01, 0.09);
    this.scalar = random(0.06, 0.3);
    this.direction = random([-1, 1]); // always returns -1 or 1 for determining if ellipse rotates clockwise or counterclock wise
    this.defaultSpeed = random(0.05, 0.5);
    this.speed = this.defaultSpeed;
    this.text = tweetText;

    // manages the ellipse's movements
    this.move = function() 
    {
        this.angle = this.angle + this.angleIncrement;
        this.x = this.x + this.scalar * cos(this.angle) * this.speed * this.direction;
        this.y = this.y + this.scalar * sin(this.angle) * this.speed * this.direction;
    }
    
    // draws the ellipse to the screen
    this.display = function() 
    {
        ellipse(this.x,this.y, this.ellipseSize);  
    }

    // manages how the user can interact with the ellipse
    // if the user hover over it, it expands in size and shrinks back to regular size when they hover off
    // if the user holds their mouse down on it, the ellipse expands in size and freezes, and the Tweet text associated 
    // with that ellips appears in the center of the ring and disappears when they released their mouse
    this.interact = function() 
    {
        if (dist(mouseX - width/2, mouseY - height/2, this.x, this.y) <= this.ellipseSize)
            this.ellipseSize = this.ellipseSizeExpanded;

        else if (dist(mouseX - width/2, mouseY - height/2, this.x, this.y) > this.ellipseSize && !mouseIsPressed)
            this.ellipseSize = this.ellipseSizeDefault;

        if (dist(mouseX - width/2, mouseY - height/2, this.x, this.y) <= this.ellipseSize && mouseIsPressed)
        {
            textDiv.html(tweetText);
            this.speed = 0;
        }

        if (!mouseIsPressed)
        {
            this.speed = this.defaultSpeed;
            textDiv.html('');
        }
    }
}

// set up the canvas
function setup()
{
    // log the # of tweets for each category along with their percentages
    console.log("Total " + totalCount + " tweets");
    console.log("Positive " + positiveCount + " tweets = " + (positiveCount/totalCount)*100 + "%");
    console.log("Negative " + negativeCount + " tweets = " + (negativeCount/totalCount)*100 + "%");
    console.log("Neutral " + neutralCount + " tweets = " + (neutralCount/totalCount)*100 + "%");

    // prepare canvas
    myCanvas = createCanvas(700, 700);
    myCanvas.parent('myCanvas');
    background(255);
    noStroke();

    // create a div for displaying the Tweet text, and make it a child of the tweetText div
    textDiv = createDiv().parent('tweetText');

    // set up the sentiment percentage legend
    legendPositive = createDiv().parent('positive').html("Positive: " + Math.round((positiveCount/totalCount*100) * 100)/100 + "%");
    legendNegative = createDiv().parent('negative').html("Negative: " + Math.round((negativeCount/totalCount*100) * 100)/100 + "%");
    legendNeutral = createDiv().parent('neutral').html("Neutral: " + Math.round((neutralCount/totalCount*100) * 100)/100 + "%");
    
    // set up div to hold sample size
    sampleInfo = createDiv().parent('sampleInfo').html("Sample size: " + totalCount + " Tweets");

    // create three arrays: one for positive sentiment circles, one for negative sentiment circles, and one for neutral sentiment circles
    for (let i = 0; i < positiveCount; i++)
        circlesPositive.push(new Circle(positiveText[i])); // yellow ellipses

    for (let i = 0; i < negativeCount; i++)
        circlesNegative.push(new Circle(negativeText[i])); // blue ellipses
    
    for (let i = 0; i < neutralCount; i++)
        circlesNeutral.push(new Circle(neutralText[i])); // grey ellipses

    // set up alpha for filtering
    alphaPositive = 180;
    alphaNegative = 180;
    alphaNeutral = 180;

    // set up buttons
    buttonPositive = createButton('positive').id('buttonPositive').position(75, 350).mouseOver(buttonPositiveMouseOver).mouseOut(buttonPositiveMouseOut).mousePressed(filterPositive);
    buttonNegative = createButton('negative').id('buttonNegative').position(75, 420).mouseOver(buttonNegativeMouseOver).mouseOut(buttonNegativeMouseOut).mousePressed(filterNegative);
    buttonNeutral = createButton('neutral').id('buttonNeutral').position(75, 490).mouseOver(buttonNeutralMouseOver).mouseOut(buttonNeutralMouseOut).mousePressed(filterNeutral);
    buttonReset = createButton('reset visualization').parent('reset').id('buttonReset').mousePressed(reset);
}

// draw to the canvas
function draw() { 
    background(255);
    translate(width/2,height/2);

    // layering ellipses
    var positiveCounter = 0;
    fill(255, 204, 100, alphaPositive);
    for (let i = 0; i < circlesPositive.length/2; i++) 
    {
        positiveCounter++;
        circlesPositive[i].display();
        circlesPositive[i].move();
        circlesPositive[i].interact();
    }

    var negativeCounter = 0;
    fill(152, 204, 255, alphaNegative);
    for (let i = 0; i < circlesNegative.length/2; i++) 
    {   
        negativeCounter++;
        circlesNegative[i].display();
        circlesNegative[i].move();
        circlesNegative[i].interact();
    }

    fill(192, 192, 192, alphaNeutral);
    for (let i = 0; i < circlesNeutral.length; i++) 
    {
        circlesNeutral[i].display();
        circlesNeutral[i].move();
        circlesNeutral[i].interact();
    }

    fill(152, 204, 255, alphaNegative);
    for (let i = negativeCounter; i < circlesNegative.length; i++) 
    {
        circlesNegative[i].display();
        circlesNegative[i].move();
        circlesNegative[i].interact();
    }

    fill(255, 204, 100, alphaPositive);
    for (let i = positiveCounter; i < circlesPositive.length; i++) 
    {
        circlesPositive[i].display();
        circlesPositive[i].move();
        circlesPositive[i].interact();
    }
}

// manage buttons
function filterPositive()
{
    if (alphaPositive == 180)
        alphaPositive = 0;
    else
        alphaPositive = 180;
}
function filterNegative()
{
    if (alphaNegative == 180)
        alphaNegative = 0;
    else
        alphaNegative = 180;
}
function filterNeutral()
{
    if (alphaNeutral == 180)
        alphaNeutral = 0;
    else
        alphaNeutral = 180;
}
function reset()
{
    alphaPositive = 180;
    alphaNegative = 180;
    alphaNeutral = 180; 
}
function buttonPositiveMouseOver() { buttonPositive.html('filter'); }
function buttonNegativeMouseOver() { buttonNegative.html('filter'); }
function buttonNeutralMouseOver() { buttonNeutral.html('filter'); }
function buttonPositiveMouseOut() { buttonPositive.html('positive'); }
function buttonNegativeMouseOut() { buttonNegative.html('negative'); }
function buttonNeutralMouseOut() { buttonNeutral.html('neutral'); }

function showAbout() {
   var overlay = document.getElementById("overlay");
   overlay.style.display = "block";
}

function hideAbout() {
    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
 }