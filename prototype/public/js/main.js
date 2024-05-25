// This file writes/draws to the HTML page

import { displayIntroForm, toggleAbout } from './utils.js';
import { tweetFetchPromise } from './processTweets.js';
import { started, setupCanvas } from './canvasSetup.js';
import { drawEmotionGroups } from './canvasDraw.js';

// Display intro form on load
window.onload = () => {
    displayIntroForm();
}

// Toggle About page on button click
toggleAbout();

// p5 setup
async function setup() {
    // Await for promise to return
    await tweetFetchPromise;
    setupCanvas();
}

// p5 draw
function draw() { 
    if (started) {
        background(255);
        translate(width/2,height/2);
        // Draw each group (emotion) on canvas
        drawEmotionGroups();
    }
}

/*
* p5 functions like setup and draw are searched for by p5 in the global scope but since this is a module, p5 can't see these functions
* so they must be explicitly exposed to the window within the module
*/
window.setup = setup;
window.draw = draw;

