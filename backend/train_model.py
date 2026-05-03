from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle

# Complaint data
texts = [
    "This is fake complaint",
    "Fraud complaint not true",
    "Real issue happened",
    "My account was hacked",
    "Payment issue occurred",
    "This complaint is false"
]

# Labels
# 0 = Fake
# 1 = Genuine
labels = [0, 0, 1, 1, 1, 0]

# Convert text into numbers
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

# Train ML model
model = LogisticRegression()
model.fit(X, labels)

# Save model
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("Model trained successfully")