from flask import Flask
from flask import render_template
from flask import send_from_directory
from pymongo import MongoClient
import json

app = Flask(__name__)

RESULT_LIMIT = 20000
MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'donorsUSA'
COLLECTION_NAME = 'projects'
FIELDS = {'funding_status': True, 'school_state': True, 'resource_type': True, 'poverty_level': True,
          'date_posted': True, 'total_donations': True, 'primary_focus_area': True, 'grade_level': True,
          'school_state': True, '_id': False}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data/us_states_geo")
def send_json():
    return send_from_directory('./static/data', 'US_states.json')


@app.route("/donorsUS/projects")
def donor_projects():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS, limit=RESULT_LIMIT).skip(0)  # first skip + 55,000
    # projects = collection.find(projection=FIELDS).skip(collection.count() - RESULT_LIMIT)  # last 55,000 instead
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects)
    connection.close()
    return json_projects


if __name__ == "__main__":
    app.run(debug=True)
