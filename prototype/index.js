
// import packages 
const express = require('express');
const natural = require("natural");
const stopword = require("stopword");
const mongoose = require("mongoose");

// port and host
const portNumber = 5500;
const host = "127.0.0.1";

// initializing the app
const app = express();

// server
const server = require("http").createServer(app);
require("dotenv").config();

// for conversion of contractions to standard lexicon
// initial list taken from: https://www.geeksforgeeks.org/how-to-create-sentiment-analysis-application-using-node-js/
// add some for abbreviations and word like "ur" "u r"
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
const AirplaneCrashesModule = require("./DBSchema.js");

// connect to database
mongoose.connect(url);
let db = mongoose.connection;

let testVar = 5;

// use async keyword to enable asynchronous, promise-based behavior 
// (a promise being an object representing the eventual completion or failure of an asynchronous operation)
db.once("open", async function() {
  // logs the total number of recorded crashes (so # of entries in dataset)
  AirplaneCrashesModule.count().then((totalCrashes)=>{
    console.log("TOTAL AIRPLANE CRASHES RECORDED BETWEEN 1908-2019:");
    console.log(totalCrashes);
    console.log("\n");
    testVar = totalCrashes; 
  })
})

// needed for handling POST requests
// Express provides the middleware to deal with the (incoming) data (object) in the body of the request
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use("/",express.static(__dirname + "/public"));

// run a test to see if testVar is updated and passed successfully
app.post("/testing",(request,response)=>{
  response.status(200).json({
    myVar: testVar // does this always work? or does testVar sometimes keep value 5 if loading not done sequentially?
  })
});

// the next lines are used for language processing (the filtering of the data)
// tutorial followed: https://www.geeksforgeeks.org/how-to-create-sentiment-analysis-application-using-node-js/ 

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

// a test sentence
const testSentence = "covid restrictions are great";

// NLP Logic: converts all data to its standard form
const lexData = convertToStandard(testSentence);
console.log("Lexed Data: ", lexData);

// convert all data to lowercase
const lowerCaseData = convertTolowerCase(lexData);
console.log("LowerCase Format: ", lowerCaseData);
    
// remove non alphabets and special characters
const onlyAlpha = removeNonAlpha(lowerCaseData);
console.log("OnlyAlpha: ", onlyAlpha);
    
// tokenize the sentence: break the string up into words (tokens)
const tokenConstructor = new natural.WordTokenizer();
const tokenizedData = tokenConstructor.tokenize(onlyAlpha);
console.log("Tokenized Data: ", tokenizedData);
    
// remove stopwords using Stopword npm package
// stopwords are words that are so frequent that they can be safely removed from a text without altering its meaning (e.g. "the", "is", "are", "a")
const filteredData = stopword.removeStopwords(tokenizedData);
console.log("After removing stopwords: ", filteredData);

// After all this data filtration code, we use a Natural package, SentimentAnalyzer, from Natural that creates a sentiment score from the user's review
// The sentiment analysis algorithm from Natural library uses AFINN: a lexicon of English words rated for valence using an integer beteen -5 (negative) and 5 (positive).
// The algorithm works by summing the polarity of each token (word) and normalizing it using the text's length. If the algorithm returns a negative value it represents 
// a negative sentiment, if it returns a positive value it represents a positive sentiment and if it returns 0 this represents a neutral sentiment.
const SentiAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
const analysis_score = SentiAnalyzer.getSentiment(filteredData);
console.log("Sentiment Score: ", analysis_score);

// send this sentiment score as a response, via POST request, along /custom route to be used in main.js
app.post("/custom",(request,response)=>{
  response.status(200).json({
    sentiment_score: analysis_score
  })
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
