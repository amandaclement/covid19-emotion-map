const mongoose = require("mongoose");
const AirplaneCrashSchema = new mongoose.Schema({

    // _id: new ObjectId("63391df67fde488d6961496a"),
    Date:String,
    Time:String,
    Location:String,
    Operator:String,
    FlightNo:String,
    Route:String,
    ACType:String,
    Registration:String,
    cn:Number,
    Aboard:Number,
    AboardPassengers:Number,
    AboardCrew:Number,
    Fatalities:Number,
    FatalitiesPassengers:Number,
    FatalitiesCrew:Number,
    Ground:Number,
    Summary:String
})

const AirplaneCrashes = mongoose.model("AILINECRASHENTRY", AirplaneCrashSchema, "AirplaneCrashes");
module.exports = AirplaneCrashes;