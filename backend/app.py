#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import uuid
import pandas as pd

from flask import Flask, request, render_template, jsonify, redirect, url_for
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object('config')
CORS(app, resources=r'/*')

interval = ''


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in \
           app.config['ALLOWED_EXTENSIONS']


def save_formatted(file, path):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        if filename.endswith('.csv'):
            df_ = pd.read_csv(file)
            if df_.shape[1] < app.config['DISTINCT_NUM']:
                df = df_[app.config['TOPO_COLUMNS']]
                df.to_excel(path)
            else:
                df = df_[app.config['ALARM_COLUMNS']]
                df.to_csv(path)
        elif filename.endswith('.xlsx') or filename.endswith('xls'):
            df_ = pd.read_excel(file)
            if df_.shape[1] < app.config['DISTINCT_NUM']:
                df = df_[app.config['TOPO_COLUMNS']]
                df.to_excel(path)
            else:
                df = df_[app.config['ALARM_COLUMNS']]
                df.to_excel(path)


def interval_filter(current_interval, client_id):
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    a_time = datetime.fromtimestamp(current_interval[0] / 1000)
    z_time = datetime.fromtimestamp(current_interval[1] / 1000)
    alarm['First Occurrence'] = pd.to_datetime(alarm['First Occurrence'])
    mask = (a_time <= alarm['First Occurrence']) & \
           (alarm['First Occurrence'] <= z_time)
    return alarm.loc[mask]


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload():
    # save formatted files to disk
    file1 = request.files['file1']
    file2 = request.files['file2']
    client_id = str(uuid.uuid1())
    save_path1 = os.path.join(app.config['UPLOAD_FOLDER'] + client_id +
                              'topo_format.xlsx')
    save_path2 = os.path.join(app.config['UPLOAD_FOLDER'] + client_id +
                              'alarm_format.xlsx')
    save_formatted(file1, save_path1)
    save_formatted(file2, save_path2)
    # return unique uuid
    return jsonify(client_id)


@app.route('/interval', methods=['POST'])
def set_interval():
    # get interval filtered alarm dataframe
    global interval
    interval = json.loads(request.args.get('interval'))
    client_id = request.headers.get('Client-Id')
    alarm = interval_filter(interval, client_id)
    # construct json for frontend
    data = dict()
    data['total_alarm'] = int(alarm.shape[0])
    data['p_count'] = int(alarm[alarm['RCA Result'] == 1]['RCA Result'].count())
    data['c_count'] = int(alarm[alarm['RCA Result'] == 2]['RCA Result'].count())
    data['group_count'] = int(pd.Series(alarm['RCA Group ID']).nunique())
    data['confirmed'] = 0
    data['unconfirmed'] = data['group_count']
    data['group_id'] = alarm['RCA Group ID'].drop_duplicates().tolist()
    return jsonify(data)


@app.route('/reset', methods=['POST'])
def reset_interval():
    global interval
    interval[0] -= 300000
    interval[1] += 300000
    return redirect(url_for('analyze'))


@app.route('/analyze')
def analyze():
    global interval
    client_id = request.headers.get('Client-Id')
    alarm = interval_filter(interval, client_id)
    group_id = request.args.get('groupId')
    alarm = alarm.loc[alarm['RCA Group ID'] == group_id]

    path = []
    for i in set(alarm['Alarm Source']):
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          'topo_format.xlsx'))
        topo = topo.loc[topo['NEName'] == i]
        path.append(set(topo['PathID']))
    res = path[0]
    for i in range(1, len(path)):
        res = res & path[i]

    topo_res = []
    for i in res:
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          'topo_format.xlsx'))
        topo = topo.loc[topo['PathID'] == i]
        per_topo = []
        for j, k in zip(topo['NEName'], topo['NEType']):
            per_topo.append({'NEName': j, 'NEType': k})
        topo_res.append(per_topo)
    # construct json for frontend
    data = dict()
    data['topo'] = topo_res
    data['table'] = alarm.to_json(orient='records')
    return jsonify(data)


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
