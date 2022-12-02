// Import packages 
const express = require('express');
const mongoose = require("mongoose");

// Port and host
const portNumber = 5500;
const host = "127.0.0.1";

// Initiale the app
const app = express();

// Server
const server = require("http").createServer(app);
require("dotenv").config();

// Provide middleware for parsing JSON, Text, URL-encoded and raw data sets over an HTTP request body
let bodyParser = require('body-parser');
app.use(bodyParser.json());                         // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// .env file holds URL to connect to database via mongoDB compass
const url = process.env.MONGODB_URI;
const TweetsModule = require("./DBSchema.js");
const { MongoClient } = require('mongodb');

// Connect to database
mongoose.connect(url);
mongoose.connection;

app.post("/custom", (request, response) => {

  // Default size (defaults to this if user inputs an integer beyond the allotted range)
  let sampleSize = 500;

  // If user inputted a valid integer, use that instead
  if (parseInt(request.body.feedback) > 500 && parseInt(request.body.feedback) <= 10000)
    sampleSize = parseInt(request.body.feedback);

// Promise responsible for fetching Tweets
let promise = new Promise((resolve, reject) => {
  TweetsModule.aggregate (
    [ { $sample: { size: sampleSize } } ]
  ).then((response) => { 
  // Fetch the data from each Tweet, store the response in a TweetObjects variable, then map these objects into an array (TweetList)
  // TweetsModule.find({location: 'ca'}, { retweets: 7, location: 6, sadness: 5, joy: 4, fear: 3, anger: 2, tweet: 1, _id: 0 }).then((response) => { 
    const TweetObjects = response;

    // Map these objects into arrays, to then be stored in another array
    const TweetText = TweetObjects.map( (tweets) => tweets.tweet );
    const TweetAnger = TweetObjects.map( (tweets) => tweets.anger );
    const TweetFear = TweetObjects.map( (tweets) => tweets.fear );
    const TweetJoy = TweetObjects.map( (tweets) => tweets.joy );
    const TweetSadness = TweetObjects.map( (tweets) => tweets.sadness );
    const TweetLocation = TweetObjects.map( (tweets) => tweets.location );
    const TweetRetweet = TweetObjects.map( (tweets) => tweets.retweets );
    const allTweetInfo = [ TweetText, TweetAnger, TweetFear, TweetJoy, TweetSadness, TweetLocation, TweetRetweet ];

   // allTweetInfo array is what gets returned by the promise (if resolved)
   resolve(allTweetInfo);
  })
});

// Once promise returns, pass results along /custom route via POST request, to be used in main.js
promise.then((tweets) => {
  console.log("Promise returned");
    response.status(200).json({
      texts: tweets[0],
      angerBools: tweets[1],
      fearBools: tweets[2],
      joyBools: tweets[3],
      sadnessBools: tweets[4],
      locations: tweets[5],
      retweets: tweets[6]
  });
});

}); // close POST request

// Connect frontend with server, so that all the static HTML, CSS and JS files will be served at / route
app.use("/", express.static(__dirname + "/public"));

// Create a server (using the Express framework object)
app.use(express.static(__dirname + "/public"));
app.use("/index", clientRoute);

// By default, direct to index.html
function clientRoute(req, res, next) { 
  res.sendFile(__dirname + "/public/index.html");
}

// Listen
app.listen(portNumber, host,()=>{
  console.log("Server is running on " + portNumber);
});
