from flask import Flask
from flask import render_template
from flask import send_from_directory
from pymongo import MongoClient
import json
import os

app = Flask(__name__)

if os.environ.get('ROLE') == "server":  # heroku deployment
    RESULT_LIMIT = int(os.environ.get('RESULT_LIMIT'))   # Tweak number of documents to suit server performance
    RESULT_OFFSET = int(os.environ.get('RESULT_OFFSET'))   # Start from a different date if preferred
    RESULT_LATEST = (os.environ.get('RESULT_LATEST'))  # Get the latest records if preferred
    DBS_NAME = os.environ.get('DBS_NAME')
    MONGO_URI = os.environ.get('MONGO_URI')
    MONGODB_HOST = os.environ.get('MONGODB_HOST')
    MONGODB_PORT = os.environ.get('MONGODB_PORT')
else:  # local deployment
    RESULT_LIMIT = 50000
    RESULT_OFFSET = 2000
    RESULT_LATEST = "False"  # String on heroku
    MONGODB_HOST = 'localhost'
    MONGODB_PORT = 27017
    DBS_NAME = 'donorsUSA'

COLLECTION_NAME = 'projects'
FIELDS = {'funding_status': True, 'school_state': True, 'resource_type': True, 'poverty_level': True,
          'date_posted': True, 'primary_focus_area': True, 'grade_level': True, 'total_donations': True,
          '_id': False, 'school_ncesid': True}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data/us_states_geo")
def send_json():
    return send_from_directory('./static/data', 'US_states.json')


@app.route("/donorsUS/projects")
def donor_projects():
    if os.environ.get('ROLE') == "server":  # heroku deployment
        connection = MongoClient(MONGO_URI)
    else:  # local deployment
        connection = MongoClient(MONGODB_HOST, MONGODB_PORT)

    collection = connection[DBS_NAME][COLLECTION_NAME]
    if RESULT_LATEST.upper() == "TRUE":
        projects = collection.find(projection=FIELDS).skip(collection.count() - RESULT_LIMIT)  # latest
    else:
        projects = collection.find(projection=FIELDS, limit=RESULT_LIMIT).skip(RESULT_OFFSET)  # skip some from start

    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects)
    connection.close()
    return json_projects


if __name__ == "__main__":
    if os.environ.get('ROLE') == "server":  # heroku deployment
        app.run()
    else:  # local deployment
        app.run(debug=True)

