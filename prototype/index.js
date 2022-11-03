// import packages 
const express = require('express');
const natural = require("natural");
const stopwords = require("n-stopwords")(['en']); // set stopword language to english
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

// let testVar = 5;

// // use async keyword to enable asynchronous, promise-based behavior 
// // (a promise being an object representing the eventual completion or failure of an asynchronous operation)
// db.once("open", async function() {
//   // logs the total number of recorded crashes (so # of entries in dataset)
//   AirplaneCrashesModule.count().then((totalCrashes)=>{
//     console.log("TOTAL AIRPLANE CRASHES RECORDED BETWEEN 1908-2019:");
//     console.log(totalCrashes);
//     console.log("\n");
//     testVar = totalCrashes; 
//   })
// })

// needed for handling POST requests
// Express provides the middleware to deal with the (incoming) data (object) in the body of the request
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use("/",express.static(__dirname + "/public"));

// run a test to see if testVar is updated and passed successfully
// app.post("/testing",(request,response)=>{
//   response.status(200).json({
//     myVar: testVar // does this always work? or does testVar sometimes keep value 5 if loading not done sequentially?
//   })
// });

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

let testSentences = [
    "Crazy that the world has come to this but as Americans we will fight to get through this!",            // want +, got -1
    "Together as One! #Covid19 #EconomicRecovery",                                                          // want +, got ~
    "Hospital cleaners, porters &amp; catering staff are unsung #COVID19 heroes.",                          // want +, got +0.2     
    "We Shall Over Come! With victory in our minds in our #FightAgainstCorona",                             // want +, got +1
    "It will be awesome ‼️ @rihanna please try and consider a collaboration with @TiwaSavage .",             // want +, got +1
    "The savior of humanity will come",                                                                     // want +, got +1
    "Man, you get better. At least your sense of humor, is all good.",                                      // want +, got +1.25
    "I love You !!!",                                                                                       // want +, got +2
    "My new #facemask from @chicagotheband makes me smile! Mask up, friends! Stay safe and well.",          // want +, got +0.5
    "So good to be sitting out, enjoying one of our pre #COVID19 haunts @chief_coffee",                     // want +, got +0.6
    "The community is the best part of a country. I love my country. Covid 19 helping team. Love you all",  // want +, got +0.7
    "Good day Beautiful People, this to wish you all a refreshing weekend.",                                // want +, got +1
    "Yesterday I had the pleasure of shooting Corinne and Pedro’s wedding at Hendon Town Hall",             // want +, got +0.2
    "Appreciation for being the front liner in COVID ICU SHL.",                                             // want +, got +0.3
    "So excited about this Book! Number one seller on Education &amp; Covid right now on Amazon!",          // want +, got +0.375   

    "So he can spread lies, hate, sexual violence, and murder?",                                            // want -, got -1.7
    "The anxiety surrounding COVID-19 has caused Bipolar and Chron’s Disease to flare up quite badly",      // want -, got -0.7
    "It so brilliant to see people awake and not accepting the #COVID19 mainstream narrative.",             // want -, got +0.7
    "This government was too slow to act, and even they now admit that. They followed and did not lead!",   // want -, got -0.25
    "If you think I’m buying any of these rumours of us being locked down or restricted for up to 2 years", // want -, got -0.3
    "Oh for fvck’s sake @CNN @sarahcwestwood STOP WITH THE BS.",                                            // want -, got -0.17
    "Yes Green it is your fault. Next time put your foot down and say heck no!",                            // want -, got ~
    "#America has a problem and IT IS NOT #COVID19 Shocked? #MarxistBLM brought America to its knees!",     // want -, got -0.6
    "I'm not even worried about myself- if I have it I've exposed my elderly grandmother",                  // want -, got -0.3
    "This is exactly what I was afraid would happen.",                                                      // want -, got -1
    "I’m done with you. Just more lies and propaganda",                                                     // want -, got -1.3
    "The mental health of our community is of concern with #COVID19.",                                      // want -, got -0.4
    "Seriously...Holy sh!t America, I want off this ride. It's not fun anymore. This is toxic.",            // want -, got -0.5
    "@realDonaldTrump This is who should be banned. He is a menace to the American Society.",               // want -, got -0.8
    "Not being able to be there for a loved one during one of the worst times of their life HURTS",         // want -, got -1.25
    "This is heartbreaking. Kuching FA football player Joseph Kalang Tie had to be quarantined at home",    // want -, got -0.3
    "To the lady on the train applying her makeup and not wearing a mask.... Shame on you",                 // want -, got -0.3
    "STOP This Nonsense!!!",                                                                                // want -, got -1.5
    "This is truly frightening. Playing such outrageous conspiracy theories on TV",                         // want -, got -1.5

    "Think the link between 5G and #COVID19 is the stuff of loony conspiracy-theories?",                    // want ~, got ~
    "Learn new things during this period 2d and 3d animations training ongoing...",                         // want ~, got ~
    "ALERT: Parents decide whether to send kids back to school as coronavirus spreads faster than ever",    // want ~, got ~
    "A surfer walks at Recreio dos Bandeirantes beach, amid the coronavirus disease (COVID-19) outbreak",   // want ~, got -0.27
    "Just in: 1,142 new #COVID19 cases were reported in #Delhi in the past 24 hours",                       // want ~, got ~
    "How #COVID19 Causes Smell Loss - Neuroscience News https://t.co/OG0gIhyctD",                           // want ~, got -0.5
    "Corona Alert | Four arrivals from Chennai tested positive for Covid-19",                               // want ~, got 0.14
    "Passengers cheer as ‘Karen’ is kicked off flight for refusing to wear mask #airlines #coronavirus",    // want ~, got ~
    "Coronavirus can infect people 26 FEET away in cold moving air",                                        // want ~, got -0.3
    "If you bought a face mask with an air valve during the bushfires, DO NOT use it during #COVID19",      // want ~, got ~
    "#USA deaths top 1,100 for third day in a row as #India sees 49,000 new cases",                         // want ~, got ~
    "Indonesian has received 100 ventilators from the Australian Government for COVID-19 handling",         // want ~, got ~
    "The total number of #COVID19 infections worldwide is quickly nearing 16 million",                      // want ~, got -0.25
    "So gyms are reopening today...wonder how many people will be back working up a sweat",                 // want ~, got 0.14
    "Parents ask their #COVID19 questions about #backtoschool",                                             // want ~, got -0.25
    "Establishing triage stations at healthcare facilities is very important to protect health workers"     // want ~, got +0.3
];

