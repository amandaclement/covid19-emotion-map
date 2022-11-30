const mongoose = require("mongoose");

// Dataset source: https://www.openicpsr.org/openicpsr/project/120321/version/V4/view?path=/openicpsr/120321/fcr:versions/V4/tweets_topics_sentiments_emotions&type=folder

const TweetSchema = new mongoose.Schema({
    created_at:String,
    retweet_count:Number,
    text:String,
    user_location:String
})

const Tweets = mongoose.model("TWEET", TweetSchema, "COVID19CanadianTweets");
module.exports = Tweets;