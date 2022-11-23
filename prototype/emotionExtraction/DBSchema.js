const mongoose = require("mongoose");

// https://www.kaggle.com/datasets/gpreda/covid19-tweets

const TweetSchema = new mongoose.Schema({
    user_location:String,
    user_description:String,
    user_created:String,
    user_followers:Number,
    user_friends:Number,
    date:String,
    text:String
})

const Tweets = mongoose.model("TWEET", TweetSchema, "COVID19Tweets");
module.exports = Tweets;