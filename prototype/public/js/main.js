// This file contains functions for writing/drawing to the HTML page

let angerCount = 0;
let fearCount = 0;
let joyCount = 0;
let sadnessCount = 0;
let trustCount = 0;
let neutralCount = 0;
let totalCount = 0;

let angerTweets = [];
let fearTweets = [];
let joyTweets = [];
let sadnessTweets = [];
let trustTweets = [];
let neutralTweets = [];

// Send POST request to server
const options = {
    method : "POST",
    headers : new Headers({
        'Content-Type' : "application/json"
    })
}

// Use fetch to request server
fetch("/custom", options)
.then(res => res.json())
.then((tweets) => {
    const texts = tweets.texts;
    const angerBools = tweets.angerBools;
    const fearBools = tweets.fearBools;
    const joyBools = tweets.joyBools;
    const sadnessBools = tweets.sadnessBools;
    const trustBools = tweets.trustBools;
    const locations = tweets.locations;
    const retweets = tweets.retweets;
    totalCount = texts.length;
    console.log(totalCount);

    // Populate the appropriate arrays with the Tweet text
    for (let i = 0; i < totalCount; i++) {
        if (angerBools[i])
            // angerTweets[angerCount++] = [texts[i], locations[i], retweets[i]];
            angerTweets[angerCount++] = [texts[i], locations[i], retweets[i]];
        if (fearBools[i])
            fearTweets[fearCount++] = [texts[i], locations[i], retweets[i]];
        if (joyBools[i])
            joyTweets[joyCount++] = [texts[i], locations[i], retweets[i]];
        if (sadnessBools[i])
            sadnessTweets[sadnessCount++] = [texts[i], locations[i], retweets[i]];
        if (trustBools[i])
            trustTweets[trustCount++] = [texts[i], locations[i], retweets[i]];
        // If not associated with any emotion, add to neutralTweets array
        if (!angerBools[i] && !fearBools[i] && !joyBools[i] && !sadnessBools[i] && !trustBools[i])
            neutralTweets[neutralCount++] = [texts[i], locations[i], retweets[i]];
    } 
}).catch(err => console.error("Error: ", err));

// Declare variables
let circlesAnger = [], circlesFear = [], circlesJoy = [], circlesSadness = [], circlesTrust = [], circlesNeutral = [];
let legendAnger, legendFear, legendJoy, legendSadness, legendTrust, legendNeutral;
let alphaAnger, alphaFear, alphaJoy, alphaSadness, alphaTrust, alphaNeutral;
let buttonAnger, buttonFear, buttonJoy, buttonSadness, buttonTrust, buttonNeutral;
let sampleInfo, textDiv;

// Circle function (class) for drawing an ellipse
function Circle(tweetText, tweetRetweets) {
    // For positioning ellipses in larger ring
    this.theta = random(0, TWO_PI);                                
    this.h = randomGaussian(3.05); 
    this.r = (exp(this.h) - 1) / (exp(this.h) + 1);          
    this.x = (width/2 - 20) * this.r * cos(this.theta);
    this.y = (height/2 - 20) * this.r * sin(this.theta);
    this.ellipseSizeMax = 20;

    // Make ellipse size loosely based on # retweets
    if (tweetRetweets < 500)
        this.ellipseSizeDefault = 4 + tweetRetweets * 0.01;
    else if (tweetRetweets < 10000)
        this.ellipseSizeDefault = 4 + tweetRetweets * 0.0015;
    else if (tweetRetweets < 100000)
        this.ellipseSizeDefault = 4 + tweetRetweets * 0.0002;
    else 
        this.ellipseSizeDefault = this.ellipseSizeMax;

    // For sizing the ellipses (which changes dynamically based on user interactions)
    this.ellipseSizeExpanded = this.ellipseSizeDefault + 12;
    this.ellipseSize = this.ellipseSizeDefault;
    
    // For managing movement of ellipses
    this.angle = 0;
    this.angleIncrement = random(0.01, 0.1);
    this.scalar = random(0.06, 0.3);
    this.direction = random([-1, 1]); // Always returns -1 or 1 for determining if ellipse rotates clockwise or counterclock wise
    this.defaultSpeed = random(0.07, 0.9);
    this.speed = this.defaultSpeed;
    this.text = tweetText;

    // Manage the ellipse's movements
    this.move = function() {
        this.angle = this.angle + this.angleIncrement;
        this.x = this.x + this.scalar * cos(this.angle) * this.speed * this.direction;
        this.y = this.y + this.scalar * sin(this.angle) * this.speed * this.direction;
    }
    
    // Draws the ellipse to the screen
    this.display = function() {
        ellipse(this.x,this.y, this.ellipseSize);  
    }

    // Manages how the user can interact with the ellipse
    // If the user hovers over it, it expands in size and shrinks back to regular size when they hover off
    // If the user holds their mouse down on it, the ellipse expands in size and freezes, and the Tweet text associated 
    // with that ellipse appears in the center of the ring and disappears when they released their mouse
    this.interact = function() {
        if (dist(mouseX - width/2, mouseY - height/2, this.x, this.y) <= this.ellipseSize)
            this.ellipseSize = this.ellipseSizeExpanded;

        else if (dist(mouseX - width/2, mouseY - height/2, this.x, this.y) > this.ellipseSize && !mouseIsPressed)
            this.ellipseSize = this.ellipseSizeDefault;

        if (dist(mouseX - width/2, mouseY - height/2, this.x, this.y) <= this.ellipseSize && mouseIsPressed) {
            textDiv.html(tweetText);
            this.speed = 0;
        }

        if (!mouseIsPressed) {
            this.speed = this.defaultSpeed;
            textDiv.html('');
        }
    }
}

