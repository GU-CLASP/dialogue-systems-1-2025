Lab 3A: Hard Cases for Speech Recognition
Observations and Results
For this experiment, I tested different names and phrases to see how well the Automatic Speech Recognition (ASR) system could understand them. The results were quite mixed, depending on the words I used.

Common Phrases: Everyday words like "Hello" (confidence: 0.4278) and "Hi" (confidence: 0.3690) were recognized, but not with particularly high confidence.

Names and Proper Nouns: The real challenge came with names, especially Portuguese ones.

When I said "João", the system heard "Juan" (confidence: 0.6486). This suggests that the ASR system is more familiar with Spanish names than Portuguese ones.
When I said "Maria está dormindo", it turned into "Maria Estador Mingo" (confidence: 0.1445). The phrase was completely changed into something that sounds more like Spanish than Portuguese.
Even "Victoria" was recognized with very low confidence (0.1394), showing uncertainty even for a well-known name.

Reflections
Language Bias: The ASR system seems to favor Spanish over Portuguese. Instead of recognizing João, it defaulted to the more common Spanish Juan, and it turned a normal Portuguese sentence into something that does not make sense.
Training Data Limitations: The system may have been trained with more Spanish examples, leading it to choose Spanish-sounding words over Portuguese ones.
Confidence Score Patterns: When the confidence score is below 0.2, the transcription tends to be inaccurate and sometimes completely wrong.

Potential Solutions
Better Multilingual Training: If the ASR system had more exposure to Portuguese, it would likely perform better with these words.
Custom Vocabulary Adjustments: Adding Portuguese names and phrases to the ASR model could help improve recognition.
