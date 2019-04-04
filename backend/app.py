#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import pandas as pd

from flask import Flask, request, render_template
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object('config')
CORS(app, resources=r'/*')

topo = pd.DataFrame(columns=['PathID', 'NEName'])
alarm = pd.DataFrame(columns=['Alarm Name', 'Alarm Source'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in \
           app.config['ALLOWED_EXTENSIONS']


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload():
    file1 = request.files['file1']
    file2 = request.files['file2']
    date = json.loads(request.form.get('date'))
    if file1 and file2 and date and allowed_file(file1.filename) and \
       allowed_file(file2.filename):
        filename1 = secure_filename(file1.filename)
        filename2 = secure_filename(file2.filename)
        file1.save(os.path.join(app.config['UPLOAD_FOLDER'], filename1))
        file2.save(os.path.join(app.config['UPLOAD_FOLDER'], filename2))

    global alarm
    alarm_ = pd.DataFrame(columns=['Alarm Name', 'Alarm Source'])
    if file2.filename.endswith('.csv'):
        alarm_ = pd.read_csv(file2)
    elif file2.filename.endswith('.xlsx') or file2.filename.endswith('xls'):
        alarm_ = pd.read_excel(file2)
    alarm = alarm_[['Alarm Name', 'Alarm Source', 'Vendor', 'First Occurrence',
                    'Last Occurrence', 'Raw Severity', 'Cleared On', 'Domain',
                    'RCA Group ID', 'RCA Result', 'RCA Rule Name']]

    a_time = datetime.fromtimestamp(date[0]/1000)
    z_time = datetime.fromtimestamp(date[1]/1000)
    alarm['First Occurrence'] = pd.to_datetime(alarm['First Occurrence'])
    mask = (a_time <= alarm['First Occurrence']) & \
           (alarm['First Occurrence'] <= z_time)
    # alarm = alarm.loc[mask]

    data = dict()
    data['total_alarm'] = int(alarm.shape[0])
    data['p_count'] = int(alarm[alarm['RCA Result'] == 1]['RCA Result'].count())
    data['c_count'] = int(alarm[alarm['RCA Result'] == 2]['RCA Result'].count())
    data['group_count'] = int(pd.Series(alarm['RCA Group ID']).nunique())
    data['confirmed'] = 0
    data['unconfirmed'] = data['group_count']
    data['group_id'] = alarm['RCA Group ID'].drop_duplicates().tolist()
    return json.dumps(data)


@app.route('/analyze')
def analyze():
    global alarm
    group_id = request.args.get('groupId')
    add_condition = request.args.get('addCondition')
    add_value = request.args.get('addValue')
    if add_condition and add_value.strip():
        if add_condition == '0':
            alarm = alarm.loc[alarm['Vendor'] == add_value]
        if add_condition == '1':
            alarm = alarm.loc[alarm['Alarm Name'] == add_value]
        if add_condition == '2':
            alarm = alarm.loc[alarm['RCA Rule Name'] == add_value]
        if add_condition == '3':
            alarm = alarm.loc[alarm['RCA Result'] == add_value]
        if add_condition == '4':
            alarm = alarm.loc[alarm['RCA Result'] == add_value]
    alarm = alarm.loc[alarm['RCA Group ID'] == group_id]
    table_str = alarm.to_json(orient='index')
    table_dict = json.loads(table_str)
    data = dict()
    data['topo'] = []
    # data['table'] = alarm.to_json(orient='index')
    data['table'] = []
    for value in table_dict.values():
        data['table'].append(value)
    return json.dumps(data)


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
