import mongoose from "mongoose"; // For MongoDB interaction

// Dataset contains the processed March 11 Tweets SAMPLE

const TweetSchema = new mongoose.Schema({
    tweet:String,
    anger:Boolean,
    fear:Boolean,
    joy:Boolean,
    sadness:Boolean,
    trust:Boolean,
    location:String,
    retweets:Number
})

const TweetsModule = mongoose.model("TWEET", TweetSchema, "COVID19TweetsMarch11Processed");
export default TweetsModule;