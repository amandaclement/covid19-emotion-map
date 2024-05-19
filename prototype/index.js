// Import packages
import express from 'express';
import mongoose from 'mongoose';      // For MongoDB interaction
import bodyParser from 'body-parser'; // For parsing incoming request bodies
import dotenv from 'dotenv';          // For environment variable management
import { fileURLToPath } from 'url';  // For converting a file URL to a file path
import { dirname } from 'path';       // For getting the directory name of a file path

// Import the Mongoose Tweet schema
import TweetsModule from './DBSchema.js';

// Load environment variables from .env file
dotenv.config();

// Get the filename and directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Port and host configuration
const portNumber = 4000;
const host = "127.0.0.1";

// Initialize the Express app
const app = express();

// Parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// .env file holds URL to connect to the MongoDB database
const url = process.env.MONGODB_URI;

// Connect to MongoDB database
mongoose.connect(url);
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  // Start the Express server after successful connection
  app.listen(portNumber, host, () => {
    console.log(`Server is running on http://${host}:${portNumber}`);
  });
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

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
    let tweetArray = [];
  
    // Iterate over each tweet to populate the arrays
    tweets.forEach(tweet => {
      // Construct an object representing the tweet data
      const tweetData = {
        text: tweet.tweet,
        emotions: {
          anger: tweet.anger,
          fear: tweet.fear,
          joy: tweet.joy,
          sadness: tweet.sadness
        },
        location: tweet.location,
        retweets: tweet.retweets
      };

      // Push the tweet object to the array
      tweetArray.push(tweetData);
  });

  // Return the array containing all the tweet objects
  return tweetArray;
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
