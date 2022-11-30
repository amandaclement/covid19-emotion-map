// Import packages 
const express = require('express');
const natural = require("natural");
const stopwords = require("n-stopwords")(['en']); // set stopword language to english
const mongoose = require("mongoose");

// Port and host
const portNumber = 4000;
const host = "127.0.0.1";

// Initialize the app
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
let db = mongoose.connection;

// Prepare promise for reading files
const {readFileSync, promises: fsPromises} = require('fs');

// Array containing paths to the txt files
const files = [
  'emotionTxtFiles/anger.txt',         // [0]
  'emotionTxtFiles/fear.txt',          // [1]
  'emotionTxtFiles/joy.txt',           // [2]
  'emotionTxtFiles/sadness.txt',       // [3]
  'emotionTxtFiles/trust.txt',         // [4]
  'countries.txt'                      // [5]
];

const numTweetsToProcess = 3500;

// Used for language processing, mainly to help handle negations by extracting simple negation words like "not" from words like "aren't"
const dictionary = {
  "aren't": "are not",
  "can't": "cannot",
  "couldn't": "could not",
  "didn't": "did not",
  "doesn't": "does not",
  "don't": "do not",
  "hadn't": "had not",
  "hasn't": "has not",
  "haven't": "have not",
  "he'd": "he would",
  "he'll": "he will",
  "he's": "he is",
  "i'd": "I would",
  "i'd": "I had",
  "i'll": "I will",
  "i'm": "I am",
  "isn't": "is not",
  "it's": "it is",
  "it'll": "it will",
  "i've": "I have",
  "let's": "let us",
  "mightn't": "might not",
  "mustn't": "must not",
  "shan't": "shall not",
  "she'd": "she would",
  "she'll": "she will",
  "she's": "she is",
  "shouldn't": "should not",
  "that's": "that is",
  "there's": "there is",
  "they'd": "they would",
  "they'll": "they will",
  "they're": "they are",
  "they've": "they have",
  "we'd": "we would",
  "we're": "we are",
  "weren't": "were not",
  "we've": "we have",
  "what'll": "what will",
  "what're": "what are",
  "what's": "what is",
  "what've": "what have",
  "where's": "where is",
  "who'd": "who would",
  "who'll": "who will",
  "who're": "who are",
  "who's": "who is",
  "who've": "who have",
  "won't": "will not",
  "wouldn't": "would not",
  "you'd": "you would",
  "you'll": "you will",
  "you're": "you are",
  "you've": "you have",
  "'re": " are",
  "wasn't": "was not",
  "we'll": " will",
  "didn't": "did not"
}

// convertToStandard(): converts all words to standard form (e.g. "you're" to "you are") using the dictionary array
const convertToStandard = text => {
  const data = text.split(' ');
  data.forEach((word, index) => {
      Object.keys(dictionary).forEach(key => {
          if (key === word.toLowerCase()) {
              data[index] = dictionary[key]
          };
      });
  });
  return data.join(' ');
}

// convertToLowerCase(): makes all textual data lowercase (e.g. "FUnnY" and "funny" are equivalent)
const convertTolowerCase = text => {
  return text.toLowerCase();
}

// removeNonAlpha: removes all special characters and numerical tokens as we consider them noise 
// (although they aren't truly just noise, but still need to decide how to handle them)
const removeNonAlpha = text => {
  return text.replace(/[^a-zA-Z\s]+/g, '');   // replaces all non alphabets with empty string
}
     
// Array of common negation words
const negationWords = [
  "not",
  "never",
  "neither", 
  "nor",     
  "barely",
  "hardly",
  "rarely",
  "scarcely",
  "seldom",
  "no longer",
]; 

// Negation words are significant to the meaning of the sentence so remove them as stopwords
for (let i = 0; i < negationWords.length; i++)
    stopwords.remove(negationWords[i]);

// A Promise for each emotion, each responsible for reading its associated txt file
let angerPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[0], 'utf-8');
  resolve(contents);
});
let fearPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[1], 'utf-8');
  resolve(contents);
});
let joyPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[2], 'utf-8');
  resolve(contents);
});
let sadnessPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[3], 'utf-8');
  resolve(contents);
});
let trustPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[4], 'utf-8');
  resolve(contents);
});
let countriesPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[5], 'utf-8');
  resolve(contents);
});

