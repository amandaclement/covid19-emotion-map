// Import packages 
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');

// Load environment variables from .env file
require("dotenv").config();

// Port and host configuration
const portNumber = 4000;
const host = "127.0.0.1";

// Initialize the Express app
const app = express();

// Middleware for parsing different types of request bodies
app.use(bodyParser.json());                         // Support JSON encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Support URL-encoded bodies

// .env file holds URL to connect to the MongoDB database
const url = process.env.MONGODB_URI;

// Import the Mongoose Tweet schema
const TweetsModule = require("./DBSchema.js");

// Connect to MongoDB database
mongoose.connect(url);
mongoose.connection;

// Sample size variables
const defaultSampleSize = 500;
const maxSampleSize = 50000;
const minSampleSize = 500;

// Determines sample size
function determineSampleSize(input) {
  // Parse feedback into an integer
  const userSampleSize = parseInt(input);

  // Check if user input is within the allowed range, otherwise use the default size
  return (userSampleSize > minSampleSize && userSampleSize <= maxSampleSize) ? userSampleSize : defaultSampleSize;
}

// Fetches a random sample of tweets
async function fetchTweetSample(sampleSize) {
  return await TweetsModule.aggregate([{ $sample: { size: sampleSize } }]);
}

// Constructs the structured data for response
function constructResponseData(tweets) {
  return {
    texts: tweets.map(tweet => tweet.tweet),
    angerBools: tweets.map(tweet => tweet.anger),
    fearBools: tweets.map(tweet => tweet.fear),
    joyBools: tweets.map(tweet => tweet.joy),
    sadnessBools: tweets.map(tweet => tweet.sadness),
    locations: tweets.map(tweet => tweet.location),
    retweets: tweets.map(tweet => tweet.retweets)
  };
} 

// Handle POST requests to the /custom endpoint
app.post('/custom', async (request, response, next) => {
  try {
    // Determine sample size based on user input
    const sampleSize = determineSampleSize(request.body.feedback);

    // Fetch a random sample of tweets
    const tweets = await fetchTweetSample(sampleSize);

    // Construct structured response data
    const responseData = constructResponseData(tweets);

    // Send the structured data as a JSON response to the client
    response.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
});

// Serve static HTML, CSS, and JS files from the /public directory
app.use(express.static(__dirname + '/public'));

// Default route to serve index.html
app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('An error occurred');
});

// Start the server and listen on the specified port and host
app.listen(portNumber, host, () => {
  console.log(`Server is running on http://${host}:${portNumber}`);
});
