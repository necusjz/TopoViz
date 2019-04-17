#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pandas as pd
import uuid
import time
import json
import os

from flask import Flask, request, render_template, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object('config')
CORS(app, resources=r'/*')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in \
           app.config['ALLOWED_EXTENSIONS']


def format_data(df):
    if df.shape[1] > app.config['DISTINCT_NUM']:
        # format raw data and map column name
        df = df[app.config['ALARM_COLUMNS']]
        df.columns = app.config['ALARM_MAPPING']
        df = df.replace({'RcaResult': {1: 'P', 2: 'C'}})
        # add new columns
        df_index = range(0, df.shape[0])
        df.insert(0, 'Index', df_index)
        df.insert(df.shape[1], 'GroupId_Edited', df['GroupId'])
        df.insert(df.shape[1], 'RcaResult_Edited', df['RcaResult'])
        df.insert(df.shape[1], 'RuleName_Edited', df['RuleName'])
        df['Confirmed'] = ''
        # sort by first occurrence
        df = df.sort_values('First')
    else:
        df = df[app.config['TOPO_COLUMNS']]
        df.columns = app.config['TOPO_MAPPING']
    return df


def save_data(df, client_id):
    if df.shape[1] > app.config['DISTINCT_NUM']:
        path = os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                            app.config['ALARM_FILE'])
    else:
        path = os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                            app.config['TOPO_FILE'])
    df.to_csv(path, index=False)


def interval_filter(start, end):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # convert to datetime and set mask
    alarm['First'] = pd.to_datetime(alarm['First'])
    mask = (alarm['First'] >= start) & (alarm['First'] <= end)
    alarm = alarm.loc[mask]
    return alarm


def group_picker(group_id):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    alarm = alarm.loc[alarm['GroupId'] == group_id]
    return alarm


def find_path(alarms):
    client_id = request.headers.get('Client-Id')
    # get paths for each network element
    ne_path = []
    for alarm in alarms:
        topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                        app.config['TOPO_FILE']))
        topo = topo.loc[topo['NEName'] == alarm]
        ne_path.append(set(topo['PathId']))
    # calculate the topo paths need to be displayed
    topo_path = set()
    for i in range(0, len(ne_path)):
        topo_path = topo_path | ne_path[i]
    return topo_path


def build_tree(paths):
    client_id = request.headers.get('Client-Id')
    topo_tree = []
    for path in paths:
        topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                        app.config['TOPO_FILE']))
        topo = topo.loc[topo['PathId'] == path]
        # unified format for per path
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
    # get upload files
    file1 = request.files['file1']
    file2 = request.files['file2']
    # generate client id and create folder
    client_id = str(uuid.uuid1())
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], client_id))
    # check filename legality
    for file in [file1, file2]:
        if allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # convert excel to dataframe
            if filename.endswith('.xlsx') or filename.endswith('xls'):
                dataframe = pd.read_excel(file)
            else:
                dataframe = pd.read_csv(file)
            # save formatted dataframe
            if 'Confirmed' not in dataframe.columns:
                dataframe = format_data(dataframe)
            save_data(dataframe, client_id)
        # TODO(ICHIGOI7E): exception handling
    # construct json for frontend
    res = dict()
    res['client_id'] = client_id
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    res['start'] = pd.to_datetime(alarm['First'].min()).timestamp()
    res['end'] = pd.to_datetime(alarm['First'].max()).timestamp()
    res['total_alarm'] = alarm.shape[0]
    res['p_count'] = alarm.loc[alarm['RcaResult'] == 'P'].shape[0]
    res['c_count'] = alarm.loc[alarm['RcaResult'] == 'C'].shape[0]
    res['group_count'] = len(set(alarm['GroupId']))
    res['confirmed'] = 0
    res['unconfirmed'] = res['group_count']
    return jsonify(res)


@app.route('/interval')
def interval():
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(int(request.args.get('start')))
    z_time = datetime.fromtimestamp(int(request.args.get('end')))
    alarm = interval_filter(a_time, z_time)
    # construct json for frontend
    res = dict()
    res['group_id'] = list(set(alarm['GroupId']))
    return jsonify(res)


