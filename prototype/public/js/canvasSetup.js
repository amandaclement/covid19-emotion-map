// This file contains logic for setting up canvas

import Cluster from './classes/Cluster.js';
import Button from './classes/Button.js';
import { fadeOut, getColorNoAlpha } from './utils.js';
import { totalTweets, emotions, locations } from './processTweets.js';

const legendElement = document.getElementById('legend');
const introScreen = document.getElementById('introScreen');
const sampleInfo = document.getElementById('sampleInfo');
const BUTTON_POS_X = 75, BUTTON_POS_Y = 350, BUTTON_Y_OFFSET = 50;
const LOCATION_PERCENTAGE_MIN = 0.01;
let displayCircles = true, displayClusters = false;
let started = false;

// Set up p5 canvas
function prepareCanvas(x, y, parentName, backgroundColor) {
    const myCanvas = createCanvas(x, y);
    myCanvas.parent(parentName);
    background(backgroundColor);
    noStroke(); 
}

// Create legend in format category:total (percentage)
function createLegend() {
    for (const emotion in emotions) {
        // Get # Tweet associated with this emotion
        const emotionTotal = emotions[emotion].circles.length;

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
    for (const emotion in emotions) {
        emotions[emotion].display = true;
    }
}

// Create canvas buttons
function createButtons() {
    // Filter buttons
    let buttonIndex = 0;
    for (const group in emotions) {
        new Button(group, BUTTON_POS_X, BUTTON_POS_Y + BUTTON_Y_OFFSET * buttonIndex++, () => {
            emotions[group].display = !emotions[group].display
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
            emotions[predominantEmotion].clusters.push(new Cluster(location, total, predominantEmotion));
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

    // Populate sample size element
    sampleInfo.innerHTML = 'Sample size: ' + totalTweets + ' Tweets';

    // Create emotion legend, location clusters, and buttons
    createLegend();
    createClusters();
    createButtons();
}

export { displayCircles, displayClusters, started, setupCanvas };

