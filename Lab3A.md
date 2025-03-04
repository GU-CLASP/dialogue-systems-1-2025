# Part A

In this exploration of the limitations of ASR, particularly Azure's speech services, I tested various real and fictional terms to test its limits. While the model generally performed well, it was far from perfect.

Foreign names are a clear weakness, for example, as they were consistently mistaken for similar sounding English words or failed to be recognised correctly. For instance, my name has been transcribed as "Travis" or "Status", though it was correctly recognised most times. Although fictional names were mostly correctly recognised as made-up terms, they were transcribed in unpredictable ways, something that could prove to be problematic when trying to integrate the recognised speech into code.

These failures could be attributed to the training data these models use. If the models are trained on anglocentric data, it is expected that foreign names would not be easily recognised. Additionally, such models tend to rely more on statistical data rather than true phonetic recognision of the speech signal. This could explain why new or rare terms are likely to be recognised as similar, more common words.

One potential solution to this problem would be to fine-tune the model for specific use cases. Since we have a general idea of the terms our users are likely to use, incorporating a custom lexicon could significantly improve the model's accuracy.