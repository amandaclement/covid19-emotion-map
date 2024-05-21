import { EMOTION_COLORS } from '../data.js';

// For ellipse sizing
const BASE_SIZE = 4, MAX_SIZE = 20, EXPANSION_SIZE = 12;
const SIZE_COEFFICIENTS = {
    low: 0.01,
    medium: 0.0015,
    high: 0.0002
};

// Thresholds for retweet counts to determine size coefficient
const RETWEET_THRESHOLDS = {
    low: 500,
    medium: 10000,
    high: 100000
};

// Tweet ellipse
export default class Circle {
    constructor(text, textDiv, retweets, emotion) {
        this.text = text;
        this.textDiv = textDiv;
        this.emotion = emotion;

        this.setColor();
        this.setSize(retweets);
        this.initializePosition();
        this.initializeMovement();
    }

    // Initialize RGB values
    setColor() {
        [this.red, this.green, this.blue, this.alpha] = EMOTION_COLORS[this.emotion];
    }

    // Ellipse size is based on # retweets
    setSize(retweets) {
        let sizeCoefficient;

        // Determine size coefficient based on rewteet count
        if (retweets < RETWEET_THRESHOLDS.low) {
            sizeCoefficient = SIZE_COEFFICIENTS.low;
        } else if (retweets < RETWEET_THRESHOLDS.medium) {
            sizeCoefficient = SIZE_COEFFICIENTS.medium;
        } else if (retweets < RETWEET_THRESHOLDS.high) {
            sizeCoefficient = SIZE_COEFFICIENTS.high;
        }
        else {
            this.ellipseSizeDefault = MAX_SIZE;
            sizeCoefficient = 0;
        }

        // Calculate the default size of the ellipse based on the retweet count
        if (sizeCoefficient !== 0) {
            this.ellipseSizeDefault = BASE_SIZE + retweets * sizeCoefficient;
        }

        // Set the current and expanded ellipse size
        this.ellipseSize = this.ellipseSizeDefault;
        this.ellipseSizeExpanded = this.ellipseSizeDefault + EXPANSION_SIZE;
    }

    // Set the ellipse's initial position parameters to randomly position it within larger ring
    initializePosition() {
        this.theta = random(0, TWO_PI);                        // Random angle
        this.h = randomGaussian(3.05);                         // Random Gaussion value
        this.r = (exp(this.h) - 1) / (exp(this.h) + 1);        // Radius
        this.x = (width / 2 - 20) * this.r * cos(this.theta);  // Initial x-coordinate
        this.y = (height / 2 - 20) * this.r * sin(this.theta); // Initial y-coordinate
    }

    // Set the ellipse's initial movement parameters
    initializeMovement() {
        this.angle = 0;                          // Initial angle of rotation
        this.angleIncrement = random(0.01, 0.1); // Random angle increment
        this.scalar = random(0.06, 0.3);         // Randam scalar value
        this.direction = random([-1, 1]);        // Random direction of rotation (CW or CCW)
        this.defaultSpeed = random(0.07, 0.9);   // Random default speed
        this.speed = this.defaultSpeed;          // Set initial speed
    }

    // Manage the ellipse's position and movement
    move() {
        // Update angle of rotation
        this.angle = this.angle + this.angleIncrement;

        // Update x- and y-coordinates based on angle, scalar, speed, and direction
        this.x = this.x + this.scalar * cos(this.angle) * this.speed * this.direction;
        this.y = this.y + this.scalar * sin(this.angle) * this.speed * this.direction;      
    }

    // Draw the ellipse to the screen
    display() {
        fill(this.red, this.green, this.blue, this.alpha);
        ellipse(this.x, this.y, this.ellipseSize);  
    }

    // Manage how the user can interact with the ellipse
    interact() {
        // Distance from the center of the ellipse to the mouse position
        const distance = dist(mouseX - width/2, mouseY - height/2, this.x, this.y);

        // Check if the mouse is over the ellipse
        const isHovered = distance <= this.ellipseSize;

        // If mouse is over the ellipse, expand its size. Else set it to default size
        this.ellipseSize = isHovered ? this.ellipseSizeExpanded : this.ellipseSizeDefault;

        // If the ellipse is hovered + mouse is pressed, stop movement and show the Tweet text. Once mouse is released, reset speed and clear text
        if (isHovered && mouseIsPressed) {
            this.speed = 0;
            this.textDiv.html(this.text);
        } else if (!mouseIsPressed) {
            this.speed = this.defaultSpeed;
            this.textDiv.html('');
        }
    }
}