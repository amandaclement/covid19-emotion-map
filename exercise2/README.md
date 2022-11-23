VISUALIZATION DESCRIPTION

The idea behind my visualization is to highlight the words that are at high risk of getting discarded during language processing. Using the lyrics from seven Radiohead songs, I ran the text through several layers of processing to analyze which words get rejected along the way. The resulting visualization shows all unique words from the lyrics scattered across the screen in the foreground (black text on white background), while the words that got deleted during the text's processing are in the background (white text on white background). The user can reveal these "rejected" words by hovering over them with their cursor.



LANGUAGE PROCESSING STEPS

The lyrics are copied into two strings. 
The first string, representing the full set of lyrics, is subject to the following processing steps:

    1. Tokenization (using Natural's tokenizer)
        - To analyze the individual words within the corpus 
    2. Conversion to lowercase
        - To help normalize the words, for maintaing consistency (e.g. "You" == "you")   
    3. Removal of duplicate tokens
        - To work with a more condensed set of words
    4. POS tagging (using Natural's BrillPOSTagger)
    

The second string, representing the "rejected" words, is subject to the following processing steps:

    1. Splitting the string into an array, each position holding the lyrics from one song
    2. Tokenization
        - To analyze the individual words within the corpus
    3. Stemming (using Natural's PorterStemmer) 
        - To prepare the tokens for the next processing steps (to try to maintain consistency)
    4. Counting word frequencies
        - Although this isn't directly reflected in the final result, it was helpful to study the text 
    5. TF-IDF (using Natural's TF-IDF)
        - Each set of song lyrics, which has been tokenized and stemmed, is added as a document
        - Any document that is considered to be "important" relative to the corpus is filtered out
    6. Removal of non-stopwords (using n-stopwords package)
        - Instead of removing stopwords, every token that isn't considered to be a stopword is removed
    7. Conversion to lowercase
        - To help normalize the words, for maintaining consistency (e.g. "You" == "you")
    8. Removal of duplicates
        - To work with a more condensed set of words
    9. POS tagging (using Natural's BrillPOSTagger)
    10. Removal of tokens that have a Word Net definition (using Natural's WordNet)
        - Within this context, I'm considering words with a Word Net definition to be more "important" than those without one. Hence, words with a definition are removed


FURTHER DESCRIPTION & INFERENCES

The array derived from the processing of the first string represents the full set of lyrics. The only step from that process that discards words is the removal of duplicates, which is only done to have a more condensed set of words to display in the visualization without actually filtering out distinct words. The words from this array are those in the foreground (black text) of the visualization.

The array derived from the processing of the second string represents the "rejected" words, being the ones that might easily be discarded by a language processing algorithm. Although the effects of some of these steps is not directly shown in the resulting visualization, they contribute to deciding which words are at high risk of being rejected. For instance, Natural's TF-IDF is used to remove words that are considered to be important relative to the corpus, n-stopwords is used to remove non-stopwords, and Word Net is used to remove words without a definition. The words from this array are those in the background (white text) of the visualization.

One processing step that has an apparent effect on the visualization is POS tagging, which determines the font applied to each word. Along with the two arrays holding the tokenized lyrics, another two arrays are used to hold the corresponding tags. These varying fonts gives an idea of which types of words (e.g. determiner, noun) tend to be discarded during language processing. What I observed from this process is that pronouns and prepositions are quite susceptible to being discarded, while nouns are much less likely to be discarded. Also, many verbs were rejected, which I found surprising as I would think these are often crucial to the meaning of a sentence. 

Another interesting area for analysis of this tagging process is to see which tag is assigned to words that can be classified under multiple categories (e.g. "thought" is both a verb and a noun). Although this exercise made me reflect on this idea, I could not identify any patterns that gave me enough insight on this topic to make any valuable inferences.

Overall, I found that a very high number of words were discarded through the language processing algorithms I used. The resulting visualization made this clear to me, as I expected only a few words to be in the background, but it's actually quite populated with discarded words. Of 288 unique words found in the lyrics from 7 songs, 89 words were rejected. Although my approach to processing the text is very rudimentary and a more sophisticated approach might preserve a greater number of words, these methods, at their core, appear to filter the text in such a way that eliminates a whole lot of content, which can easily lead to misrepresentations of the original text. As such, caution should certainly be taken during natural language processing to avoid accidentally distorting or destroying the meaning behind a text.
