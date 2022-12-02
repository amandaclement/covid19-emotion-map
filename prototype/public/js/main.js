// This file contains functions for writing/drawing to the HTML page

const intro = document.getElementById('intro');
const form = document.getElementById('form');
const introScreen = document.getElementById("introScreen");
const feedback = document.getElementById("inputNum");
const submit = document.getElementById("submit");

// Fade out intro text 6 seconds after page load, then update title text and fade in form
window.onload = function() {
    window.setTimeout(function() {
        intro.style.opacity = '0'; 
    }, 6000);
    window.setTimeout(function() {
        intro.textContent = "Please enter the number of Tweets you wish to be featured in the visualization (between 500 and 50,000):";
        intro.style.opacity = '1'; 
        form.style.opacity = '1';  
    }, 7000);
}

// A boolean that's set to true once the promise returns, to ensure p5 setup and canvas drawing receive necessary info before executing
let started = false;

// Variables to store Tweet results in
let angerCount = 0, fearCount = 0, joyCount = 0, sadnessCount = 0, neutralCount = 0, totalCount = 0;
let allTweets = [], countryClusters = [];

let promise = new Promise(function(resolve, reject) {
    submit.addEventListener("click",() => {
        // Fade out intro screen, and then hide it
        setTimeout(function() { introScreen.style.opacity = '0'; }, 1000);
        introScreen.style.display = 'none'; 

        // Send POST request to server
        const options = {
            method: "POST",
            body: JSON.stringify({
                feedback: feedback.value
            }),
            headers: new Headers({
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
            console.log("totalCount is " + totalCount);

            // Populate the appropriate arrays with the Tweet text
            for (let i = 0; i < totalCount; i++) {

                allTweets[i] = [texts[i], angerBools[i], fearBools[i], joyBools[i], sadnessBools[i], retweets[i], location[i]];
                
                // If Tweet has a location, add the country code to the first dimension of countryClusters array if it isn't already in there
                // Increment second dimension counter accordingly 
                let duplicateFlag = false;
                let count = 0;
                if (location[i].length > 1) {
                        for (let k = 0; k < countryClusters.length; k++)
                            if (location[i] == countryClusters[k][0]) {
                                // Since this country's cluster already exists, assign this cluster number to the Tweet
                                countryClusters[k][1]++;
                                if (angerBools[i]) { 
                                    angerCount++; 
                                    countryClusters[k][2]++; 
                                }
                                if (fearBools[i]) {
                                    fearCount++;
                                    countryClusters[k][3]++;
                                }
                                if (joyBools[i]) {
                                    joyCount++;
                                    countryClusters[k][4]++;
                                }
                                if (sadnessBools[i]) {
                                    sadnessCount++;
                                    countryClusters[k][5]++;
                                }
                                if (!angerBools[i] && !fearBools[i] && !joyBools[i] && !sadnessBools[i]) {
                                    neutralCount++;
                                    countryClusters[k][6]++;
                                }
                                duplicateFlag = true;
                                break;
                            }
                    if (!duplicateFlag) {
                        countryClusters.push([location[i], 1, 0, 0, 0, 0]);
                        countryClusters[countryClusters.length - 1][1]++;
                        if (angerBools[i]) { 
                            angerCount++; 
                            countryClusters[countryClusters.length - 1][2]++; 
                        }
                        if (fearBools[i]) {
                            fearCount++;
                            countryClusters[countryClusters.length - 1][3]++;
                        }
                        if (joyBools[i]) {
                            joyCount++;
                            countryClusters[countryClusters.length - 1][4]++;
                        }
                        if (sadnessBools[i]) {
                            sadnessCount++;
                            countryClusters[countryClusters.length - 1][5]++;
                        }
                        if (!angerBools[i] && !fearBools[i] && !joyBools[i] && !sadnessBools[i]) {
                            neutralCount++;
                            countryClusters[countryClusters.length - 1][6]++;
                        }
                    }
                }
            } 

            setTimeout(resolve, 500); // Delay of 0.5 seconds before resolving promise
        }).catch(err => console.error("Error: ", err));
    }); // Closing event listener
}); // Closing promise

// Declare variables
let circlesAll = [], clustersAll = [];
let legendAnger, legendFear, legendJoy, legendSadness, legendNeutral;
let alphaAnger = 180, alphaFear = 180, alphaJoy = 180, alphaSadness = 180, alphaNeutral = 180;
let buttonAnger, buttonFear, buttonJoy, buttonSadness, buttonNeutral, buttonReset, buttonCluster;
let sampleInfo, textDiv;
let displayClusters = false, displayCircles = true;

// Circle function (class) for drawing an ellipse
function Circle(tweetText, tweetAnger, tweetFear, tweetJoy, tweetSadness, tweetRetweets) {
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

    this.red = potentialColors[colorIndex][0];
    this.green = potentialColors[colorIndex][1];
    this.blue = potentialColors[colorIndex][2];

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
        if (this.red == 191)      a = alphaAnger;
        else if (this.red == 90)  a = alphaFear;
        else if (this.red == 242) a = alphaJoy;
        else if (this.red == 148) a = alphaSadness;
        else if (this.red == 192) a = alphaNeutral;
        
        fill(this.red, this.green, this.blue, a);
        ellipse(this.x, this.y, this.ellipseSize); 
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

// Cluster function (class) for drawing clusters
function Cluster(countryCode, count, emotion) {
    this.countryCode = countryCode.toUpperCase();
    this.percentage = (count/totalCount)*100;
    this.size = 100; // Minimum size (can grow based on Tweet count associated with that country)
    this.x = random(-width/2 + 50, width/2 - 50);
    this.y = random(-height/2 + 50, height/2 - 50);
    this.emotion = emotion;
    this.count = count;
    this.angle = 0;
    this.angleIncrement = random(0.01, 0.05);
    this.scalar = random(10, 20);
    this.direction = random([-1, 1]); // Always returns -1 or 1 for determining if ellipse rotates clockwise or counterclock wise
    this.defaultSpeed = random(0.002, 0.006);
    this.speed = this.defaultSpeed;

    // Draws the cluster to the screen
    this.display = function() { 
        if (this.emotion == 2)              // 2 = anger
            fill(191, 101, 80, 200);
        else if (this.emotion == 3)         // 3 = fear
            fill(90, 140, 140, 200);
        else if (this.emotion == 4)         // 4 = joy
            fill(242, 212, 121, 200);
        else if (this.emotion == 5)         // 5 = sadness
            fill(148, 200, 214, 200);
        else if (this.emotion == 6)         // 6 = neutral
            fill(192, 192, 192, 200);

        ellipse(this.x, this.y, this.size);
        fill(255, 255, 255);
        textAlign(CENTER);
        textFont('Karla');
        textSize(24);
        text(this.countryCode, this.x, this.y);
        fill(255, 255, 255, 180);
        textSize(14);
        text('Tweets: ' + this.count, this.x, this.y + 20);
    }

    // Manage the ellipse's movements
    this.move = function() {
        this.angle = this.angle + this.angleIncrement;
        this.x = this.x + this.scalar * cos(this.angle) * this.speed * this.direction;
        this.y = this.y + this.scalar * sin(this.angle) * this.speed * this.direction;      
    } 
}

// Set up the canvas
async function setup() {
    // Await for promise to return
    await promise;
    started = true;
    
    // Log the # of tweets for each category along with their percentages
    console.log("Total " + totalCount);
    console.log("Anger " + angerCount);
    console.log("Fear " + fearCount);
    console.log("Joy " + joyCount);
    console.log("Sadness " + sadnessCount);
    console.log("Neutral " + neutralCount);

    // Prepare canvas
    myCanvas = createCanvas(700, 700);
    myCanvas.parent('myCanvas');
    background(255);
    noStroke();

    // Create a div for displaying the Tweet text, and make it a child of the tweetText div
    textDiv = createDiv().parent('tweetText');

    // Set up the sentiment percentage legend
    legendAnger = createDiv().parent('anger').html("Anger: " + angerCount);
    legendFear = createDiv().parent('fear').html("Fear: " + fearCount);
    legendJoy = createDiv().parent('joy').html("Joy: " + joyCount);
    legendSadness = createDiv().parent('sadness').html("Sadness: " + sadnessCount);
    legendNeutral = createDiv().parent('neutral').html("Neutral: " + neutralCount);
    
    // Set up div to hold sample size
    sampleInfo = createDiv().parent('sampleInfo').html("Sample size: " + totalCount + " Tweets");

    // Create a Circle for each Tweet and push it into circlesAll array
    for (let i = 0; i < totalCount; i++)
        circlesAll.push(new Circle(allTweets[i][0], allTweets[i][1], allTweets[i][2], allTweets[i][3], allTweets[i][4], allTweets[i][5], allTweets[i][6]));

        // Create a Cluster for each country and push it into clustersAll array
    for (let i = 0; i < countryClusters.length; i++) {
        // Only form cluster if there are over 10 Tweets associated with that country
        if (countryClusters[i][1] > 10) {
            // Find the country's predominant emotion, and pass its associated array position as a parameter to Cluster function
            let predominantEmotion = countryClusters[i][2];
            let emotionPosition = 2;

            for (let k = 3; k < 7; k++)
                if (predominantEmotion > countryClusters[i][k]) {
                    predominantEmotion = countryClusters[i][k];
                    emotionPosition = k;
                }

            clustersAll.push(new Cluster(countryClusters[i][0], countryClusters[i][1], emotionPosition));
        }
    }

    // Manage buttons
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

    buttonCluster = createButton('country cluster')
                    .id('buttonCluster')
                    .position(75, 600)
                    .mouseOver(function() { 
                      this.html('filter'); 
                    }).mouseOut(function() {
                      this.html('country cluster');
                    }).mousePressed(function() {
                      displayCircles = !displayCircles;
                      displayClusters = !displayClusters;
                    });

    buttonReset = createButton('reset visualization')
                  .parent('reset')
                  .id('buttonReset')
                  .mousePressed(function() {
                    displayCircles = true;
                    displayClusters = false;
                    alphaAnger = 180;
                    alphaFear = 180;
                    alphaJoy = 180;
                    alphaSadness = 180;
                    alphaNeutral = 180;
                  });
}

// Draw to the canvas
function draw() { 
    if (started) {
        background(255);
        translate(width/2,height/2);
        if (displayCircles) {
            for (let i = 0; i < circlesAll.length; i++) {
                circlesAll[i].display();
                circlesAll[i].move();
                circlesAll[i].interact();
            }
        }
        if (displayClusters) {
            for (let i = 0; i < clustersAll.length; i++) {
                clustersAll[i].display();
                clustersAll[i].move();
            }
        }
    }
}

function showAbout() {
   let overlay = document.getElementById("overlay");
   overlay.style.display = "block";
}

function hideAbout() {
    let overlay = document.getElementById("overlay");
    overlay.style.display = "none";
}

