from textblob import TextBlob

class PriorityEngine:
    def __init__(self):
        self.urgent_keywords = ['urgent', 'deadline', 'asap', 'critical', 'alert']

    # --- MAKE SURE THIS IS NAMED 'analyze', NOT 'calculate_score' ---
    def analyze(self, subject, body):
        text = f"{subject} {body}"
        
        # safely handle textblob analysis
        try:
            blob = TextBlob(text)
            sentiment = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
        except:
            sentiment = 0
            subjectivity = 0
        
        score = 0
        reasons = []

        # 1. Negative Tone (High Priority)
        if sentiment < -0.1:
            score += 30
            reasons.append(f"Negative tone ({round(sentiment, 2)})")
        
        # 2. Urgency Keywords
        found_keywords = [word for word in self.urgent_keywords if word in text.lower()]
        if found_keywords:
            score += 50
            reasons.append(f"Keywords: {', '.join(found_keywords)}")

        # 3. Cap Score
        final_score = min(score, 100)
        
        # 4. Label
        if final_score >= 60: priority = "High"
        elif final_score >= 30: priority = "Medium"
        else: priority = "Low"

        return final_score, priority, reasons