INSTRUCTIONS TO DOWNLOAD AND RUN THE PROTOTYPE

    1. Download the prototype folder

    2. Run the following commands:
        npm install node
        npm install express
        npm install natural
        npm install mongoose
        npm install dotenv
        npm install n-stopwords

    3. Create a .env file and paste in the MongoDB URI (sent privately)

    4. Run the following command:
        node index.js

    5. The prototype should now be running on port 4000 (localhost:4000)
        Note: Depending on the number of Tweets in the sample size, the load
              time may be quite long. To change the number of Tweets used in 
              the visualization, go to line 18 in index.js and change the 
              value of the numTweetsToProcess variable. For the final project,
              there will be a loading screen and modifications made to avoid
              the lengthy load time.