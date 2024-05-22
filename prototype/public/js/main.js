// This file contains functions for writing/drawing to the HTML page


/**************************************************************
 * IMPORTS
 **************************************************************/
import { COLOR_MAP } from './data.js';
import Circle from './classes/Circle.js';
import Cluster from './classes/Cluster.js';
import FilterButton from './classes/Button.js';


/**************************************************************
 * CONSTANTS & VARIABLES
 **************************************************************/

// HTML elements
const intro = document.getElementById('intro');
const form = document.getElementById('form');
const introScreen = document.getElementById("introScreen");
const feedback = document.getElementById("inputNum");
const submit = document.getElementById("submit");
const legendElement = document.getElementById("legend");

// Updated once promise returns to ensure p5 setup and canvas drawing receive necessary info before executing
let started = false;

// Intro
const MIN_TWEETS = 500, MAX_TWEETS = 500000;

// Buttons
const BUTTON_POS_X = 75, BUTTON_POS_Y = 350, BUTTON_Y_OFFSET = 50;

// Emotion categories
let emotionGroups = {
    anger: {circles: [], clusters: [], display: true},
    fear: {circles: [], clusters: [], display: true},
    joy: {circles: [], clusters: [], display: true},
    sadness: {circles: [], clusters: [], display: true},
    neutral: {circles: [], clusters: [], display: true} 
};

// Tweets
let totalTweets = 0;
let tweets = {
    anger: [],
    fear: [],
    joy: [],
    sadness: [],
    neutral: []
};

// Clusters
let locations = {};
const LOCATION_PERCENTAGE_MIN = 0.01;

// Canvas drawing
let textDiv;
let displayClusters = false, displayCircles = true;


/**************************************************************
 * FUNCTIONS
 **************************************************************/

// Fade out elements
function fadeOut(elements, delay, hide) {
    elements.forEach(element => {
        setTimeout(() => { 
            element.style.opacity = '0'; 
        }, delay);
    }); 
}

// Fade in elements
function fadeIn(elements, delay) {
    elements.forEach(element => {
        setTimeout(() => { 
            element.style.opacity = '1'; 
        }, delay);
    }); 
}

// Update an element's text content
function updateText(element, delay, newText) {
    setTimeout(() => { 
        element.textContent = newText;
    }, delay);
}

// Set up p5 canvas
function setupCanvas(x, y, parentName, backgroundColor) {
    const myCanvas = createCanvas(x, y);
    myCanvas.parent(parentName);
    background(backgroundColor);
    noStroke(); 
}

// Create child div
function createChildDiv(parentName, text) {
    return createDiv()
        .parent(parentName)
        .html(text);
}

// Get emotion color from color map
function getColor(emotion) {
    const [red, green, blue] = COLOR_MAP[emotion];
    return color(red, green, blue); 
}

// Create legend in format category:total (percentage)
function createLegend(groups) {
    for (const group in groups) {
        // Get # Tweet associated with this emotion
        const emotionTotal = groups[group].length;

        // Calculate emotion percentage, rounded to nearest whole #
        const emotionPercentage = Math.round((emotionTotal / totalTweets) * 100);

        // Create legend entry
        const entry = createDiv()
                      .html(group + ': ' + emotionTotal + ' (' + emotionPercentage + '%)')
                      .style('color', getColor(group));

        // Append to HTML legend element
        entry.parent(legendElement);
    }
}

// Display all emotion content
function resetEmotionFilters() {
    for (const emotion in emotionGroups) {
        emotionGroups[emotion].display = true;
    }
}

// Create canvas buttons
function createButtons(labels) {
    // Filter buttons
    let buttonIndex = 0;
    for (const label in labels) {
        new FilterButton(label, BUTTON_POS_X, BUTTON_POS_Y + BUTTON_Y_OFFSET * buttonIndex++, () => {
            labels[label].display = !labels[label].display
        });
    }

    // Cluster button
    new FilterButton('country cluster', BUTTON_POS_X, BUTTON_POS_Y + BUTTON_Y_OFFSET * buttonIndex++, () => {
        displayCircles = !displayCircles;
        displayClusters = !displayClusters;
    });

    // Reset button
    new FilterButton('reset', BUTTON_POS_X, BUTTON_POS_Y + BUTTON_Y_OFFSET * buttonIndex++, () => {
        displayCircles = true;
        displayClusters = false;
        resetEmotionFilters();
    });
}

// Create a Circle for each Tweet, adding it to circles array
function createCircles() {
    for (const emotion in tweets) {
        tweets[emotion].forEach(tweet => {
            emotionGroups[emotion].circles.push(new Circle(tweet.text, textDiv, tweet.retweets, emotion));
        });
    }
}

// Create a Cluster for each location, adding it to clusters array
function createClusters() {
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
        if (total/totalTweets > LOCATION_PERCENTAGE_MIN) {
            emotionGroups[predominantEmotion].clusters.push(new Cluster(location, total, predominantEmotion));
        }
    }   
}

// Draw objects of a given type
function drawObjects(objects) {
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        object.display();
        object.move();
        // Check if object has an interact method
        if (object.interact) {
            object.interact();
        }
    }
}

// Display emotion groups by drawing appropriate objects to canvas
function displayEmotionGroups() {
    for (const emotion in emotionGroups) {
        const group = emotionGroups[emotion];
        // Display emotion group only if not filtered out
        if (group.display) {
            if (displayCircles) {
                drawObjects(group.circles);  // Draw Tweet circles
            } else if (displayClusters) {
                drawObjects(group.clusters); // Draw location clusters
            }
        }
    }
}

/**************************************************************
 * MAIN EXECUTION
 **************************************************************/

// Fade out intro text page load, then update title text and fade in form
window.onload = () => {
    fadeOut([intro], 6000);
    updateText(intro, 7000, `Please enter the number of Tweets you wish to be featured in the visualization (between ${MIN_TWEETS} and ${MAX_TWEETS}):`);
    fadeIn([intro, form], 7000);
}

 let promise = new Promise(function(resolve, reject) {
    submit.addEventListener("click",() => {
        // Fade out intro text, then fade in loading text
        fadeOut([intro, form], 100);
        updateText(intro, 1100, 'Loading . . .');
        fadeIn([intro], 1100);

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


/**************************************************************
 * P5 SETUP
 **************************************************************/

async function setup() {
    // Await for promise to return
    await promise;

    // Fade out loading screen
    fadeOut([introScreen]);
    introScreen.style.display = 'none';
    started = true;

    // Create p5 canvas
    setupCanvas(700, 700, 'myCanvas', 255);

    // Create divs for Tweet text and sample size
    textDiv = createChildDiv('tweetText', '');
    createChildDiv('sampleInfo', 'Sample size: ' + totalTweets + ' Tweets');

    // Create emotion legend, Tweet circles, location clusters, and buttons
    createLegend(tweets);
    createCircles();
    createClusters();
    createButtons(emotionGroups);
}

/**************************************************************
 * P5 DRAW
 **************************************************************/

function draw() { 
    if (started) {
        background(255);
        translate(width/2,height/2);

        // Display each group (emotion) on canvas
        displayEmotionGroups();
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

