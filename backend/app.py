from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return "Server Running"

@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    complaint = data['text']

    # temporary result
    result = "Fake"

    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(debug=True)

import sqlite3

def save_to_db(text, result):
    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS complaints (text TEXT, result TEXT)")
    c.execute("INSERT INTO complaints VALUES (?, ?)", (text, result))
    conn.commit()
    conn.close()
result = "Fake"
save_to_db(complaint, result)        