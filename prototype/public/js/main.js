// This file contains functions for writing/drawing to the HTML page

import Circle from './classes/Circle.js';

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
let totalTweets = 0;
let tweets = {
    anger: [],
    fear: [],
    joy: [],
    sadness: [],
    neutral: []
};
let countryClusters = [];
let locations = {};
const locationPercentageMin = 0.01;

let promise = new Promise(function(resolve, reject) {
    submit.addEventListener("click",() => {
        // Fade out intro text, then fade in loading text
        setTimeout(function() { 
            intro.style.opacity = '0'; 
            form.style.opacity = '0'
        }, 100);

        setTimeout(function() { 
            intro.textContent = "Loading . . ."; 
            intro.style.opacity = '1'; 
        }, 1100); 

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
        .then(tweetData => {
            totalTweets = tweetData.length;

            // Iterate over Tweets, updating tweets and locations dicts
            for (let i = 0; i < totalTweets; i++) {
                const tweet = tweetData[i];

                // Update tweets (emotions) dict
                let associatedEmotions = [];  // Array to hold emotions associated with the Tweet
                let finalEmotion = "neutral"; // Default is neutral, in case no emotions are associated
                for (const emotion in tweets) {
                    if (tweet.emotions[emotion]) {
                        associatedEmotions.push(emotion);
                        finalEmotion = emotion;
                    }
                }
                // If Tweet is associated with multiple emotions, choose one at random from the array
                if (associatedEmotions.length > 1) {
                    const randomIndex = Math.floor(Math.random() * associatedEmotions.length);
                    finalEmotion = associatedEmotions[randomIndex];
                } 
                // Push tweet to the approriate array within tweets dict
                tweets[finalEmotion].push({ text: tweetData[i].text, retweets: tweetData[i].retweets });

                // If Tweet location is available and isn't yet present in the locations dict, add it
                if (tweet.location !== undefined && tweet.location.length > 0) {
                    if (!(tweet.location in locations)) {
                        locations[tweet.location] = {
                            anger: 0,
                            fear: 0,
                            joy: 0,
                            sadness: 0,
                            neutral: 0
                        };
                    } 
                    // Update the emotion count for the specific location
                    locations[tweet.location][finalEmotion]++;
                }
            } 
            setTimeout(resolve, 500); // Delay of 0.5 seconds before resolving promise
        }).catch(err => console.error("Error: ", err));
    });
});

// Declare variables
let clustersAll = [];
let legendAnger, legendFear, legendJoy, legendSadness, legendNeutral;
let buttonAnger, buttonFear, buttonJoy, buttonSadness, buttonNeutral, buttonReset, buttonCluster;
let sampleInfo, textDiv;
let displayClusters = false, displayCircles = true;

let emotionGroups = {
    anger: {circles: [], display: true},
    fear: {circles: [], display: true},
    joy: {circles: [], display: true},
    sadness: {circles: [], display: true},
    neutral: {circles: [], display: true} 
};
let clusters = [];

