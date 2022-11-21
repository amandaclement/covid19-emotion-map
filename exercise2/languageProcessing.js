/* 
----------------------------------------------------------------------------------------------------------------
    COMP 451: EXERCISE II
    Concept: analyzing the words that we often reject (or distort) during language processing
    Language processed: lyrics from 7 Radiohead songs
    By Amanda Clement

    This file is responsible for language processing.
----------------------------------------------------------------------------------------------------------------
*/  

/* 
--------------------------------------------------------
    IMPORT NATURAL PACKAGE
--------------------------------------------------------
*/
const natural = require("natural");

/* 
--------------------------------------------------------
    FILE READING
--------------------------------------------------------
*/
const {readFileSync, promises: fsPromises} = require('fs');

// file reading promise
let fileReadingPromise = new Promise((resolve, reject) => {
    const contents = fsPromises.readFile('files/lyrics.txt', 'utf-8');
    resolve(contents);
  });

fileReadingPromise.then((lyricsFile) => {
    let allLyrics = lyricsFile;
    let lyrics = lyricsFile.split(/\r?[0-9]/); // split up into respective songs (7 total)

    /* 
    --------------------------------------------------------
        TOKENIZE
    --------------------------------------------------------
    */
    let tokenizer = new natural.WordTokenizer();
    let allTokens = tokenizer.tokenize(allLyrics);
    let song1Tokens = tokenizer.tokenize(lyrics[0]);
    let song2Tokens = tokenizer.tokenize(lyrics[1]);
    let song3Tokens = tokenizer.tokenize(lyrics[2]);
    let song4Tokens = tokenizer.tokenize(lyrics[3]);
    let song5Tokens = tokenizer.tokenize(lyrics[4]);
    let song6Tokens = tokenizer.tokenize(lyrics[5]);
    let song7Tokens = tokenizer.tokenize(lyrics[6]);

    /* 
    --------------------------------------------------------
        REMOVE DUPLICATES FROM FULL SET OF LYRICS
    --------------------------------------------------------
    */  
    // convert all tokenized lyrics to lowercase
    const lowercaseLyrics = allTokens.map(element => {
        return element.toLowerCase();
    });
    
    // remove duplicates
    let uniqueLyrics = [...new Set(lowercaseLyrics)];

    /* 
    --------------------------------------------------------
        STEM: to make tokens as consistent as possible
    --------------------------------------------------------
    */
    let song1Stemmed = [];
    for (let i = 0; i < song1Tokens.length; i++)
        song1Stemmed[i] = natural.PorterStemmer.stem(song1Tokens[i]);  

    let song2Stemmed = [];
    for (let i = 0; i < song2Tokens.length; i++)
        song2Stemmed[i] = natural.PorterStemmer.stem(song2Tokens[i]); 

    let song3Stemmed = [];
    for (let i = 0; i < song3Tokens.length; i++)
        song3Stemmed[i] = natural.PorterStemmer.stem(song3Tokens[i]); 

    let song4Stemmed = [];
    for (let i = 0; i < song4Tokens.length; i++)
        song4Stemmed[i] = natural.PorterStemmer.stem(song4Tokens[i]);

    let song5Stemmed = [];
    for (let i = 0; i < song5Tokens.length; i++)
        song5Stemmed[i] = natural.PorterStemmer.stem(song5Tokens[i]);

    let song6Stemmed = [];
    for (let i = 0; i < song6Tokens.length; i++)
            song6Stemmed[i] = natural.PorterStemmer.stem(song6Tokens[i]);

    let song7Stemmed = [];
    for (let i = 0; i < song7Tokens.length; i++)
            song7Stemmed[i] = natural.PorterStemmer.stem(song7Tokens[i]);

    let allLyricsStemmed = [];
        for (let i = 0; i < allTokens.length; i++)
        allLyricsStemmed[i] = natural.PorterStemmer.stem(allTokens[i]);

    /* 
    --------------------------------------------------------
        COUNT WORD FREQUENCIES
    --------------------------------------------------------
    */
    // reference: https://medium.com/@estherspark91/how-to-get-the-word-count-in-an-array-using-javascript-8206f14f2f43
    function getWordCntRd() {
        return arr.reduce((prev, nxt) => {
          prev[nxt] = (prev[nxt] + 1) || 1;
          return prev;
        }, {});
    }
    let arr = allLyricsStemmed;
    console.log(getWordCntRd(allLyricsStemmed));

    /* 
    --------------------------------------------------------
        TF-IDF
    --------------------------------------------------------
    */    
    let TfIdf = natural.TfIdf;
    let tfidf = new TfIdf();
    tfidf.addDocument(song1Stemmed);
    tfidf.addDocument(song2Stemmed);
    tfidf.addDocument(song3Stemmed);
    tfidf.addDocument(song4Stemmed);
    tfidf.addDocument(song5Stemmed);
    tfidf.addDocument(song6Stemmed);
    tfidf.addDocument(song7Stemmed);

    // push tokens from each document that are considered "less important" relative to the corpus into wordRemaining array
    let wordsRemaining = [];
    for (let j = 0; j < allTokens.length; j++) {
        tfidf.tfidfs(allTokens[j], function(i, measure) {
            if (measure < 0.32)   // after testing, 0.32 is the appropriate cutoff
                wordsRemaining.push(allTokens[j]);
        });
    }

    /* 
    --------------------------------------------------------
        STOPWORDS
    --------------------------------------------------------
    */  
    // from remaining words, keep only those that ARE stopwords
    const stopwords = require('n-stopwords')(); 
    let onlyStopwords = [];
    for (let i = 0; i < wordsRemaining.length; i++)
        if (stopwords.isStopWord(wordsRemaining[i]))
            onlyStopwords.push(wordsRemaining[i]);

    /* 
    --------------------------------------------------------
        REMOVE DUPLICATES
    --------------------------------------------------------
    */  
    // first convert all words to lowercase
    const lowercase = onlyStopwords.map(element => {
        return element.toLowerCase();
    });

    // then filter out duplicates
    let uniqueWords = lowercase.filter(function(item, pos) {
        return lowercase.indexOf(item) == pos;
    })

    /* 
    --------------------------------------------------------
        TAG TOKENS
    --------------------------------------------------------
    */  
    const language = "EN"
    const defaultCategory = 'N';
    const defaultCategoryCapitalized = 'NNP';
        
    let lexicon = new natural.Lexicon(language, defaultCategory, defaultCategoryCapitalized);
    let ruleSet = new natural.RuleSet('EN');
    let tagger = new natural.BrillPOSTagger(lexicon, ruleSet);
    console.log(tagger.tag(uniqueWords));

    console.log("FINAL LIST OF ALL UNIQUE WORDS (FULL SET)");
    console.dir(tagger.tag(uniqueLyrics), {'maxArrayLength': null}); // display all results

    /* 
    --------------------------------------------------------
        WORD NET
    --------------------------------------------------------
    */  
    // only words that don't have a Word Net definition logged here - they represent the final group of "forgotten words" derived from the entire filtering process
    let wordnet = new natural.WordNet();
    console.log("FINAL LIST OF FORGOTTEN WORDS");
    for (let i = 0; i < uniqueWords.length; i++) {
        wordnet.lookup(uniqueWords[i], function(results) {
            try {
                results[i].gloss;
            }
            catch {
                console.log(uniqueWords[i]);
            }
        });
    }
});
