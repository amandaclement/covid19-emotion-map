// This file contains logic for drawing to canvas

import { emotionGroups, displayCircles, displayClusters } from './canvasSetup.js';

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
function drawEmotionGroups() {
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

export { drawEmotionGroups };