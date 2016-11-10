from flask import Flask
from flask import render_template
from flask import send_from_directory
from pymongo import MongoClient
import json
import os

app = Flask(__name__)

RESULT_LIMIT = int(os.environ.get('RESULT_LIMIT'))
RESULT_OFFSET = 0
DBS_NAME = os.environ.get('DBS_NAME')  # heroku deployment
MONGO_URI = os.environ.get('MONGO_URI')  # heroku deployment
MONGODB_HOST = os.environ.get('MONGODB_HOST')  # heroku deployment
MONGODB_PORT = os.environ.get('MONGODB_PORT')  # heroku deployment
# MONGODB_HOST = 'localhost'  # local deployment
# MONGODB_PORT = 27017  # local deployment
# DBS_NAME = 'donorsUSA'  # local deployment
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
    # connection = MongoClient(MONGODB_HOST, MONGODB_PORT)  # local deployment
    connection = MongoClient(MONGO_URI)  # heroku deployment
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS, limit=RESULT_LIMIT).skip(RESULT_OFFSET)  # skip some from start
    #  projects = collection.find(projection=FIELDS).skip(collection.count() - RESULT_LIMIT)  # latest instead
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects)
    connection.close()
    return json_projects


if __name__ == "__main__":
    # app.run(debug=True)
    app.run()
    # app.run(host='ip address')
