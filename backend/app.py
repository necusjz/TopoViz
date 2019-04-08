#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import uuid
import pandas as pd

from flask import Flask, request, render_template, jsonify, redirect, url_for
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object('config')
CORS(app, resources=r'/*')
interval = dict()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in \
           app.config['ALLOWED_EXTENSIONS']


def save_format(dataframe, path):
    if dataframe.shape[1] < app.config['DISTINCT_NUM']:
        df = dataframe[app.config['TOPO_COLUMNS']]
    else:
        df = dataframe[app.config['ALARM_COLUMNS']]
        df_index = range(1, df.shape[0] + 1)
        df.insert(0, 'Index', df_index)
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


def interval_filter(cur_interval, client_id):
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    a_time = datetime.fromtimestamp(cur_interval[client_id][0])
    z_time = datetime.fromtimestamp(cur_interval[client_id][1])
    alarm['First Occurrence'] = pd.to_datetime(alarm['First Occurrence'])
    mask = (alarm['First Occurrence'] >= a_time) & \
           (alarm['First Occurrence'] <= z_time)
    return alarm.loc[mask]


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
    os.makedirs(os.getcwd() + '/' + app.config['UPLOAD_FOLDER'] +
                '/' + client_id)
    save_path1 = os.path.join(app.config['UPLOAD_FOLDER'] + '/' + client_id +
                              '/' + 'topo_format.xlsx')
    save_path2 = os.path.join(app.config['UPLOAD_FOLDER'] + '/' + client_id +
                              '/' + 'alarm_format.xlsx')
    # check filename and save file
    check_file(file1, save_path1)
    check_file(file2, save_path2)
    # construct json for frontend
    alarm = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                       'alarm_format.xlsx'))
    data = dict()
    data['client_id'] = client_id
    data['start'] = pd.to_datetime(alarm['First Occurrence'].min()).timestamp()
    data['end'] = pd.to_datetime(alarm['First Occurrence'].max()).timestamp()
    return jsonify(data)


@app.route('/interval')
def set_interval():
    # save current client interval
    global interval
    client_id = request.headers.get('Client-Id')
    interval_ = list()
    interval_.append(int(request.args.get('start')))
    interval_.append(int(request.args.get('end')))
    interval[client_id] = interval_
    # get interval filtered dataframe
    alarm = interval_filter(interval, client_id)
    # construct json for frontend
    data = dict()
    data['total_alarm'] = alarm.shape[0]
    data['p_count'] = alarm.loc[alarm['RCA Result'] == 1].shape[0]
    data['c_count'] = alarm.loc[alarm['RCA Result'] == 2].shape[0]
    data['group_count'] = len(set(alarm['RCA Group ID']))
    data['confirmed'] = 0
    data['unconfirmed'] = data['group_count']
    data['group_id'] = list(set(alarm['RCA Group ID']))
    return jsonify(data)


@app.route('/reset')
def reset_interval():
    # reset current client interval
    global interval
    client_id = request.headers.get('Client-Id')
    interval[client_id][0] -= 5 * 60
    interval[client_id][1] += 5 * 60
    return redirect(url_for('analyze'))


@app.route('/revert')
def reset_interval():
    # revert current client interval
    global interval
    client_id = request.headers.get('Client-Id')
    interval[client_id][0] += 5 * 60
    interval[client_id][1] -= 5 * 60
    return redirect(url_for('analyze'))


@app.route('/analyze')
def analyze():
    # get interval filtered dataframe
    global interval
    client_id = request.headers.get('Client-Id')
    alarm = interval_filter(interval, client_id)
    # get group id filtered dataframe
    group_id = request.args.get('groupId')
    alarm = alarm.loc[alarm['RCA Group ID'] == group_id]
    # generate path collection
    ne_path = []
    for i in set(alarm['Alarm Source']):
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          client_id, 'topo_format.xlsx'))
        topo = topo.loc[topo['NEName'] == i]
        ne_path.append(set(topo['PathID']))
    # get topo path
    topo_path = ne_path[0]
    for i in range(1, len(ne_path)):
        topo_path = topo_path & ne_path[i]
    # construct topo tree
    topo_tree = []
    for i in topo_path:
        topo = pd.read_excel(os.path.join(app.config['UPLOAD_FOLDER'],
                                          client_id,'topo_format.xlsx'))
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


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
