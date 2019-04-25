#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pandas as pd
import uuid
import time
import json
import os

from flask import Flask, render_template, jsonify, request, send_from_directory
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


def result_monitor(client_id):
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # initialize variables
    accuracy = 0
    confirmed_num = 0
    correct_num = 0
    total_num = len(set(alarm['GroupId']))
    # count the number of confirmed groups
    for group_id in set(alarm['GroupId']):
        mask = alarm['GroupId_Edited'] == group_id
        if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
            confirmed_num += 1
            # count the number of correct groups
            pre_alarm = alarm.loc[mask][app.config['EDITED_COLUMNS']]
            pst_alarm = alarm.loc[mask][list(map(lambda x: x + '_Edited',
                                                 app.config['EDITED_COLUMNS']))]
            pst_alarm.columns = app.config['EDITED_COLUMNS']
            if pre_alarm.equals(pst_alarm):
                correct_num += 1
    # calculate global accuracy
    if confirmed_num == total_num:
        accuracy = correct_num / total_num
    return alarm, confirmed_num, accuracy


def interval_limit(start, end):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # convert to datetime and set mask
    alarm['First'] = pd.to_datetime(alarm['First'])
    mask = (alarm['First'] >= start) & (alarm['First'] <= end)
    alarm = alarm.loc[mask]
    return alarm


def group_filter(group_id):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    alarm = alarm.loc[alarm['GroupId_Edited'] == group_id]
    return alarm


def find_path(alarms):
    # get paths for each network element
    ne_path = []
    for alarm in alarms:
        client_id = request.headers.get('Client-Id')
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
    total_element = []
    total_edge = []
    for path in paths:
        element = []
        # get elements for per path
        client_id = request.headers.get('Client-Id')
        topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                        app.config['TOPO_FILE']))
        topo = topo.loc[topo['PathId'] == path]
        for ne_name, ne_type in zip(topo['NEName'], topo['NEType']):
            element.append({'NEName': ne_name, 'NEType': ne_type})
        # add elements to total
        total_element.extend(element)
        # get edges according to elements
        for i in range(0, len(element) - 1):
            edge = dict()
            edge['from'] = element[i]['NEName']
            edge['to'] = element[i+1]['NEName']
            total_edge.append(edge)
    # deduplication for elements and edges
    elements = unique_dict(total_element)
    edges = unique_dict(total_edge)
    return elements, edges


