// This file contains functions for writing/drawing to the HTML page

let angerCount = 0, fearCount = 0, joyCount = 0, sadnessCount = 0, neutralCount = 0, totalCount = 0;
let allTweets = [];

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
    const location = tweets.locations;
    const retweets = tweets.retweets;
    totalCount = texts.length;

    // Populate the appropriate arrays with the Tweet text
    for (let i = 0; i < totalCount; i++) {

        allTweets[i] = [texts[i], angerBools[i], fearBools[i], joyBools[i], sadnessBools[i], location[i], retweets[i]];

        if (angerBools[i])
            angerCount++;
        if (fearBools[i])
            fearCount++;
        if (joyBools[i])
            joyCount++;
        if (sadnessBools[i])
            sadnessCount++;
        if (!angerBools[i] && !fearBools[i] && !joyBools[i] && !sadnessBools[i])
            neutralCount++;
    } 
}).catch(err => console.error("Error: ", err));

// Declare variables
let circlesAnger = [], circlesFear = [], circlesJoy = [], circlesSadness = [], circlesNeutral = [], circlesAll = [];
let legendAnger, legendFear, legendJoy, legendSadness, legendNeutral;
let alphaAnger = 180, alphaFear = 180, alphaJoy = 180, alphaSadness = 180, alphaNeutral = 180;
let buttonAnger, buttonFear, buttonJoy, buttonSadness, buttonNeutral;
let sampleInfo, textDiv;

// Circle function (class) for drawing an ellipse
function Circle(tweetText, tweetAnger, tweetFear, tweetJoy, tweetSadness, tweetLocation, tweetRetweets) {
    // For positioning ellipses in larger ring
    this.theta = random(0, TWO_PI);                                
    this.h = randomGaussian(3.05); 
    this.r = (exp(this.h) - 1) / (exp(this.h) + 1);          
    this.x = (width/2 - 20) * this.r * cos(this.theta);
    this.y = (height/2 - 20) * this.r * sin(this.theta);
    this.ellipseSizeMax = 20;
    
    let potentialColors = [];
    if (tweetAnger)
        potentialColors.push([191, 101, 80]);
    if (tweetFear) 
        potentialColors.push([90, 140, 140]);
    if (tweetJoy)
        potentialColors.push([242, 212, 121]);
    if (tweetSadness)
        potentialColors.push([148, 200, 214]);
    if (potentialColors.length == 0)
        potentialColors.push([192, 192, 192]);

    // Randomly selecting ellipse color based on emotion(s) its associated with
    let colorIndex = random(potentialColors.length);
    colorIndex = floor(colorIndex);

    this.r = potentialColors[colorIndex][0];
    this.g = potentialColors[colorIndex][1];
    this.b = potentialColors[colorIndex][2];

    // Make ellipse size is loosely based on # retweets
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
        // Set appropriate alpha, based on ellipse's final color
        let a;
        if (this.r == 191)      a = alphaAnger;
        else if (this.r == 90)  a = alphaFear;
        else if (this.r == 242) a = alphaJoy;
        else if (this.r == 148) a = alphaSadness;
        else if (this.r == 192) a = alphaNeutral;
        
        fill(this.r, this.g, this.b, a);
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
    console.log("Anger " + angerCount + " tweets");
    console.log("Fear " + fearCount + " tweets");
    console.log("Joy " + joyCount + " tweets");
    console.log("Sadness " + sadnessCount + " tweets");
    console.log("Neutral " + neutralCount + " tweets");

    // Prepare canvas
    myCanvas = createCanvas(700, 700);
    myCanvas.parent('myCanvas');
    background(255);
    noStroke();

    // Create a div for displaying the Tweet text, and make it a child of the tweetText div
    textDiv = createDiv().parent('tweetText');

    // Set up the sentiment percentage legend
    legendAnger = createDiv().parent('anger').html("Anger: " + angerCount + " Tweets");
    legendFear = createDiv().parent('fear').html("Fear: " + fearCount + " Tweets");
    legendJoy = createDiv().parent('joy').html("Joy: " + joyCount + " Tweets");
    legendSadness = createDiv().parent('sadness').html("Sadness: " + sadnessCount + " Tweets");
    legendNeutral = createDiv().parent('neutral').html("Neutral: " + neutralCount + " Tweets");
    
    // Set up div to hold sample size
    sampleInfo = createDiv().parent('sampleInfo').html("Sample size: " + totalCount + " Tweets");

    // Create a Circle for each Tweet and push it into circlesAll array
    for (let i = 0; i < totalCount; i++)
        circlesAll.push(new Circle(allTweets[i][0], allTweets[i][1], allTweets[i][2], allTweets[i][3], allTweets[i][4], allTweets[i][5], allTweets[i][6]));

    // Set up alphas for filtering
    alphaAnger = 180;
    alphaFear = 180;
    alphaJoy = 180;
    alphaSadness = 180;
    alphaNeutral = 180;

    // Set up buttons
    buttonAnger = createButton('anger').id('buttonAnger')
                  .position(75, 350)
                  .mouseOver(function() { 
                    this.html('filter'); 
                  }).mouseOut(function() {
                    this.html('anger');
                  }).mousePressed(function() { 
                    if (alphaAnger == 180) 
                        alphaAnger = 0;
                    else 
                        alphaAnger = 180;
                  });

    buttonFear = createButton('fear')
                 .id('buttonFear')
                 .position(75, 400)
                 .mouseOver(function() { 
                    this.html('filter'); 
                 }).mouseOut(function() {
                    this.html('fear');
                 }).mousePressed(function() { 
                    if (alphaFear == 180) 
                        alphaFear = 0;
                    else 
                        alphaFear = 180;
                 });

    buttonJoy = createButton('joy')
                .id('buttonJoy')
                .position(75, 450)
                .mouseOver(function() { 
                    this.html('filter'); 
                  }).mouseOut(function() {
                    this.html('joy');
                  }).mousePressed(function() { 
                    if (alphaJoy == 180) 
                        alphaJoy = 0;
                    else 
                        alphaJoy = 180;
                  });

    buttonJoy = createButton('sadness')
                .id('buttonSadness')
                .position(75, 500)
                .mouseOver(function() { 
                    this.html('filter'); 
                }).mouseOut(function() {
                    this.html('sadness');
                }).mousePressed(function() { 
                    if (alphaSadness == 180) 
                        alphaSadness = 0;
                    else 
                        alphaSadness = 180;
                });

    buttonNeutral = createButton('neutral')
                    .id('buttonNeutral')
                    .position(75, 550)
                    .mouseOver(function() { 
                        this.html('filter'); 
                    }).mouseOut(function() {
                        this.html('neutral');
                    }).mousePressed(function() { 
                        if (alphaNeutral == 180) 
                            alphaNeutral = 0;
                        else 
                            alphaNeutral = 180;
                    });

    buttonReset = createButton('reset visualization')
                  .parent('reset')
                  .id('buttonReset')
                  .mousePressed(function() {
                    alphaAnger = 180;
                    alphaFear = 180;
                    alphaJoy = 180;
                    alphaSadness = 180;
                    alphaNeutral = 180;
                  });
}

// Draw to the canvas
function draw() { 
    background(255);
    translate(width/2,height/2);

    for (let i = 0; i < circlesAll.length; i++) {
        circlesAll[i].display();
        circlesAll[i].move();
        circlesAll[i].interact();
    }
}

function showAbout() {
   var overlay = document.getElementById("overlay");
   overlay.style.display = "block";
}

function hideAbout() {
    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
 }