// a list of words that I consider to be more neutral than emotional when used in discussions surrounding COVID-19, 
// so ensure SentimentAnalyzer algorithm gives these words a neutral (0) value 
let neutralWords = [
    "disease", "diseases", "outbreak","outbreaks", "virus", "viruses", "pandemic", "pandemics",
    "sick", "ill", "illness",
    "spread", "spreads", "spreading",
    "infect", "infects", "infected", "infection", "infections", 
    "contamine", "contaminates", "contaminated", "contaminating",
    "loss", "lose", "loses", "lost", // often used in non-emotionl context i.e. "lost my sense of smell"
    "positive", "negative",          // often used in non-emotional context i.e. "i tested positive"
    "death", "deaths",               // often used in non-emotional context i.e. "500 new COVID-19 related deaths reported"    
    "question", "questions", "questioning", // SentimentAnalyzer gives these a negative score 
    "alert", "alerts", "alerted", "alerting", // often used in non-emotional context i.e. "Alert: 300 new COVID-19 cases reported in Montreal"   
    "top", "back"  // some random words the SentimentAnalyzer gives a positive or negative score to, that should just be neutral    
];

// so if the sentence contains one of these neutral words, track the rating it gets and normalize it 
// i.e. if "disease" = -2, add 2 to the result before averaging
// AFTER removing stopwords and considering negations, if one of these words is present, remove it before applying sentiment analyzer algorithm

// return a list of all stopwords
// console.log(stopwords.getStopWords());
// check if a word is a stopword
// console.log(stopwords.isStopWord("never"));
// remove a word from the stopword list
// stopwords.remove("never");


            
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

// const testSentence = "i'm not not sad, but I'm not happy";
for (let i = 0; i < testSentences.length; i++)
{
    // NLP Logic: converts all data to its standard form
    const lexData = convertToStandard(testSentences[i]);
    console.log("Lexed Data: ", lexData);

    // convert all data to lowercase
    const lowerCaseData = convertTolowerCase(lexData);
    // console.log("LowerCase Format: ", lowerCaseData);
        
    // remove non alphabets and special characters
    const onlyAlpha = removeNonAlpha(lowerCaseData);
    // console.log("OnlyAlpha: ", onlyAlpha);

    // remove stopwords (e.g. "the", "is", "a", "are") using n-stopwords package before tokenizing
    const filteredData = stopwords.cleanText(onlyAlpha);
    // console.log("After removing stopwords: ", filteredData);
        
    // tokenize the sentence: break the string up into words (tokens)
    const tokenConstructor = new natural.WordTokenizer();
    let tokenizedData = tokenConstructor.tokenize(filteredData);
    // console.log("Tokenized Data: ", tokenizedData);

    // handle negations
    // when faced with a negation word, remove it along with its consecutive word which may be another negation word or a different significant words
    // e.g. not sad -> inconclusive since "not sad" doesn't necessarily mean happy or any other particular emotion
    // e.g. not not happy -> happy
    // e.g. never happy, just sad -> sad
    // e.g. not not sad, but not happy -> sad
    // e.g. not happy, not sad -> inconclusive as we can't derive a particular emotion from this text
    for (let j = 0; j < tokenizedData.length; j++)
    {
      for (let k = 0; k < negationWords.length; k++)
        if (tokenizedData[j] == negationWords[k])
        {
          tokenizedData.splice(j, 2);
          j = j - 2; // decrement by two as the tokenizedData array elements were shifted by two positions
                     // so we need to recheck the new values in these positions
        }
    }

    // display the tokenized data again after negations have been considered
    // console.log("Tokenized Data (negations applied): ", tokenizedData);

    // handle neutral words (those in neutralWords array) by removing them from the tokenizedData array if they are found in it
    // so that they don't affect the score assigned by the SentimentAnalyzer algorithm
    for (let j = 0; j < tokenizedData.length; j++)
    {
      for (let k = 0; k < neutralWords.length; k++)
        if (tokenizedData[j] == neutralWords[k])
        {
          tokenizedData.splice(j, 1);
          j--;      // decrement as the tokenizedData array elements were shifted by a position
                  // so we need to recheck the new value in this same position
        }
    }

    // display the tokenized data again after neutral words have been removed
    console.log("Tokenized Data (neutral words removed): ", tokenizedData);

    // After all this data filtration code, use SentimentAnalyzer from Natural package to generate a sentiment score for the text
    // The sentiment analysis algorithm from Natural library uses AFINN: a lexicon of English words rated for valence using an integer beteen -5 (negative) and 5 (positive).
    // The algorithm works by summing the polarity of each token (word) and normalizing it using the text's length. If the algorithm returns a negative value it represents 
    // a negative sentiment, if it returns a positive value it represents a positive sentiment and if it returns 0 this represents a neutral sentiment.
    const SentiAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    const analysis_score = SentiAnalyzer.getSentiment(tokenizedData);
    console.log("Sentiment Score: ", analysis_score);
    console.log("\n");
}

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