@app.route('/analyze')
def analyze():
    # generate topo tree
    group_id = request.args.get('groupId')
    alarm = group_picker(group_id)
    topo_path = find_path(set(alarm['AlarmSource']))
    topo_tree = build_tree(topo_path)
    # construct json for frontend
    res = dict()
    res['topo'] = topo_tree
    res['table'] = json.loads(alarm.to_json(orient='records'))
    res['orange'] = list(set(alarm['AlarmSource']))
    return jsonify(res)


@app.route('/expand')
def expand():
    # generate topo path
    group_id = request.args.get('groupId')
    alarm = group_picker(group_id)
    topo_path = find_path(set(alarm['AlarmSource']))
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(pd.to_datetime(alarm['First'].min())
                                    .timestamp() - 5 * 60 - 8 * 60 * 60)
    z_time = datetime.fromtimestamp(pd.to_datetime(alarm['First'].max())
                                    .timestamp() + 5 * 60 - 8 * 60 * 60)
    alarm = interval_filter(a_time, z_time)
    # generate topo tree
    extra_path = find_path(set(alarm['AlarmSource']))
    topo_path = topo_path | extra_path
    topo_tree = build_tree(topo_path)
    # construct json for frontend
    res = dict()
    res['topo'] = topo_tree
    res['table'] = json.loads(alarm.to_json(orient='records'))
    alarm = alarm.loc[alarm['GroupId'] != group_id]
    res['yellow'] = list(set(alarm['AlarmSource']))
    return jsonify(res)


@app.route('/confirm', methods=['POST'])
def confirm():
    # get edited information
    req = request.get_json()
    group_id = request.args.get('groupId')
    alarm = group_picker(group_id)
    row_edited = req['row']
    column_edited = req['column']
    value_edited = req['value']
    # store confirmed data
    for row, column, value in zip(row_edited, column_edited, value_edited):
        edited = dict(alarm.iloc[row])
        edited[column + '_Edited'] = value
        edited['Confirmed'] = 1
        alarm.iloc[row] = pd.Series(edited)
    # reload alarm data
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # initialize variables
    accuracy = ''
    confirmed_num = 0
    correct_num = 0
    total_num = len(set(alarm['GroupId']))
    # count the number of confirmed groups and correct groups
    for group_id in set(alarm['GroupId']):
        mask = alarm['GroupId_Edited'] == group_id
        # confirmed groups
        if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
            confirmed_num += 1
        # correct groups
        pre_alarm = alarm.loc[mask][app.config['EDITED_COLUMNS']]
        post_alarm = alarm.loc[mask][list(map(lambda x: x+'_Edited',
                                              app.config['EDITED_COLUMNS']))]
        post_alarm.columns = app.config['EDITED_COLUMNS']
        if pre_alarm.equals(post_alarm):
            correct_num += 1
    # calculate overall accuracy
    if confirmed_num == total_num:
        accuracy = str(correct_num / total_num)
    # construct json for frontend
    res = dict()
    res['accuracy'] = accuracy
    res['total_alarm'] = alarm.shape[0]
    res['p_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'P'].shape[0]
    res['c_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'C'].shape[0]
    res['group_count'] = len(set(alarm['GroupId_Edited']))
    res['confirmed'] = confirmed_num
    res['unconfirmed'] = res['group_count'] - res['confirmed']
    return jsonify(res)


@app.route('/detail')
def detail():
    # reload alarm data
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # get confirmed/unconfirmed groups
    confirmed_group = []
    unconfirmed_group = []
    for group_id in set(alarm['GroupId']):
        mask = alarm['GroupId_Edited'] == group_id
        if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
            confirmed_group.append(group_id)
        else:
            unconfirmed_group.append(group_id)
    # construct json for frontend
    res = dict()
    res['confirmed'] = confirmed_group
    res['unconfirmed'] = unconfirmed_group
    return jsonify(res)


@app.route('/download')
def download():
    # get directory path
    client_id = request.headers.get('Client-Id')
    path = os.path.join(app.config['UPLOAD_FOLDER'], client_id)
    # generate file name
    filename = 'verified_alarm_' + str(int(time.time())) + '_.csv'
    return send_from_directory(path, 'alarm_format.csv',
                               as_attachment=True, attachment_filename=filename)
