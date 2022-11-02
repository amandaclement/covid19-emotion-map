// tutorial followed: https://www.geeksforgeeks.org/how-to-create-sentiment-analysis-application-using-node-js/

// SUMMARY
// Sentiment analysis using Natural: the sentiment analysis algorithm from Natural library uses AFINN which is a 
// lexicon of English words rated for valence with an integer between -5 (negative) and 5 (positive). Calculating
// the sum of the polarity of each word in a piece of text and normalizing it with the length of a sentence is how 
// the algorithm works. If the algorithm returns a negative value, that means the sentiment is negative and if it 
// returns a positive value, that means the sentiment is positive. Zero indicates neutral.

// DATA FILTRATION STEPS
// The /custom route is used as the communication route. The steps/functions involved in the language processing:
// convertToStandard(): converts all words to standard form (e.g. "you're" to "you are")
// convertToLowerCase(): makes all textual data lowercase (e.g. "FUnnY" and "funny" are equivalent)
// removeNonAlpha(): removes all special characters and numerical tokens as we consider them noise
// Then, we tokenize the data and remove stopwords using the stopword npm package
// After all this data filtration code, we use a Natural package, SentimentAnalyzer, from Natural that creates a sentiment score from the user's review
// Lastly, we send this sentiment score based on our analysis as a response to the user

// import packages 
let express = require('express');
const natural = require("natural");
const stopword = require("stopword");

// for conversion of contractions to standard lexicon
// add some for abbreviations and word like "ur" "u r"
const wordDict = {
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

// port and host
const portNumber = 5500;
const host = "127.0.0.1";

// initializing the app
const app = express();

// added 
const server = require("http").createServer(app);
require("dotenv").config();
const mongoose = require("mongoose");

let bodyParser = require('body-parser');
app.use(bodyParser.json());                         // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
// app.use('/varsToMongo', handleGetVars);

const url = process.env.MONGODB_URI;
const AirplaneCrashesModule = require("./DBSchema.js");

// connect to database
mongoose.connect(url);
let db = mongoose.connection;

let testVar = 5;
let something = "happy";

  db.once("open", async function() {
    // logs the total number of recorded crashes (so # of entries in dataset)
    AirplaneCrashesModule.count().then((totalCrashes)=>{
      console.log("TOTAL AIRPLANE CRASHES RECORDED BETWEEN 1908-2019:");
      console.log(totalCrashes);
      console.log("\n");
      testVar = totalCrashes; 
    })
  })

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/",express.static(__dirname + "/public"));

app.post("/testing",(request,response)=>{
  response.status(200).json({
    myVar: testVar, // does this always work? or does testVar sometimes keep value 5 if loading not done sequentially?
    someText: something
})
});

// convertToStandard(): converts all words to standard form (e.g. "you're" to "you are")
const convertToStandard = text => {
    const data = text.split(' ');
    data.forEach((word, index) => {
        Object.keys(wordDict).forEach(key => {
            if (key === word.toLowerCase()) {
                data[index] = wordDict[key]
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
const removeNonAlpha = text => {
    // this Regex means that replace all non alphabets with empty string
    return text.replace(/[^a-zA-Z\s]+/g, '');
}

// default route
app.get("/", function (req, res) {
  res.send("<h1>Default Page</h1>");
});

      const testSentence = "covid restrictions are great";

      // NLP Logic: convert all data to its standard form
      const lexData = convertToStandard(testSentence);
      console.log("Lexed Data: ", lexData);

      // converts all data to lowercase
      const lowerCaseData = convertTolowerCase(lexData);
      console.log("LowerCase Format: ", lowerCaseData);
    
      // removes non alphabets and special characters
      const onlyAlpha = removeNonAlpha(lowerCaseData);
      console.log("OnlyAlpha: ", onlyAlpha);
    
      // tokenization
      const tokenConstructor = new natural.WordTokenizer();
      const tokenizedData = tokenConstructor.tokenize(onlyAlpha);
      console.log("Tokenized Data: ", tokenizedData);
    
      // removes stopwords
      const filteredData = stopword.removeStopwords(tokenizedData);
      console.log("After removing stopwords: ", filteredData);
    
      // stemming
      const Sentianalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
      const analysis_score = Sentianalyzer.getSentiment(filteredData);
      console.log("MYYY Sentiment Score: ", analysis_score);

      // "pass" the result (analysis_score) to main.js via the route /custom
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
