import { COLOR_MAP } from '../data.js';

const FONT = 'Karla'
const ELLIPSE_SIZE = 100;
const COUNTRY_FONT_SIZE = 24, COUNT_FONT_SIZE = 14, COUNT_Y_OFFSET = 20;

// Location cluster
export default class Cluster {
    constructor(countryCode, count, emotion) {
        this.countryCode = countryCode.toUpperCase();
        this.count = count;
        this.emotion = emotion;

        this.setColor();
        this.initializePosition();
        this.initializeMovement();
    }

    // Initialize RGB values
    setColor() {
        [this.red, this.green, this.blue, this.alpha] = COLOR_MAP[this.emotion];
    }

    // Set the cluster's initial position parameters
    initializePosition() {
        this.x = random(-width/2 + 50, width/2 - 50);   // Initial x-coordinate
        this.y = random(-height/2 + 50, height/2 - 50); // Initial y-coordinate
    }

    // Set the cluster's intitial movement parameters
    initializeMovement() {
        this.angle = 3;                             // Initial angle of rotation
        this.angleIncrement = random(0.04, 0.1);    // Random angle increment
        this.scalar = random(10, 20);               // Random scalar value
        this.direction = random([-1, 1]);           // Random direction of rotation (CW or CCW)
        this.defaultSpeed = random(0.004, 0.008);   // Random default speed
        this.speed = this.defaultSpeed;             // Set initial speed
    }

    // Draw the cluster to the screen
    display() {
        // Color and draw the cluster ellipse
        fill(this.red, this.green, this.blue, this.alpha);
        ellipse(this.x, this.y, ELLIPSE_SIZE);

        // Set text properties
        textAlign(CENTER);
        fill(255, 255, 255);
        textFont(FONT);

        // Draw country code text
        textSize(COUNTRY_FONT_SIZE);
        text(this.countryCode, this.x, this.y);

        // Draw Tweet count text
        textSize(COUNT_FONT_SIZE);
        text('Tweets: ' + this.count, this.x, this.y + COUNT_Y_OFFSET);
    }

    // Manage the cluster's position and movement
    move() {
        // Update angle of rotation
        this.angle = this.angle + this.angleIncrement;

        // Update x- and y-coordinates based on angle, speed, and direction
        this.x = this.x + this.scalar * cos(this.angle) * this.speed * this.direction;
        this.y = this.y + this.scalar * sin(this.angle) * this.speed * this.direction;   
    }
}