// this file contains functions for writing/drawing to the HTML page

// counters
let totalCount = 0;
let positiveCount = 0;
let neutralCount = 0;
let negativeCount = 0;
  
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
    const scores = response.sentimentsArray; 
    totalCount = scores.length;

    // iterate over scores array, which holds the sentiment scores, and increment counters accordingly so we that we
    // know how many tweets we have for each sentiment category (postive, negative, neutral)
    for (let i = 0; i < totalCount; i++)
    {
        if (scores[i] > 0)
            positiveCount++;    // increment positiveCount to add a positive-sentiment ellipse
        else if (scores[i] < 0)
            negativeCount++;    // increment negativeCount to add a negative-sentiment ellipse
        else 
            neutralCount++;     // increment neutralCount to add a neutral-sentiment ellipse
    } 
    })
    .catch(err=>console.error("Error: ", err));

function Circle()
{
    this.theta = random(0, TWO_PI);
    this.h = randomGaussian(3.05);
    this.r = (exp(this.h) - 1) / (exp(this.h) + 1);
    this.originalX = (width/2 - 20) * this.r * cos(this.theta);
    this.originalY = (height/2 - 20) * this.r * sin(this.theta);
    this.x = this.originalX;
    this.y = this.originalY;
    this.ellipseSize = random(1.5, 11);
    this.angle = 0;
    this.angleIncrement = random(0.01, 0.08);
    this.scalar = random(0.06, 0.25);
    this.direction = random([-1, 1]); // always returns -1 or 1
    this.speed = random(0.05, 0.8);
    this.maxX = this.x;
    this.maxY = this.y;

    this.move = function() 
    {
        this.angle = this.angle + this.angleIncrement;
        this.x = this.x + this.scalar * cos(this.angle) * this.speed * this.direction;
        this.y = this.y + this.scalar * sin(this.angle) * this.speed * this.direction;
    }
        
    this.display = function() 
    {
        ellipse(this.x,this.y, this.ellipseSize);
    }
}

var circlesPositive = [];
var circlesNegative = [];
var circlesNeutral = [];
var alphaPositive;
var alphaNegative;
var alphaNeutral;
let buttonPositive;
let buttonNegative;
let buttonNeutral;
let buttonReset;
let sampleInfo;

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

    let legendPositive = createDiv();
    legendPositive.parent('positive');
    legendPositive.html("Positive: " + (positiveCount/totalCount)*100 + "%");

    let legendNegative = createDiv();
    legendNegative.parent('negative');
    legendNegative.html("Negative: " + (negativeCount/totalCount)*100 + "%");

    let legendNeutral = createDiv();
    legendNeutral.parent('neutral');
    legendNeutral.html("Neutral: " + (neutralCount/totalCount)*100 + "%");
    
    sampleInfo = createDiv();
    sampleInfo.parent('sampleInfo');
    sampleInfo.html("Sample size: " + totalCount + " Tweets");

    // create three arrays: one for positive sentiment circles, one for negative sentiment circles, and one for neutral sentiment circles
    for (let i = 0; i < positiveCount; i++)
    circlesPositive.push(new Circle()); // yellow ellipses

    for (let i = 0; i < negativeCount; i++)
    circlesNegative.push(new Circle()); // blue ellipses
    
    for (let i = 0; i < neutralCount; i++)
    circlesNeutral.push(new Circle()); // grey ellipses

    alphaPositive = 180;
    alphaNegative = 180;
    alphaNeutral = 180;

    buttonPositive = createButton('positive');
    buttonPositive.id('buttonPositive');
    buttonPositive.position(200, 300);
    buttonPositive.mouseOver(buttonPositiveMouseOver);
    buttonPositive.mouseOut(buttonPositiveMouseOut);
    buttonPositive.mousePressed(filterPositive);

    buttonNegative = createButton('negative');
    buttonNegative.id('buttonNegative');
    buttonNegative.position(200, 400);
    buttonNegative.mouseOver(buttonNegativeMouseOver);
    buttonNegative.mouseOut(buttonNegativeMouseOut);
    buttonNegative.mousePressed(filterNegative);

    buttonNeutral = createButton('neutral');
    buttonNeutral.id('buttonNeutral');
    buttonNeutral.position(200, 500);
    buttonNeutral.mouseOver(buttonNeutralMouseOver);
    buttonNeutral.mouseOut(buttonNeutralMouseOut);
    buttonNeutral.mousePressed(filterNeutral);

    buttonReset = createButton('reset visualization');
    buttonReset.parent('reset');
    buttonReset.id('buttonReset');
    buttonReset.mousePressed(reset);
}

function draw() { 
    background(255);
    translate(width/2,height/2);

    // layering ellipses
    fill(255, 204, 100, alphaPositive);
    for (let i = 0; i < circlesPositive.length/2; i++) 
    {
        circlesPositive[i].move();
        circlesPositive[i].display();
    }

    fill(152, 204, 255, alphaNegative);
    for (let i = 0; i < circlesNegative.length/2; i++) 
    {
        circlesNegative[i].move();
        circlesNegative[i].display();
    }

    fill(192, 192, 192, alphaNeutral);
    for (let i = 0; i < circlesNeutral.length; i++) 
    {
        circlesNeutral[i].move();
        circlesNeutral[i].display();
    }

    fill(152, 204, 255, alphaNegative);
    for (let i = 0; i < circlesNegative.length/2; i++) 
    {
        circlesNegative[i].move();
        circlesNegative[i].display();
    }

    fill(255, 204, 100, alphaPositive);
    for (let i = 0; i < circlesPositive.length/2; i++) 
    {
        circlesPositive[i].move();
        circlesPositive[i].display();
    }
}

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

function buttonPositiveMouseOver()
{
    buttonPositive.html('filter');
}

function buttonNegativeMouseOver()
{
    buttonNegative.html('filter');
}

function buttonNeutralMouseOver()
{
    buttonNeutral.html('filter');
}

function buttonPositiveMouseOut()
{
    buttonPositive.html('positive');
}

function buttonNegativeMouseOut()
{
    buttonNegative.html('negative');
}

function buttonNeutralMouseOut()
{
    buttonNeutral.html('neutral');
}