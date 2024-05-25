// This file contains logic for fetching/processing Tweets

import { fadeOut, fadeIn, updateText } from './utils.js';

const feedback = document.getElementById('inputNum');
const submit = document.getElementById('submit');
let totalTweets = 0;
let tweets = {
    anger: [],
    fear: [],
    joy: [],
    sadness: [],
    neutral: []
};
let locations = {};

// Process individual Tweet
function processTweet(tweet) {
    // Get emotions associated with the Tweet
    const emotionKeys = Object.keys(tweet.emotions);
    const associatedEmotions = emotionKeys.filter(emotion => tweet.emotions[emotion]);

    // Generate a random index within range of associated emotions and use it to randomly select an emotion for this Tweet. Default to "neutral" if no emotions are associated
    const randomIndex = Math.floor(Math.random() * associatedEmotions.length);
    const finalEmotion = associatedEmotions.length > 0 ? associatedEmotions[randomIndex] : "neutral";

    // Update tweets dict by pushing entry into appropriate emotion array
    tweets[finalEmotion].push({ text: tweet.text, retweets: tweet.retweets });
    
    // If Tweet location is available and key isn't already in locations dict, add it
    if (tweet.location) {
        if (!locations[tweet.location]) {
            locations[tweet.location] = { anger: 0, fear: 0, joy: 0, sadness: 0, neutral: 0 };
        }
        // Update the emotion count for the specific location 
        locations[tweet.location][finalEmotion]++;
    }
}

// Handle response from server
function handleResponse(response, resolve) {
    if (!response.ok) {
        throw new Error("Network response error");
    }

    // Parse JSON response into an object
    return response.json()
        // Once parsing complete, process each Tweet and resolve promise after delay
        .then(tweetData => {
            totalTweets = tweetData.length;
            tweetData.forEach(tweet => processTweet(tweet));
            setTimeout(resolve, 500);
        });
}

// Log error to console
function handleError(error) {
    console.error("Error: ", error);
}

// Configure POST request options
function configurePostOptions() {
    return {
        method: "POST",
        body: JSON.stringify({
            feedback: feedback.value
        }),
        headers: new Headers({
            'Content-Type': "application/json"
        })
    };
}

// Fetch Tweet data
function fetchTweetData(options, resolve) {
    fetch("/custom", options)
    .then(response => handleResponse(response, resolve))
    .catch(error => handleError(error));   
}

// Send POST request
function sendPostRequest(resolve) {
    const options = configurePostOptions();
    fetchTweetData(options, resolve);
}

// Display loading screen
function displayLoading() {
    // Fade out intro and form, update text to loading, then fade intro back in
    fadeOut([intro, form], 100);
    updateText(intro, 1100, 'Loading . . .');
    fadeIn([intro], 1100);
}

// Promise for fetching Tweet data via POST request
let tweetFetchPromise = new Promise(resolve => {
    submit.addEventListener("click",() => {
        // Display loading screen
        displayLoading();

        // Sent POST request to server
        sendPostRequest(resolve);
    });
});

export { totalTweets, tweets, locations, tweetFetchPromise };