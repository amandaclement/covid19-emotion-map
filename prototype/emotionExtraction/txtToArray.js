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
  'emotionTxtFiles/trust.txt'          // [4]
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

// Promise.all() method takes an iterable of promises as input and returns a single Promise
Promise.all([angerPromise, fearPromise, joyPromise, sadnessPromise, trustPromise]).then((emotions) => {
  console.log("Read emotion files");

  // Promise responsible for fetching Tweets
  let tweetPromise = new Promise((resolve, reject) => {
    // Get the text field value from each Tweet, store the response in a TweetObjects variable 
    TweetsModule.find({}, { text: 1, _id: 0 }).then((response)=>{ 
      const TweetObjects = response;

      // Map these objects into an array (TweetList)
      const TweetList = TweetObjects.map(
        (tweet) => tweet.text
      );

      // TweetList array is what gets returned by the Promise (if resolved)
      resolve(TweetList);
    })
  });
  
  tweetPromise.then((tweets) => {
    console.log("Read Tweets");

    // An array to hold all arrays (to simplify iteration process)
    let emotionsArray = [];

    // Populate emotionsArray with subarrays, each representing one type of emotion, based on each txt file
    for (let i = 0; i < emotions.length; i++)
      emotionsArray[i] = (emotions[i]).split(/\r?[ \t][0-9][\n]/); // get full words instead of individual letters

    // Stemming the emotion words // creates too many issues/inaccuracies
    // for (let i = 0; i < emotionsArray.length; i++)
    //   for (let j = 0; j < emotionsArray[i].length; j++)
    //     emotionsArray[i][j] = natural.PorterStemmer.stem(emotionsArray[i][j]);

    // Array of arrays, where each subarray will hold: [tweet, angerWord, anticipationWord, disgustWord, fearWord, joyWord, sadnessWord, surpriseWord, trustWord]
    // If all emotion words are blank, it means the tweet is considered neutral
    let tweetData = [];

    // Iterate over text from Tweets
    for (let i = 0; i < 100; i++)
    {
        // If an emotion word (from one of the txt files) is found in the Tweet, that word gets assigned to its appropriate string(s)
        // Only the first word related to a given emotion is retained (e.g. if there are two anger words in a Tweet, we only retain the one that comes first),
        // and is stored in its appropriate position within the subarray: [anger, fear, joy, sadness, trust]
        let emotionWords = ['','','','',''];

        // Process the Tweet text
        const lexData = convertToStandard(tweets[i]);
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
            if (tokenizedData[j] == negationWords[k])
            {
              tokenizedData.splice(j, 2);
              j = j - 2; // Decrement by two as the tokenizedData array elements were shifted by two positions,
                         // so we need to recheck the new values in these positions
            }

        // Iterate over each Tweet's tokenized text to search for emotions (so for matches between Tweet tokens and words in txt files)
        // If a match is found, retain that word to be pushed into the tweetData array in its appropriate position within the subarray
        for (let j = 0; j < tokenizedData.length; j++) {
          for (let n = 0; n < emotionsArray.length; n++)
            for (let k = 0; k < (emotionsArray[n]).length; k++)
                if (tokenizedData[j] == (emotionsArray[n])[k]) {
                  emotionWords[n] = (emotionsArray[n])[k];
                  break;
                }
          
          // Push resulting array into tweetData array
          tweetData[i] = ([tweets[i], emotionWords[0], emotionWords[1], emotionWords[2], emotionWords[3], emotionWords[4]]);
        }
    }

    let neutralCount = 0;

    // Display tweetData array contents
    for (let i = 0; i < 100; i++) {
      if (tweetData[i][0] != '') 
        console.log("TWEET: " + tweetData[i][0]);
      // If no emotion words were found in the Tweet text, just display NEUTRAL
      if (tweetData[i][1] == '' && tweetData[i][2] == '' && tweetData[i][3] == '' && tweetData[i][4] == '' && tweetData[i][5] == '') {
        console.log("NEUTRAL");
        neutralCount++;
      }
      if (tweetData[i][1] != '') 
        console.log("ANGER: " + tweetData[i][1]);
      if (tweetData[i][2] != '') 
        console.log("FEAR: " + tweetData[i][2]);
      if (tweetData[i][3] != '') 
        console.log("JOY: " + tweetData[i][3]);
      if (tweetData[i][4] != '') 
        console.log("SADNESS: " + tweetData[i][4]);
      if (tweetData[i][5] != '') 
        console.log("TRUST: " + tweetData[i][5]);
      
      console.log("\n\n\n");
    }
    console.log("Neutral count is " + neutralCount);
  });
})