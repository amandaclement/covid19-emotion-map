// import packages 
const express = require('express');
const natural = require("natural");
const stopwords = require("n-stopwords")(['en']); // set stopword language to english
const mongoose = require("mongoose");

// port and host
const portNumber = 4000;
const host = "127.0.0.1";

// initializing the app
const app = express();

// server
const server = require("http").createServer(app);
require("dotenv").config();

const numTweetsToProcess = 3500;

// necessary step? need to test with vs without
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

// provide middleware for parsing JSON, Text, URL-encoded and raw data sets over an HTTP request body
let bodyParser = require('body-parser');
app.use(bodyParser.json());                         // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// .env file holds URL to connect to database via mongoDB compass
const url = process.env.MONGODB_URI;
const TweetsModule = require("./DBSchema.js");
const { MongoClient } = require('mongodb');

// connect to database
mongoose.connect(url);
let db = mongoose.connection;

// prepare promise for reading files
const {readFileSync, promises: fsPromises} = require('fs');

// stores an array for each emotion
let emotionsArray = [];

// array holding the txt files
let files = [
  'emotionTxtFiles/anger.txt',         // [0]
  'emotionTxtFiles/anticipation.txt',  // [1]
  'emotionTxtFiles/disgust.txt',       // [2]
  'emotionTxtFiles/fear.txt',          // [3]
  'emotionTxtFiles/joy.txt',           // [4]
  'emotionTxtFiles/sadness.txt',       // [5]
  'emotionTxtFiles/surprise.txt',      // [6]
  'emotionTxtFiles/trust.txt'          // [7]
];

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

// stem(): stems the textual data
const stem = text => {
  return natural.PorterStemmer.stem(text);  
}

// removeNonAlpha: removes all special characters and numerical tokens as we consider them noise 
// (although they aren't truly just noise, but still need to decide how to handle them)
const removeNonAlpha = text => {
  return text.replace(/[^a-zA-Z\s]+/g, '');   // replaces all non alphabets with empty string
}
     
// array of common negation words
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
  "isn't"
]; 

// negation words are significant to the meaning of the sentence so remove them as stopwords
for (let i = 0; i < negationWords.length; i++)
    stopwords.remove(negationWords[i]);

// A Promise for each emotion, each responsible for reading its associated txt file
let angerPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[0], 'utf-8');
  resolve(contents);
});
let anticipationPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[1], 'utf-8');
  resolve(contents);
});
let disgustPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[2], 'utf-8');
  resolve(contents);
});
let fearPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[3], 'utf-8');
  resolve(contents);
});
let joyPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[4], 'utf-8');
  resolve(contents);
});
let sadnessPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[5], 'utf-8');
  resolve(contents);
});
let surprisePromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[6], 'utf-8');
  resolve(contents);
});
let trustPromise = new Promise((resolve, reject) => {
  const contents = fsPromises.readFile(files[7], 'utf-8');
  resolve(contents);
});