def unique_dict(dicts):
    seen = set()
    unique = []
    # deduplication
    for d in dicts:
        t = tuple(d.items())
        if t not in seen:
            seen.add(t)
            unique.append(d)
    return unique


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
    f_type = []
    for file in [file1, file2]:
        # check filename legality
        if allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # convert excel to dataframe
            if filename.endswith('.xlsx') or filename.endswith('xls'):
                dataframe = pd.read_excel(file)
            else:
                dataframe = pd.read_csv(file)
            # handling column name exception
            try:
                if dataframe.shape[1] < app.config['DISTINCT_NUM']:
                    dataframe[app.config['TOPO_COLUMNS']]
                else:
                    dataframe[app.config['ALARM_COLUMNS']]
            except KeyError:
                error = dict()
                error['code'] = 400
                error['message'] = 'Column name does not match.'
                return jsonify(error), 400
            # save formatted dataframe
            if 'Confirmed' not in dataframe.columns:
                dataframe = format_data(dataframe)
            save_data(dataframe, client_id)
            # store file types by flag
            f_flag = dataframe.shape[1] < app.config['DISTINCT_NUM']
            f_type.append(f_flag)
    # handling file type exception
    try:
        if not f_type[0] ^ f_type[1]:
            raise TypeError()
    except TypeError:
        error = dict()
        error['code'] = 400
        error['message'] = 'File type does not match.'
        return jsonify(error), 400
    # construct json for frontend
    res = dict()
    res['client_id'] = client_id
    alarm, confirmed_num, accuracy = result_monitor(client_id)
    res['start'] = pd.to_datetime(alarm['First'].min()).timestamp()
    res['end'] = pd.to_datetime(alarm['First'].max()).timestamp()
    res['accuracy'] = accuracy
    res['total_alarm'] = alarm.shape[0]
    res['p_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'P'].shape[0]
    res['c_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'C'].shape[0]
    res['group_count'] = len(set(alarm['GroupId_Edited'].dropna()))
    res['confirmed'] = confirmed_num
    res['unconfirmed'] = res['group_count'] - res['confirmed']
    return jsonify(res)


@app.route('/interval', methods=['GET'])
def interval():
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(int(request.args.get('start')))
    z_time = datetime.fromtimestamp(int(request.args.get('end')))
    alarm = interval_limit(a_time, z_time)
    # construct json for frontend
    res = dict()
    res['group_id'] = list(set(alarm['GroupId']))
    return jsonify(res)


@app.route('/analyze', methods=['GET'])
def analyze():
    # generate topo tree
    group_id = request.args.get('groupId')
    alarm = group_filter(group_id)
    topo_path = find_path(set(alarm['AlarmSource']))
    elements, edges = build_tree(topo_path)
    # construct json for frontend
    res = dict()
    res['elements'] = elements
    res['edges'] = edges
    res['table'] = json.loads(alarm.to_json(orient='records'))
    res['orange'] = list(set(alarm['AlarmSource']))
    return jsonify(res)


@app.route('/expand', methods=['GET'])
def expand():
    # generate topo path
    group_id = request.args.get('groupId')
    alarm = group_filter(group_id)
    topo_path = find_path(set(alarm['AlarmSource']))
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(pd.to_datetime(alarm['First'].min())
                                    .timestamp() - 5 * 60 - 8 * 60 * 60)
    z_time = datetime.fromtimestamp(pd.to_datetime(alarm['First'].max())
                                    .timestamp() + 5 * 60 - 8 * 60 * 60)
    alarm = interval_limit(a_time, z_time)
    # generate topo tree
    extra_path = find_path(set(alarm['AlarmSource']))
    topo_path = topo_path | extra_path
    elements, edges = build_tree(topo_path)
    # construct json for frontend
    res = dict()
    res['elements'] = elements
    res['edges'] = edges
    res['table'] = json.loads(alarm.to_json(orient='records'))
    alarm = alarm.loc[alarm['GroupId'] != group_id]
    res['yellow'] = list(set(alarm['AlarmSource']))
    return jsonify(res)


@app.route('/confirm', methods=['POST'])
def confirm():
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # get edited information
    req = request.get_json()
    row_edited = req['row']
    columns_edited = req['columns']
    values_edited = req['values']
    # save confirmed data
    for row, columns, values in zip(row_edited, columns_edited, values_edited):
        mask = alarm['Index'] == row
        # edit each row
        for column, value in zip(columns, values):
            alarm.loc[mask, column] = value
        # fill confirmed field
        if alarm.loc[mask, 'GroupId_Edited'].any():
            alarm.loc[mask, 'Confirmed'] = '1'
        else:
            alarm.loc[mask, 'Confirmed'] = ''
    save_data(alarm, client_id)
    # construct json for frontend
    res = dict()
    alarm, confirmed_num, accuracy = result_monitor(client_id)
    res['accuracy'] = accuracy
    res['total_alarm'] = alarm.shape[0]
    res['p_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'P'].shape[0]
    res['c_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'C'].shape[0]
    res['group_count'] = len(set(alarm['GroupId_Edited'].dropna()))
    res['confirmed'] = confirmed_num
    res['unconfirmed'] = res['group_count'] - res['confirmed']
    return jsonify(res)


@app.route('/detail', methods=['GET'])
def detail():
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


@app.route('/download', methods=['GET'])
def download():
    # get directory path
    client_id = request.args.get('clientId')
    dirpath = os.path.join(app.config['UPLOAD_FOLDER'], client_id)
    # generate file name
    filename = 'verified_alarm_' + str(int(time.time())) + '.csv'
    return send_from_directory(dirpath, 'alarm_format.csv', as_attachment=True,
                               attachment_filename=filename)


# TODO(ICHIGOI7E): For clean up the cache.
@app.route('/clean', methods=['POST'])
def clean():
    pass


@app.errorhandler(404)
def error_404(exception):
    # construct json for frontend
    error = dict()
    error['code'] = 404
    error['message'] = 'NOT FOUND'
    return jsonify(error), 404


@app.errorhandler(500)
def error_500(exception):
    # construct json for frontend
    error = dict()
    error['code'] = 500
    error['message'] = 'INTERNAL SERVER ERROR'
    return jsonify(error), 500