// Cluster function (class) for drawing clusters
function Cluster(countryCode, count, emotion) {
    this.countryCode = countryCode.toUpperCase();
    this.percentage = (count/totalTweets)*100;
    this.size = 100; // Minimum size (can grow based on Tweet count associated with that country)
    this.x = random(-width/2 + 50, width/2 - 50);
    this.y = random(-height/2 + 50, height/2 - 50);
    this.emotion = emotion;
    this.count = count;
    this.angle = 3;
    this.angleIncrement = random(0.04, 0.1);
    this.scalar = random(10, 20);
    this.direction = random([-1, 1]); // Always returns -1 or 1 for determining if ellipse rotates clockwise or counterclock wise
    this.defaultSpeed = random(0.004, 0.008);
    this.speed = this.defaultSpeed;
    this.textAlpha;

    this.alpha = 180;

    // Draws the cluster to the screen
    this.display = function() { 
        if (this.emotion == 'anger') {
            fill(191, 101, 80, this.alpha);
            this.textAlpha = this.alpha;
        }
        else if (this.emotion == 'fear') {
            fill(90, 140, 140, this.alpha);
            this.textAlpha = this.alpha;
        }
        else if (this.emotion == 'joy') {
            fill(242, 212, 121, this.alpha);
            this.textAlpha = this.alpha
        }
        else if (this.emotion == 'sadness') {
            fill(148, 200, 214, this.alpha);
            this.textAlpha = this.alpha;
        }
        else if (this.emotion == 'neutral') {   
            fill(192, 192, 192, this.alpha);
            this.textAlpha = this.alpha;
        }

        ellipse(this.x, this.y, this.size);
        textAlign(CENTER);
        fill(255, 255, 255, this.textAlpha);
        textFont('Karla');
        textSize(24);
        text(this.countryCode, this.x, this.y);
        fill(255, 255, 255, this.textAlpha);
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

    // Fade out loading screen
    setTimeout(function() { introScreen.style.opacity = '0'; }, 1000);
    introScreen.style.display = 'none';
    started = true;
    
    // Log the # of tweets for each category along with their percentages
    for (const emotion in tweets) {
        console.log(tweets[emotion].length);
    }
    console.log("Total " + totalTweets);

    // Prepare canvas
    const myCanvas = createCanvas(700, 700);
    myCanvas.parent('myCanvas');
    background(255);
    noStroke();

    // Create a div for displaying the Tweet text, and make it a child of the tweetText div
    textDiv = createDiv().parent('tweetText');

    // Set up the emotion percentage legend
    legendAnger = createDiv().parent('anger').html("Anger: " + tweets.anger.length);
    legendFear = createDiv().parent('fear').html("Fear: " + tweets.fear.length);
    legendJoy = createDiv().parent('joy').html("Joy: " + tweets.joy.length);
    legendSadness = createDiv().parent('sadness').html("Sadness: " + tweets.sadness.length);
    legendNeutral = createDiv().parent('neutral').html("Neutral: " + tweets.neutral.length);
    
    // Set up div to hold sample size
    sampleInfo = createDiv().parent('sampleInfo').html("Sample size: " + totalTweets + " Tweets");

    // Create a Circle for each Tweet, adding it to circles array
    for (const emotion in tweets) {
        tweets[emotion].forEach(tweet => {
            emotionGroups[emotion].circles.push(new Circle(tweet.text, textDiv, tweet.retweets, emotion));
        });
    }

    // Create a Cluster for each location, adding it to clusters array
    for (const location in locations) {
        const emotionCounts = locations[location];
        let predominantEmotion, predominantEmotionCount = 0;
        let total = 0;

        // Find the predominant emotion and total Tweet count associated with this location
        for (const emotion in emotionCounts) {
            const count = emotionCounts[emotion];
            total += count;

            if (predominantEmotionCount < count) {
                predominantEmotionCount = count;
                predominantEmotion = emotion;
            }
        }

        // Add current location to clusters array only if its total count meets the minimum threshold
        if (total/totalTweets > locationPercentageMin) {
            console.log("location is " + location);
            clusters.push(new Cluster(location, total, predominantEmotion));
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
                    emotionGroups.anger.display = !emotionGroups.anger.display;
                  });

    buttonFear = createButton('fear')
                 .id('buttonFear')
                 .position(75, 400)
                 .mouseOver(function() { 
                    this.html('filter'); 
                 }).mouseOut(function() {
                    this.html('fear');
                 }).mousePressed(function() { 
                    emotionGroups.fear.display = !emotionGroups.fear.display;
                 });

    buttonJoy = createButton('joy')
                .id('buttonJoy')
                .position(75, 450)
                .mouseOver(function() { 
                    this.html('filter'); 
                  }).mouseOut(function() {
                    this.html('joy');
                  }).mousePressed(function() { 
                    emotionGroups.joy.display = !emotionGroups.joy.display;
                  });

    buttonJoy = createButton('sadness')
                .id('buttonSadness')
                .position(75, 500)
                .mouseOver(function() { 
                    this.html('filter'); 
                }).mouseOut(function() {
                    this.html('sadness');
                }).mousePressed(function() { 
                    emotionGroups.sadness.display = !emotionGroups.sadness.display;
                });

    buttonNeutral = createButton('neutral')
                    .id('buttonNeutral')
                    .position(75, 550)
                    .mouseOver(function() { 
                        this.html('filter'); 
                    }).mouseOut(function() {
                        this.html('neutral');
                    }).mousePressed(function() { 
                        emotionGroups.neutral.display = !emotionGroups.neutral.display;
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
                    emotionGroups.anger.display = true;
                    emotionGroups.fear.display = true;
                    emotionGroups.joy.display = true;
                    emotionGroups.sadness.display = true;
                    emotionGroups.neutral.display = true;
                  });
}

// Draw to the canvas
function draw() { 
    if (started) {
        background(255);
        translate(width/2,height/2);

        if (displayCircles) {
            // Display each group (emotion) of circles on canvas
            for (const emotion in emotionGroups) {
                const group = emotionGroups[emotion];
                // Display only if not filtered out
                if (group.display) {
                    for (let i = 0; i < group.circles.length; i++) {
                        const circle = group.circles[i];
                        circle.display();
                        circle.move();
                        circle.interact();
                    }
                }
            }
        }
        if (displayClusters) {
            // Display location clusters on canvas
            for (let i = 0; i < clusters.length; i++) {
                clusters[i].display();
                clusters[i].move();
            }
        }
    }
}

// Manage opening/closing of About page
function showAbout() {
   let overlay = document.getElementById("overlay");
   overlay.style.display = "block";
}

function hideAbout() {
    let overlay = document.getElementById("overlay");
    overlay.style.display = "none";
}

// p5 functions like setup and draw are searched for by p5 in the global scope, but since this is a module, p5 can't see these functions so they must be explicitly exposed to the window within the module
window.setup = setup;
window.draw = draw;