// Set up the canvas
function setup() {
    // Log the # of tweets for each category along with their percentages
    console.log("Total " + totalCount + " tweets");
    console.log("Anger " + angerCount + " tweets = " + (angerCount/totalCount)*100 + "%");
    console.log("Fear " + fearCount + " tweets = " + (fearCount/totalCount)*100 + "%");
    console.log("Joy " + joyCount + " tweets = " + (joyCount/totalCount)*100 + "%");
    console.log("Sadness " + sadnessCount + " tweets = " + (sadnessCount/totalCount)*100 + "%");
    console.log("Trust " + trustCount + " tweets = " + (trustCount/totalCount)*100 + "%");
    console.log("Neutral " + neutralCount + " tweets = " + (neutralCount/totalCount)*100 + "%");

    // Prepare canvas
    myCanvas = createCanvas(700, 700);
    myCanvas.parent('myCanvas');
    background(255);
    noStroke();

    // Create a div for displaying the Tweet text, and make it a child of the tweetText div
    textDiv = createDiv().parent('tweetText');

    // Set up the sentiment percentage legend
    legendAnger = createDiv().parent('anger').html("Anger: " + Math.round((angerCount/totalCount*100) * 100)/100 + "%");
    legendFear = createDiv().parent('fear').html("Fear: " + Math.round((fearCount/totalCount*100) * 100)/100 + "%");
    legendJoy = createDiv().parent('joy').html("Joy: " + Math.round((joyCount/totalCount*100) * 100)/100 + "%");
    legendSadness = createDiv().parent('sadness').html("Sadness: " + Math.round((sadnessCount/totalCount*100) * 100)/100 + "%");
    legendTrust = createDiv().parent('trust').html("Trust: " + Math.round((trustCount/totalCount*100) * 100)/100 + "%");
    legendNeutral = createDiv().parent('neutral').html("Neutral: " + Math.round((neutralCount/totalCount*100) * 100)/100 + "%");
    
    // Set up div to hold sample size
    sampleInfo = createDiv().parent('sampleInfo').html("Sample size: " + totalCount + " Tweets");

    // Create arrays to hold different emotion-based sets of circles
    for (let i = 0; i < angerCount; i++)
        circlesAnger.push(new Circle(angerTweets[i][0], angerTweets[i][2]));
    for (let i = 0; i < fearCount; i++)
        circlesFear.push(new Circle(fearTweets[i][0], fearTweets[i][2]));
    for (let i = 0; i < joyCount; i++)
        circlesJoy.push(new Circle(joyTweets[i][0], joyTweets[i][2]));
    for (let i = 0; i < sadnessCount; i++)
        circlesSadness.push(new Circle(sadnessTweets[i][0], sadnessTweets[i][2]));
    for (let i = 0; i < trustCount; i++)
        circlesTrust.push(new Circle(trustTweets[i][0], trustTweets[i][2]));
    for (let i = 0; i < neutralCount; i++)
        circlesNeutral.push(new Circle(neutralTweets[i][0], neutralTweets[i][2]));

    // Set up alphas for filtering
    alphaAnger = 180;
    alphaFear = 180;
    alphaJoy = 180;
    alphaSadness = 180;
    alphaTrust = 180;
    alphaNeutral = 180;

    // Set up buttons
    buttonAnger = createButton('anger').id('buttonAnger').position(75, 350).mouseOver(buttonAngerMouseOver).mouseOut(buttonAngerMouseOut).mousePressed(filterAnger);
    buttonFear = createButton('fear').id('buttonFear').position(75, 400).mouseOver(buttonFearMouseOver).mouseOut(buttonFearMouseOut).mousePressed(filterFear);
    buttonJoy = createButton('joy').id('buttonJoy').position(75, 450).mouseOver(buttonJoyMouseOver).mouseOut(buttonJoyMouseOut).mousePressed(filterJoy);
    buttonSadness = createButton('sadness').id('buttonSadness').position(75, 500).mouseOver(buttonSadnessMouseOver).mouseOut(buttonSadnessMouseOut).mousePressed(filterSadness);
    buttonTrust = createButton('trust').id('buttonTrust').position(75, 550).mouseOver(buttonTrustMouseOver).mouseOut(buttonTrustMouseOut).mousePressed(filterTrust);
    buttonNeutral = createButton('neutral').id('buttonNeutral').position(75, 600).mouseOver(buttonNeutralMouseOver).mouseOut(buttonNeutralMouseOut).mousePressed(filterNeutral);
    buttonReset = createButton('reset visualization').parent('reset').id('buttonReset').mousePressed(reset);
}

