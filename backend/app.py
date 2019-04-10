#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pandas as pd
import uuid
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


def save_format(dataframe, path):
    if dataframe.shape[1] < app.config['DISTINCT_NUM']:
        df = dataframe[app.config['TOPO_COLUMNS']]
    else:
        df = dataframe[app.config['ALARM_COLUMNS']]
        df_index = range(0, df.shape[0])
        df.insert(0, 'Index', df_index)
        df = df.sort_values('First Occurrence')
    df.to_excel(path, index=False)


def check_file(file, path):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        if filename.endswith('.csv'):
            df_ = pd.read_csv(file)
            save_format(df_, path)
        elif filename.endswith('.xlsx') or filename.endswith('xls'):
            df_ = pd.read_excel(file)
            save_format(df_, path)


def find_path(alarms, client_id):
    ne_path = []
    for i in alarms:
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          client_id, 'topo_format.xlsx'))
        topo = topo.loc[topo['NEName'] == i]
        ne_path.append(set(topo['PathID']))
    topo_path = set()
    for i in range(0, len(ne_path)):
        topo_path = topo_path | ne_path[i]
    return topo_path


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload():
    # get upload file
    file1 = request.files['file1']
    file2 = request.files['file2']
    # create save directory
    client_id = str(uuid.uuid1())
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], client_id))
    save_path1 = os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                              'topo_format.xlsx')
    save_path2 = os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                              'alarm_format.xlsx')
    # check filename and format file
    check_file(file1, save_path1)
    check_file(file2, save_path2)
    # construct json for frontend
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    data = dict()
    data['client_id'] = client_id
    data['start'] = pd.to_datetime(alarm['First Occurrence'].min()).timestamp()
    data['end'] = pd.to_datetime(alarm['First Occurrence'].max()).timestamp()
    data['total_alarm'] = alarm.shape[0]
    data['p_count'] = alarm.loc[alarm['RCA Result'] == 1].shape[0]
    data['c_count'] = alarm.loc[alarm['RCA Result'] == 2].shape[0]
    data['group_count'] = len(set(alarm['RCA Group ID']))
    data['confirmed'] = 0
    data['unconfirmed'] = data['group_count']
    return jsonify(data)


@app.route('/interval')
def interval():
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    a_time = datetime.fromtimestamp(int(request.args.get('start')))
    z_time = datetime.fromtimestamp(int(request.args.get('end')))
    alarm['First Occurrence'] = pd.to_datetime(alarm['First Occurrence'])
    mask = (alarm['First Occurrence'] >= a_time) & \
           (alarm['First Occurrence'] <= z_time)
    alarm = alarm.loc[mask]

    data = dict()
    data['group_id'] = list(set(alarm['RCA Group ID']))
    return jsonify(data)


@app.route('/analyze')
def analyze():
    client_id = request.headers.get('Client-Id')
    group_id = request.args.get('groupId')
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    alarm = alarm.loc[alarm['RCA Group ID'] == group_id]
    topo_path = find_path(set(alarm['Alarm Source']), client_id)
    # construct topo tree
    topo_tree = []
    for i in topo_path:
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          client_id, 'topo_format.xlsx'))
        topo = topo.loc[topo['PathID'] == i]
        per_path = []
        for j, k in zip(topo['NEName'], topo['NEType']):
            per_path.append({'NEName': j, 'NEType': k})
        topo_tree.append(per_path)
    # construct json for frontend
    data = dict()
    data['topo'] = topo_tree
    data['table'] = alarm.to_json(orient='records')
    return jsonify(data)


@app.route('/expand')
def expand():
    client_id = request.headers.get('Client-Id')
    group_id = request.args.get('groupId')
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    alarm = alarm.loc[alarm['RCA Group ID'] == group_id]
    origin_path = find_path(set(alarm['Alarm Source']), client_id)

    a_time = pd.to_datetime(alarm['First Occurrence'].min()).timestamp()
    z_time = pd.to_datetime(alarm['First Occurrence'].max()).timestamp()
    a_time -= 5 * 60
    z_time += 5 * 60

    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    alarm['First Occurrence'] = pd.to_datetime(alarm['First Occurrence'])
    mask = (alarm['First Occurrence'] >= a_time) & \
           (alarm['First Occurrence'] <= z_time)
    alarm = alarm.loc[mask]

    extra_path = find_path(set(alarm['Alarm Source']), client_id)


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
