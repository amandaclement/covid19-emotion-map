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

const numTweetsToProcess = 500;

// for conversion of contractions to standard lexicon
// initial list taken from: https://www.geeksforgeeks.org/how-to-create-sentiment-analysis-application-using-node-js/
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

// the next lines are used for language processing (the filtering of the data)
// tutorial followed: https://www.geeksforgeeks.org/how-to-create-sentiment-analysis-application-using-node-js/ with modifications made by me

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

// a list of words that I consider to be more neutral than emotional when used in discussions surrounding COVID-19, 
// so ensure SentimentAnalyzer algorithm gives these words a neutral (0) value 
const neutralWords = [
    "disease", "diseases", "outbreak","outbreaks", "virus", "viruses", "pandemic", "pandemics",
    "sick", "ill", "illness",
    "spread", "spreads", "spreading",
    "infect", "infects", "infected", "infection", "infections", 
    "contamine", "contaminates", "contaminated", "contaminating",
    "loss", "lose", "loses", "lost", // often used in non-emotionl context i.e. "lost my sense of smell"
    "positive", "negative",          // often used in non-emotional context i.e. "i tested positive"
    "death", "deaths", "fatality", "fatalities",  // often used in non-emotional context i.e. "500 new COVID-19 related deaths reported"    
    "question", "questions", "questioning", // SentimentAnalyzer gives these a negative score 
    "alert", "alerts", "alerted", "alerting", // often used in non-emotional context i.e. "Alert: 300 new COVID-19 cases reported in Montreal"   
    "top", "back",  // some random words the SentimentAnalyzer gives a positive or negative score to, that should just be neutral  
    "isolate", "isolated", "isolates", "isolating",
    "new", "news", "right",
    "increase", "increases", "increased", "increasing",
    "decrease", "decreases", "decreased", "decreasing"
];
       
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

// declare Promise to handle asynchronous processing of database info in a more synchronous fashion
var promise = new Promise((resolve, reject) => {
  // get the text field value from each Tweet, store the response in a TweetObjects variable, then map these objects into an array (TweetList)
  TweetsModule.find({}, { text: 1, _id: 0 }).then((response)=>{ 
    const TweetObjects = response;
    const TweetList = TweetObjects.map(
      (tweet) => tweet.text
    );
    // TweetList array is what gets returned by the Promise (if resolved)
    resolve(TweetList);
  })
});

// once Promise has returned (i.e. resolved or rejected), process each Tweet to extract a sentiment
// and store the correspondings sentiment scores in an array (sentiments) to be passed along /custom route via POST request, to be used in main.js
promise.then((value) => {
  console.log("Promise returned");
  let posts = [];
  let sentiments = []; // a new array to hold the sentiment scores

  // iterating over the array of tweets to process each one's text to extract a sentiment from it
  for (let i = 0; i < numTweetsToProcess; i++)
  {
      // populating the posts array with the Tweets' text
      posts[i] = value[i];

      // NLP Logic: convert all data to its standard form
      const lexData = convertToStandard(value[i]);
      
      // convert all data to lowercase
      const lowerCaseData = convertTolowerCase(lexData);
              
      // remove non alphabets and special characters
      const onlyAlpha = removeNonAlpha(lowerCaseData);
      
      // remove stopwords (e.g. "the", "is", "a", "are") using n-stopwords package before tokenizing
      const filteredData = stopwords.cleanText(onlyAlpha);
              
      // tokenize the sentence: break the string up into words (tokens)
      const tokenConstructor = new natural.WordTokenizer();
      let tokenizedData = tokenConstructor.tokenize(filteredData);
      
      // handle negations and neutral words
      // when faced with a negation word, remove it along with its consecutive word which may be another negation word or a different significant words
        // e.g. not sad -> inconclusive since "not sad" doesn't necessarily mean happy or any other particular emotion
        // e.g. not not happy -> happy
        // e.g. never happy, just sad -> sad
        // e.g. not not sad, but not happy -> sad
        // e.g. not happy, not sad -> inconclusive as we can't derive a particular emotion from this text
      // when faced with a neutral word (i.e. positive, outbreak, infect), remove it from the tokenizedData array 
      // so that they don't affect the score assigned by the SentimentAnalyzer algorithm
      for (let j = 0; j < tokenizedData.length; j++)
      {
        // handle negation words
        for (let k = 0; k < negationWords.length; k++)
          if (tokenizedData[j] == negationWords[k])
          {
            tokenizedData.splice(j, 2);
            j = j - 2; // decrement by two as the tokenizedData array elements were shifted by two positions
                       // so we need to recheck the new values in these positions
          }
        // handle neutral words
        for (let k = 0; k < neutralWords.length; k++)
          if (tokenizedData[j] == neutralWords[k])
          {
            tokenizedData.splice(j, 1);
            j--;      // decrement as the tokenizedData array elements were shifted by a position
                      // so we need to recheck the new value in this same position
          }
      }
      // after all this data filtration code, use SentimentAnalyzer from Natural package to generate a sentiment score for the text.
      // the sentiment analysis algorithm from Natural library uses AFINN: a lexicon of English words rated for valence using an integer beteen -5 (negative) and 5 (positive).
      // the algorithm works by summing the polarity of each token (word) and normalizing it using the text's length. If the algorithm returns a negative value it represents 
      // a negative sentiment, if it returns a positive value it represents a positive sentiment and if it returns 0 this represents a neutral sentiment.
      const SentiAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
      const analysis_score = SentiAnalyzer.getSentiment(tokenizedData);

      // store resulting sentiment score in sentiments array
      sentiments[i] = analysis_score;
}

console.log("Populated sentiments array");

  // now that sentiments have been extracted, pass resulting array along /custom route via POST request, to be used in main.js
  app.post("/custom",(request,response)=>{
    response.status(200).json({
      postsArray: posts,
      sentimentsArray: sentiments // sentiments is an array
    })
  });
});

// connecting frontend with our server, this means all our static HTML, CSS and JS files will be served at / route
app.use("/", express.static(__dirname + "/public"));

// create a server (using the Express framework object)
app.use(express.static(__dirname + "/public"));
app.use("/index", clientRoute);

// by default, direct to index.html
function clientRoute(req, res, next) { 
  res.sendFile(__dirname + "/public/index.html");
}

// listen
app.listen(portNumber, host,()=>{
  console.log("Server is running on " + portNumber);
});
