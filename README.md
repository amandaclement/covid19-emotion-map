# COVID-19 Emotion Map
## Summary
COVID-19 Emotion Map is a full-stack web application that features an interactive data visualization of emotion-analyzed COVID-19 related data sourced from Twitter. The goal was to explore, analyze, and illustrate emotional trends associated with the pandemic.

## Technologies Used
Front-End: JavaScript, HTML, CSS<br/>
Back-End: NodeJS, ExpressJS<br/>
Visualization: p5JS<br/>
Database: MongoDB, Mongoose<br/>
Data Collection: Twitter API<br/>
Natural Language Processing (NLP): Natural

## Steps
### Gathering the Data
1. A list of 1,145,287 COVID-19-related Tweet IDs from March 11th, 2020 was collected from the following GitHub repository: https://github.com/echen102/COVID-19-TweetIDs. This date was chosen as it was the day the WHO declared the COVID-19 outbreak a global pandemic so COVID-19 related hashtag usage spiked on that day. These IDs were passed through the Hydrator app which uses Twitter’s API to return the corresponding data from Twitter as a CSV file. 701,747 Tweets were successfully hydrated.
2. Text files containing lists of English words and their associations with the emotions of interest (anger, fear, trust, joy and sadness) from the NRC Emotion Lexicon were gathered from: https://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm. I modified these files by removing certain words that, in the context of my project, seemed misclassified.

### Processing the Data
1. The CSV file of hydrated Tweets was imported into MongoDB collection, where the following fields were retained from the set of data: text, language, location, number of retweets.
2. Mongoose queries, complimentary to NodeJS, were used to fetch the data. Only English Tweets were fetched as I could not properly analyze or process other languages. 380,505 Tweets remained after this step.
3. The following language processing steps were executed on the text from each Tweet:
   1. An array of normalized versions of terms was used to convert parts of the text to simpler form to prepare it for the following steps (e.g. aren’t ⇒ are not).
   2. All characters were converted to lowercase.
   3. All special characters (e.g. emojis) were removed from the text as the emotion analysis only works on textual data.
   4. Stopwords were removed from the text. The n-stopwords package was used for this step, but modified it so that it does not remove negation words.
   5. The text was tokenized using the Natural package.
   6. The text was stemmed using the Natural package.
   7. Negation words were searched for in the text and if found, the tokenized word that came directly after it was removed.
   8. Emotions from the emotion text files (e.g. anger.txt) were searched for in the remaining tokens. These results were stored.
4. The following language processing steps were executed on the location from each Tweet:
   1. For Tweets that were associated with a location, the location text was converted to lowercase.
   2. Country names and codes were searched for in the location text. States and provinces were also searched for. If found, the country code was stored.
5. The stored results, which included the Tweet texts, country codes, and retweet counts were outputted to a JSON file. This JSON file was then imported into MongoDB to create a new collection.

### Creating the Visualization
1. The files were set up using NodeJS and ExpressJS for server-side scripting.
2. The data from the form the user is presented with when they launch the website is passed via POST request, which is then used to decide how large a sample size to fetch from the MongoDB collection. Once the sample data has been fetched via a Mongoose query, the results are passed along via POST request to the client.
3. Once the response is received, the data is used to create the visualization, which uses p5JS for canvas drawing.

## Screenshots
![Screenshot of intro screen](/images/img1.png)
![Screenshot of visualization, featuring 3000 Tweets](/images/img2.png)
![Screenshot of visualization, featuring 30,000 Tweets](/images/img3.png)
![Screenshot of visualization, demonstrating what happens if user clicks an ellipse](/images/img4.png)
![Screenshot of visualization, demonstrating what happens if user clicks a filter button](/images/img5.png)
![Screenshot of visualization, demonstrating what happens if user clicks country cluster button](/images/img6.png)
![Screenshot of about page](/images/img7.png)
