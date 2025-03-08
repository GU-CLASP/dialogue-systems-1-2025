# Lab 3 A report 

I tried different poets' names (Richard Siken, Topaz Winters, Leila Chatti, Nanténé Traoré) and found some had very low confidence scores (below 0.6) or were not recognized properly, or with the correct spelling. Below are some examples of utterances and confidence scores. I tested out saying the name isolated, and to start with “My name is” to see how that would influence the confidence, as I hypothesized that adding context might improve the system’s confidence, as it would have a higher ‘expectation’ for a name. Looking at the numbers, we can indeed see that the confidence scores improve a lot and are all above 0.6. However, this might be because it recognizes clearly the words “My name is”, which brings up the overall average confidence, rather than increasing the confidence in the words that make up the name.
We can also see that, with little surprise, names that were English or pronounced in an English way were more easily recognized, which can be explained by the fact that the ASR language is set to English. However, one can think about how this could be an issue if someone with a foreign name is trying to log in their name, as people will usual pronounce their name in their native language’s pronunciation. 

### Richard Siken:
Richard Syken. Confidence: 0.49860996
My name is Richard Sykin. Confidence: 0.76481503
### Topaz Winters:
Topaz Winters. Confidence: 0.59265816
My name is Topaz Winters. Confidence: 0.8781241
### Leila Chatti:
Leila Shetty. Confidence: 0.13752049.
My name is Leila Shadi. Confidence: 0.7022832
### Nanténé Traoré:
Nantinit, Ravi. Confidence: 0.048508823
My name is Nantinet Rauri. Confidence: 0.601775