// This file contains logic for setting up canvas

import Circle from './classes/Circle.js';
import Cluster from './classes/Cluster.js';
import Button from './classes/Button.js';
import { fadeOut, getColorNoAlpha } from './utils.js';
import { totalTweets, tweets, locations } from './processTweets.js';

const legendElement = document.getElementById('legend');
const introScreen = document.getElementById('introScreen');
const BUTTON_POS_X = 75, BUTTON_POS_Y = 350, BUTTON_Y_OFFSET = 50;
const LOCATION_PERCENTAGE_MIN = 0.01;
let textDiv;
let displayCircles = true, displayClusters = false;
let started = false;
let emotionGroups = {
    anger: {circles: [], clusters: [], display: true},
    fear: {circles: [], clusters: [], display: true},
    joy: {circles: [], clusters: [], display: true},
    sadness: {circles: [], clusters: [], display: true},
    neutral: {circles: [], clusters: [], display: true} 
};

// Set up p5 canvas
function prepareCanvas(x, y, parentName, backgroundColor) {
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

// Create legend in format category:total (percentage)
function createLegend() {
    for (const emotion in tweets) {
        // Get # Tweet associated with this emotion
        const emotionTotal = tweets[emotion].length;

        // Calculate emotion percentage, rounded to nearest whole #
        const emotionPercentage = Math.round((emotionTotal / totalTweets) * 100);

        const c = getColorNoAlpha(emotion);

        // Create legend entry and append to HTML legend element
        const entry = createDiv()
                      .html(emotion + ': ' + emotionTotal + ' (' + emotionPercentage + '%)')
                      .style('color', color(c));
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
function createButtons() {
    // Filter buttons
    let buttonIndex = 0;
    for (const group in emotionGroups) {
        new Button(group, BUTTON_POS_X, BUTTON_POS_Y + BUTTON_Y_OFFSET * buttonIndex++, () => {
            emotionGroups[group].display = !emotionGroups[group].display
        });
    }

    // Cluster button
    new Button('country cluster', BUTTON_POS_X, BUTTON_POS_Y + BUTTON_Y_OFFSET * buttonIndex++, () => {
        displayCircles = !displayCircles;
        displayClusters = !displayClusters;
    });

    // Reset button
    new Button('reset', BUTTON_POS_X, BUTTON_POS_Y + BUTTON_Y_OFFSET * buttonIndex++, () => {
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

// Set up p5 canvas
function setupCanvas() {
    // Fade out loading screen
    fadeOut([introScreen]);
    introScreen.style.display = 'none';
    started = true;

    // Create p5 canvas
    prepareCanvas(700, 700, 'myCanvas', 255);

    // Create divs for Tweet text and sample size
    textDiv = createChildDiv('tweetText', '');
    createChildDiv('sampleInfo', 'Sample size: ' + totalTweets + ' Tweets');

    // Create emotion legend, Tweet circles, location clusters, and buttons
    createLegend();
    createCircles();
    createClusters();
    createButtons();
}

export { emotionGroups, displayCircles, displayClusters, started, setupCanvas };

