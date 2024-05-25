
// This file contains data and functions that perform common tasks to be used across .js files

// Maps categories to RGB values
const COLOR_MAP = {
    'anger': [191, 101, 80, 180],
    'fear': [90, 140, 140, 180],
    'joy': [242, 212, 121, 180],
    'sadness': [148, 200, 214, 180],
    'neutral': [192, 192, 192, 180],
    'country cluster': [54, 69, 79, 180],
    'reset': [0, 0, 0, 180]
};
const introElement = document.getElementById('intro');
const formElement = document.getElementById('form');
const aboutOverlay = document.getElementById('overlay');
const aboutButtons = document.querySelectorAll('.aboutButton');
const MIN_TWEETS = 500, MAX_TWEETS = 500000;

// Get emotion color with alpha from color map
function getColor(emotion) {
    return COLOR_MAP[emotion];
}

// Get emotion color without alpha from color map
function getColorNoAlpha(emotion) {
    const colorWithAlpha = COLOR_MAP[emotion];

    // Extract RGB values (without alpha channel)
    return colorWithAlpha.slice(0, 3);
}

// Fade out elements
function fadeOut(elements, delay) {
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

// Toggle display of an HTML element
function toggleVisibility(element) {
    element.style.display = (element.style.display === "block") ? "none" : "block";
}

// Display intro form
function displayIntroForm() {
    // Fade out intro, update text to prompt user to choose # Tweets to fetch, then fade intro and form in
    fadeOut([introElement], 6000);
    updateText(introElement, 7000, `Please enter the number of Tweets you wish to be featured in the visualization (between ${MIN_TWEETS} and ${MAX_TWEETS}):`);
    fadeIn([introElement, formElement], 7000);
}

// Toggle About page on button click
function toggleAbout(){
    aboutButtons.forEach(button => {
        button.addEventListener('click', () => toggleVisibility(aboutOverlay));
    });    
}

export { fadeOut, fadeIn, updateText, getColor, getColorNoAlpha, displayIntroForm, toggleAbout };