from flask import Flask
from flask import render_template
from flask import send_from_directory
from pymongo import MongoClient
import json

app = Flask(__name__)

RESULT_LIMIT = 60000
RESULT_OFFSET = 0
MONGODB_HOST = 'ds149577.mlab.com'
MONGODB_PORT = 49577
MONGO_URI = 'mongodb://root:347yfuhb@ds149577.mlab.com:49577/heroku_hxxs4lrc'
DBS_NAME = 'heroku_hxxs4lrc'
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
