#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pandas as pd
import uuid
import json
import os

from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object('config')
CORS(app, resources=r'/*')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in \
           app.config['ALLOWED_EXTENSIONS']


def save_format(df, client_id):
    if df.shape[1] > app.config['DISTINCT_NUM']:
        df = df[app.config['ALARM_COLUMNS']]
        df.columns = app.config['ALARM_MAPPING']
        df_index = range(0, df.shape[0])
        df.insert(0, 'Index', df_index)
        df.insert(df.shape[1], 'GroupId_Edited', df['GroupId'])
        df.insert(df.shape[1], 'RcaResult_Edited', df['RcaResult'])
        df.insert(df.shape[1], 'RuleName_Edited', df['RuleName'])
        df['Confirmed'] = 0
        df = df.sort_values('First')
        path = os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                            app.config['ALARM_FILE'])
    else:
        df = df[app.config['TOPO_COLUMNS']]
        df.columns = app.config['TOPO_MAPPING']
        path = os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                            app.config['TOPO_FILE'])
    df.to_excel(path, index=False)


def check_file(files):
    client_id = str(uuid.uuid1())
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], client_id))
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            if filename.endswith('.xlsx') or filename.endswith('xls'):
                df = pd.read_excel(file)
                save_format(df, client_id)
            else:
                df = pd.read_csv(file)
                save_format(df, client_id)
        # TODO(ICHIGOI7E): exception handling
    return client_id


def interval_filter(start, end):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       app.config['ALARM_FILE']))
    alarm['First'] = pd.to_datetime(alarm['First'])
    mask = (alarm['First'] >= start) & (alarm['First'] <= end)
    alarm = alarm.loc[mask]
    return alarm


def group_filter(group_id):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       app.config['ALARM_FILE']))
    alarm = alarm.loc[alarm['GroupId'] == group_id]
    return alarm


def find_path(alarms):
    client_id = request.headers.get('Client-Id')
    ne_path = []
    for alarm in alarms:
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          client_id, app.config['TOPO_FILE']))
        topo = topo.loc[topo['NEName'] == alarm]
        ne_path.append(set(topo['PathId']))
    topo_path = set()
    for i in range(0, len(ne_path)):
        topo_path = topo_path | ne_path[i]
    return topo_path


def build_tree(paths):
    client_id = request.headers.get('Client-Id')
    topo_tree = []
    for path in paths:
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          client_id, app.config['TOPO_FILE']))
        topo = topo.loc[topo['PathId'] == path]
        per_path = []
        for ne_name, ne_type in zip(topo['NEName'], topo['NEType']):
            per_path.append({'NEName': ne_name, 'NEType': ne_type})
        topo_tree.append(per_path)
    return topo_tree


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload():
    # get upload file
    file1 = request.files['file1']
    file2 = request.files['file2']
    # check filename and save file
    client_id = check_file([file1, file2])
    # construct json for frontend
    data = dict()
    data['client_id'] = client_id
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       app.config['ALARM_FILE']))
    data['start'] = pd.to_datetime(alarm['First'].min()).timestamp()
    data['end'] = pd.to_datetime(alarm['First'].max()).timestamp()
    data['total_alarm'] = alarm.shape[0]
    data['p_count'] = alarm.loc[alarm['RcaResult'] == 1].shape[0]
    data['c_count'] = alarm.loc[alarm['RcaResult'] == 2].shape[0]
    data['group_count'] = len(set(alarm['GroupId']))
    data['confirmed'] = 0
    data['unconfirmed'] = data['group_count']
    return jsonify(data)


@app.route('/interval')
def interval():
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(int(request.args.get('start')))
    z_time = datetime.fromtimestamp(int(request.args.get('end')))
    alarm = interval_filter(a_time, z_time)
    # construct json for frontend
    data = dict()
    data['group_id'] = list(set(alarm['GroupId']))
    return jsonify(data)


@app.route('/analyze')
def analyze():
    # generate topo tree
    group_id = request.args.get('groupId')
    alarm = group_filter(group_id)
    topo_path = find_path(set(alarm['AlarmSource']))
    topo_tree = build_tree(topo_path)
    # construct json for frontend
    data = dict()
    data['topo'] = topo_tree
    data['table'] = json.loads(alarm.to_json(orient='records'))
    data['orange'] = list(set(alarm['AlarmSource']))
    return jsonify(data)


@app.route('/locate')
def locate():
    # locate red network element
    group_id = request.args.get('groupId')
    locator = request.args.get('locator')
    locator_value = request.args.get('locatorValue')
    alarm = group_filter(group_id)
    alarm = alarm.loc[alarm[locator] == locator_value]
    # construct json for frontend
    data = dict()
    data['red'] = list(set(alarm['AlarmSource']))
    return jsonify(data)


@app.route('/expand')
def expand():
    # generate topo path
    group_id = request.args.get('groupId')
    alarm = group_filter(group_id)
    topo_path = find_path(set(alarm['AlarmSource']))
    # get interval filtered dataframe
    a_time = pd.to_datetime(alarm['First'].min()).timestamp() - 5 * 60
    z_time = pd.to_datetime(alarm['First'].max()).timestamp() + 5 * 60
    alarm = interval_filter(a_time, z_time)
    # generate topo tree
    extra_path = find_path(set(alarm['AlarmSource']))
    topo_path = topo_path | extra_path
    topo_tree = build_tree(topo_path)
    # construct json for frontend
    data = dict()
    data['topo'] = topo_tree
    data['table'] = json.loads(alarm.to_json(orient='records'))
    alarm = alarm.loc[alarm['GroupId'] != group_id]
    data['yellow'] = list(set(alarm['AlarmSource']))
    return jsonify(data)


@app.route('/confirm', methods=['POST'])
def confirm():
    # get edited info
    data = request.get_json()
    group_id = request.args.get('groupId')
    alarm = group_filter(group_id)
    row_edited = data['row']
    column_edited = data['column']
    value_edited = data['value']
    # return confirmed alarm table
    for row, column, value in zip(row_edited, column_edited, value_edited):
        edited = dict(alarm.iloc[row])
        edited[column + '_Edited'] = value
        edited['Confirmed'] = 1
        alarm.iloc[row] = pd.Series[edited]
    return alarm.to_json(orient='records')


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