// Draw to the canvas
function draw() { 
    background(255);
    translate(width/2,height/2);

    // Drawing ellipses
    fill(140, 82, 69, alphaAnger); // Red
    for (let i = 0; i < circlesAnger.length; i++) {
        circlesAnger[i].display();
        circlesAnger[i].move();
        circlesAnger[i].interact();
    }

    fill(191, 101, 80, alphaFear); // Orange
    for (let i = 0; i < circlesFear.length; i++) {
        circlesFear[i].display();
        circlesFear[i].move();
        circlesFear[i].interact();
    }

    fill(242, 212, 121, alphaJoy); // Yellow
    for (let i = 0; i < circlesJoy.length; i++) {
        circlesJoy[i].display();
        circlesJoy[i].move();
        circlesJoy[i].interact();
    }

    fill(148, 200, 214, alphaSadness); // Blue
    for (let i = 0; i < circlesSadness.length; i++) {
        circlesSadness[i].display();
        circlesSadness[i].move();
        circlesSadness[i].interact();
    }

    fill(90, 140, 140, alphaTrust); // Green
    for (let i = 0; i < circlesTrust.length; i++) {
        circlesTrust[i].display();
        circlesTrust[i].move();
        circlesTrust[i].interact();
    }

    fill(192, 192, 192, alphaNeutral); // Grey
    for (let i = 0; i < circlesNeutral.length; i++) {
        circlesNeutral[i].display();
        circlesNeutral[i].move();
        circlesNeutral[i].interact();
    }
}

// Manage filter buttons
function filterAnger() {
    if (alphaAnger == 180)
        alphaAnger = 0;
    else
        alphaAnger = 180;
}
function filterFear() {
    if (alphaFear == 180)
        alphaFear = 0;
    else
        alphaFear = 180;
}
function filterJoy() {
    if (alphaJoy == 180)
        alphaJoy = 0;
    else
        alphaJoy = 180;
}
function filterSadness() {
    if (alphaSadness == 180)
        alphaSadness = 0;
    else
        alphaSadness = 180;
}
function filterTrust() {
    if (alphaTrust == 180)
        alphaTrust = 0;
    else
        alphaTrust = 180;
}
function filterNeutral() {
    if (alphaNeutral == 180)
        alphaNeutral = 0;
    else
        alphaNeutral = 180;
}
function reset() {
    alphaAnger = 180;
    alphaFear = 180;
    alphaJoy = 180;
    alphaSadness = 180;
    alphaTrust = 180;
    alphaNeutral = 180;
}

function buttonAngerMouseOver() { buttonAnger.html('filter'); }
function buttonFearMouseOver() { buttonFear.html('filter'); }
function buttonJoyMouseOver() { buttonJoy.html('filter'); }
function buttonSadnessMouseOver() { buttonSadness.html('filter'); }
function buttonJoyMouseOver() { buttonJoy.html('filter'); }
function buttonTrustMouseOver() { buttonTrust.html('filter'); }
function buttonNeutralMouseOver() { buttonNeutral.html('filter'); }

function buttonAngerMouseOut() { buttonAnger.html('anger'); }
function buttonFearMouseOut() { buttonFear.html('fear'); }
function buttonJoyMouseOut() { buttonJoy.html('joy'); }
function buttonSadnessMouseOut() { buttonSadness.html('sadness'); }
function buttonTrustMouseOut() { buttonTrust.html('trust'); }
function buttonNeutralMouseOut() { buttonNeutral.html('neutral'); }

function showAbout() {
   var overlay = document.getElementById("overlay");
   overlay.style.display = "block";
}

function hideAbout() {
    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
 }