// Promise.all() method takes an iterable of promises as input and returns a single Promise
Promise.all([angerPromise, fearPromise, joyPromise, sadnessPromise, trustPromise, countriesPromise]).then((fileContents) => {
  console.log("Read emotion files");

  // Promise responsible for fetching Tweets
  let tweetPromise = new Promise((resolve, reject) => {
    // Get the text field value from each Tweet, store the response in a TweetObjects variable 
    // TweetsModule.find({}, { text: 1, _id: 0 }).then((response)=>{ 
    TweetsModule.find({}, { date: 4, user_followers: 3, user_location: 2, text: 1, _id: 0 }).then((response)=>{ 
      const TweetObjects = response;

      // Map these objects into arrays
      const TweetText = TweetObjects.map( (tweet) => tweet.text );
      const TweetLocation = TweetObjects.map( (tweet) => tweet.user_location );
      const TweetFollowers = TweetObjects.map( (tweet) => tweet.user_followers );
      const TweetDate = TweetObjects.map( (tweet) => tweet.date );

      const allTweetInfo = [ TweetText, TweetLocation, TweetFollowers, TweetDate ];

      // allTweetInfo array is what gets returned by the Promise (if resolved)
      resolve(allTweetInfo);
    })
  });
  
  tweetPromise.then((tweets) => {
    console.log("Read Tweets");
    let texts = tweets[0];
    let locations = tweets[1];
    let followers = tweets[2];
    let dates = tweets[3];

    // An array to hold all arrays (to simplify iteration process)
    let emotionsArray = [];

    // Populate emotionsArray with subarrays, each representing one type of emotion, based on each txt file
    for (let i = 0; i < fileContents.length - 1; i++)
      emotionsArray[i] = (fileContents[i]).split(/\r?[ \t][0-9][\n]/); // get full words instead of individual letters

    // Last element in fileContents array is the list of countries
    // First split it based on line breaks so that we get elements like: Afghanistan=AF
    let countries = (fileContents[fileContents.length - 1]).split(/\r?\n/);

    // Then, split each element based on =
    // Then, if word on LHS (country name) is found in the Tweet's user location, what actually gets stored in the array is the element on RHS (country code)
    for (let i = 0; i < countries.length; i++)
      countries[i] = (countries[i]).split(/\r?=/);

    // Array of arrays, where each subarray will hold: [tweet, angerWord, anticipationWord, disgustWord, fearWord, joyWord, sadnessWord, surpriseWord, trustWord]
    // If all emotion words are blank, it means the tweet is considered neutral
    let tweetData = [];


    // A variable that contains an array of Tweets (to be populated) for JSON file
    let obj = {
      tweets: []
    };

    // Iterate over text from Tweets
    for (let i = 0; i < 10; i++) {
        // If an emotion word (from one of the txt files) is found in the Tweet, that word gets assigned to its appropriate string(s)
        // Only the first word related to a given emotion is retained (e.g. if there are two anger words in a Tweet, we only retain the one that comes first),
        // and is stored in its appropriate position within the subarray: [anger, fear, joy, sadness, trust]
        let emotionWords = [0, 0, 0, 0, 0];

        // Process the Tweet text
        const lexData = convertToStandard(texts[i]);
        const lowerCaseData = convertTolowerCase(lexData);
        const onlyAlpha = removeNonAlpha(lowerCaseData);
        const filteredData = stopwords.cleanText(onlyAlpha);
        const tokenConstructor = new natural.WordTokenizer();
        let tokenizedData = tokenConstructor.tokenize(filteredData);

        // Retain the current length of the tokenized Tweet text (before stemming)
        let tokenizedDataSize = tokenizedData.length;

        // Add stemmed words to tokenizedData that aren't same as pre-stemmed versions of those same words to avoid unecessary duplicates
        for (let i = 0; i < tokenizedDataSize; i++)
          if (tokenizedData[i] != natural.PorterStemmer.stem(tokenizedData[i]))
            tokenizedData.push(natural.PorterStemmer.stem(tokenizedData[i]));

        // Handle negations: if a negation word is found, remove the tokenized word that comes directly after it
        for (let j = 0; j < tokenizedData.length; j++)
          for (let k = 0; k < negationWords.length; k++)
            if (tokenizedData[j] == negationWords[k]) {
              tokenizedData.splice(j, 2);
              j = j - 2; // Decrement by two as the tokenizedData array elements were shifted by two positions,
                         // so we need to recheck the new values in these positions
            }

        // Iterate over each Tweet's tokenized text to search for emotions (so for matches between Tweet tokens and words in txt files)
        // If a match is found, retain that word to be pushed into the tweetData array in its appropriate position within the subarray
        for (let j = 0; j < tokenizedData.length; j++) 
          for (let n = 0; n < emotionsArray.length; n++)
            for (let k = 0; k < (emotionsArray[n]).length; k++)
                if (tokenizedData[j] == (emotionsArray[n])[k]) {
                  // emotionWords[n] = (emotionsArray[n])[k];
                  emotionWords[n] = 1;
                  break;
                }
        
        // Location string is filled if a country name is recognized within the tweet location text
        let location = '';

        // Only execute the following loop if the location field isn't empty (so undefined)
        if (typeof locations[i] != 'undefined') {
          // Convert tweet location to lowercase
          const lowercaseLocation = convertTolowerCase(locations[i]);

          // Check if tweet location text includes a full country name from countries.txt file
          // If country name is found, assign the country code to the location variable
          for (let k = 0; k < countries.length; k++)
            if ((countries[k][0]).length > 1 && lowercaseLocation.includes(countries[k][0])) {
              console.log(countries[k][0] + " found in " + lowercaseLocation);
              location = countries[k][1]; 
              break;
            }
        } // closing locations loop
              
        // Push resulting array into tweetData array
        tweetData[i] = ([texts[i], emotionWords[0], emotionWords[1], emotionWords[2], emotionWords[3], emotionWords[4], location, followers[i]]);
        obj.tweets.push({tweet: texts[i], anger: emotionWords[0], fear: emotionWords[1], joy: emotionWords[2], sadness: emotionWords[3], trust: emotionWords[4], location: location, followers: followers[i]});
    } // closing tweet processing loop


    let json = JSON.stringify(obj);
    let fs = require('fs');
    fs.writeFileSync('processedTweets.json', json);
    
    // TO APPEND TO FILE:
    // fs.readFile('myjsonfile.json', 'utf8', function readFileCallback(err, data){
    //   if (err){
    //       console.log(err);
    //   } else {
    //   obj = JSON.parse(data); //now it an object
    //   obj.tweets.push({id: 2, square:3}); //add some data
    //   json = JSON.stringify(obj); //convert it back to json
    //   fs.writeFileSync('myjsonfile.json', json); // write it back 
    // }});
  });

})