// Promise.all() method takes an iterable of promises as input and returns a single Promise
Promise.all([angerPromise, anticipationPromise, disgustPromise, fearPromise, joyPromise, sadnessPromise, surprisePromise, trustPromise]).then((values) => {
// angerPromise.then((value) => { // value -> emotions
  console.log("Read emotion files");
  // angerArray = value.split(/\r?[ \t][0-9][\n]/); // delimiters are tab, int and new line to get single words
  // console.log(angerArray[0]); // test

  // Promise responsible for fetching Tweets
  let tweetPromise = new Promise((resolve, reject) => {
    // get the text field value from each Tweet, store the response in a TweetObjects variable, 
    // then map these objects into an array (TweetList)
    TweetsModule.find({}, { text: 1, _id: 0 }).then((response)=>{ 
      const TweetObjects = response;
      const TweetList = TweetObjects.map(
        (tweet) => tweet.text
      );
      // TweetList array is what gets returned by the Promise (if resolved)
      resolve(TweetList);
    })
  });
  
  tweetPromise.then((tweets) => { // result -> Tweets
    console.log("Promise 2 returned");

    // an array to hold all arrays (to simplify iteration process)
    let emotionsArray = [];

    // populate emotionsArray with subarrays, each representing one type of emotion, based on each txt file
    for (let i = 0; i < values.length; i++)
      emotionsArray[i] = (values[i]).split(/\r?[ \t][0-9][\n]/); // get full words instead of individual letters

    // stemming the emotion words // creates too many issues/inaccuracies
    // for (let i = 0; i < emotionsArray.length; i++)
    //   for (let j = 0; j < emotionsArray[i].length; j++)
    //     emotionsArray[i][j] = natural.PorterStemmer.stem(emotionsArray[i][j]);

    // array of arrays, where each subarray will hold: [tweet, angerWord, anticipationWord, disgustWord, fearWord, joyWord, sadnessWord, surpriseWord, trustWord]
    // if all emotion words are blank, it means the tweet is considered neutral
    // if one or many emotion words hold strings, that means the tweet is associated with that/those emotions
    let tweetData = [];

    // testing custom sentences instead of Tweets
    // let tests = [
    //   "I'm happy",
    //   "I'm not happy but i'm sad",
    //   "You make me really angry",
    //   "i'm happy"
    // ];

    for (let i = 0; i < 100; i++) // this iterates over numTweets
    {
        // if word is found in the Tweet, that word gets assigned to its appropriate string(s)
        // only the first word related to a given emotion is retained (e.g. if there are two anger words in a Tweet, we only retain the one that comes first)
        // this array is reset each time the loop restarts (so each time we process a new Tweet)
        let emotionWords = [
          '', // will hold tweet's anger word (if there is one)
          '', // will hold tweet's anticipation word (if there is one) 
          '', // will hold tweet's disgust word (if there is one)
          '', // will hold tweet's fear word (if there is one)
          '', // will hold tweet's joy word (if there is one)
          '', // will hold tweet's sadness word (if there is one)
          '', // will hold tweet's surprise word (if there is one)
          ''  // will hold tweet's trust word (if there is one)
        ];

        // process the Tweet text
        // stem the words to increase matches with emotion words?
        // const lexData = convertToStandard(tests[i]);
        const lexData = convertToStandard(tweets[i]);
        const lowerCaseData = convertTolowerCase(lexData);
        const onlyAlpha = removeNonAlpha(lowerCaseData);
        const filteredData = stopwords.cleanText(onlyAlpha);
        const tokenConstructor = new natural.WordTokenizer();
        let tokenizedData = tokenConstructor.tokenize(filteredData);

        console.log("TOKENIZED DATA PRE STEM: " + tokenizedData.length);

        let tokenizedDataSize = tokenizedData.length;

        // only add stemmed words to tokenizedData that aren't same as pre-stemmed version of word
        for (let i = 0; i < tokenizedDataSize; i++)
          if (tokenizedData[i] != natural.PorterStemmer.stem(tokenizedData[i]))
            tokenizedData.push(natural.PorterStemmer.stem(tokenizedData[i]));

            console.log("TOKENIZED DATA POST STEM: " + tokenizedData.length);

        // handle negations
        for (let j = 0; j < tokenizedData.length; j++)
          for (let k = 0; k < negationWords.length; k++)
            if (tokenizedData[j] == negationWords[k])
            {
              tokenizedData.splice(j, 2);
              j = j - 2; // decrement by two as the tokenizedData array elements were shifted by two positions
                         // so we need to recheck the new values in these positions
            }

        // iterate over each Tweet's tokenized text to search for emotions (so for matches between Tweet tokens and words in txt files)
        // if a match is found, retain that word to be pushed into the tweetData array in its appropriate position within the subarray
        for (let j = 0; j < tokenizedData.length; j++) {
          for (let n = 0; n < emotionsArray.length; n++)
            for (let k = 0; k < (emotionsArray[n]).length; k++)
                if (tokenizedData[j] == (emotionsArray[n])[k]) {
                  emotionWords[n] = (emotionsArray[n])[k];
                  break;
                }
          
          // push resulting array into tweetData
          // tweetData[i] = ([tweets[i], emotionWords[0], emotionWords[1], emotionWords[2], emotionWords[3], emotionWords[4], emotionWords[5], emotionWords[6], emotionWords[7]]);
          tweetData[i] = ([tweets[i], emotionWords[0], emotionWords[1], emotionWords[2], emotionWords[3], emotionWords[4], emotionWords[5], emotionWords[6], emotionWords[7]]);
        }
    }

    neutralCount = 0;
    // display tweetData array contents
    for (let i = 0; i < 100; i++) {
      if (tweetData[i][0] != '') 
        console.log("TWEET: " + tweetData[i][0]);
      if (tweetData[i][1] == '' && tweetData[i][4] == '' && tweetData[i][5] == '' && tweetData[i][6] == '' && tweetData[i][8] == '') {
        console.log("NEUTRAL");
          neutralCount++;
      }
      if (tweetData[i][1] != '') 
        console.log("ANGER: " + tweetData[i][1]);
      // if (tweetData[i][2] != '') 
      //   console.log("ANTICIPATION: " + tweetData[i][2]);
      // if (tweetData[i][3] != '') 
      //   console.log("DISGUST: " + tweetData[i][3]);
      if (tweetData[i][4] != '') 
        console.log("FEAR: " + tweetData[i][4]);
      if (tweetData[i][5] != '') 
        console.log("JOY: " + tweetData[i][5]);
      if (tweetData[i][6] != '') 
        console.log("SADNESS: " + tweetData[i][6]);
      // if (tweetData[i][7] != '') 
      //   console.log("SURPRISE: " + tweetData[i][7]);
      if (tweetData[i][8] != '') 
        console.log("TRUST: " + tweetData[i][8]);
      
      console.log("\n\n\n");
    }
    console.log("Neutral count is " + neutralCount);
  });
})