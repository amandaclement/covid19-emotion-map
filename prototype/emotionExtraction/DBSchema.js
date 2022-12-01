const mongoose = require("mongoose");

// Dataset source: https://github.com/echen102/COVID-19-TweetIDs

const TweetSchema = new mongoose.Schema({
    lang:String,
    retweet_count:Number,
    text:String,
    user_location:String
})

const Tweets = mongoose.model("TWEET", TweetSchema, "COVID19TweetsMarch11");
module.exports = Tweets;