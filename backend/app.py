#!/usr/bin/env python
# -*- coding: utf-8 -*-

import shutil
import uuid
import time
import json

from flask import render_template, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS
from utils import *

app.config.from_object('config')
CORS(app, resources=r'/*')


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
        filename = secure_filename(file.filename)
        # convert excel to dataframe
        if filename.endswith('.xlsx') or filename.endswith('xls'):
            dataframe = pd.read_excel(file)
        else:
            dataframe = pd.read_csv(file)
        # handling column name exception
        if check_column(dataframe):
            error = check_column(dataframe)
            return jsonify(error), 400
        # save formatted dataframe
        if 'Confirmed' not in dataframe.columns:
            dataframe = format_data(dataframe)
        save_data(dataframe, client_id)
        # store file types by flag
        f_flag = dataframe.shape[1] < app.config['DISTINCT_NUM']
        f_type.append(f_flag)
    # handling file type exception
    if check_type(f_type):
        error = check_type(f_type)
        return jsonify(error), 400
    # construct json for frontend
    res = dict()
    res['client_id'] = client_id
    alarm, confirmed_num, accuracy = result_monitor(client_id)
    res['accuracy'] = accuracy
    res['total_alarm'] = alarm.shape[0]
    res['p_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'P'].shape[0]
    res['c_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'C'].shape[0]
    res['x_count'] = res['total_alarm'] - res['p_count'] - res['c_count']
    res['group_count'] = len(set(alarm['GroupId_Edited'].dropna()))
    res['confirmed'] = confirmed_num
    res['unconfirmed'] = res['group_count'] - res['confirmed']
    return jsonify(res)


@app.route('/interval', methods=['GET'])
def interval():
    x_alarm = request.args.get('xAlarm')
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(int(request.args.get('start')))
    z_time = datetime.fromtimestamp(int(request.args.get('end')))
    alarm = interval_limit(a_time, z_time)
    # construct json for frontend
    res = dict()
    if x_alarm == 'false':
        res['group_id'] = list(set(alarm['GroupId_Edited'].dropna()))
    elif x_alarm == 'true':
        mask = alarm['XAlarm'].str.contains('TOPO_TREE_', na=False)
        res['group_id'] = list(set(alarm.loc[mask]))
    return jsonify(res)


@app.route('/analyze', methods=['GET'])
def analyze():
    # generate topo tree
    group_id = request.args.get('groupId')
    alarm = group_filter(group_id)
    topo_path = ne2path(set(alarm['AlarmSource']))
    topo_tree = build_tree(topo_path)
    # construct json for frontend
    res = dict()
    res['topo'] = topo_tree
    res['table'] = json.loads(alarm.to_json(orient='records'))
    res['orange'] = list(set(alarm['AlarmSource']))
    return jsonify(res)


@app.route('/expand', methods=['GET'])
def expand():
    # generate topo path
    group_id = request.args.get('groupId')
    add_time = int(request.args.get('addTime'))
    pre_alarm = group_filter(group_id)
    topo_path = ne2path(set(pre_alarm['AlarmSource']))
    topo_ne = path2ne(topo_path)
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(pd.to_datetime(pre_alarm['First'].min())
                                    .timestamp() - add_time * 60 - 8 * 60 * 60)
    z_time = datetime.fromtimestamp(pd.to_datetime(pre_alarm['First'].max())
                                    .timestamp() + add_time * 60 - 8 * 60 * 60)
    alarm = interval_limit(a_time, z_time)
    # check intersection and update topo, table
    res = dict()
    res['yellow'] = []
    if not alarm.loc[alarm['GroupId_Edited'] != group_id].empty:
        alarm = alarm.loc[alarm['GroupId_Edited'] != group_id]
        add_path = ne2path(set(alarm['AlarmSource']))
        add_alarm = set()
        for path in add_path:
            add_ne = path2ne({path})
            if add_ne & topo_ne:
                topo_path = topo_path | {path}
                add_alarm = add_alarm | (add_ne & set(alarm['AlarmSource']))
        # construct json for frontend
        res['yellow'] = list(add_alarm)
        for ne in add_alarm:
            cur_alarm = alarm.loc[alarm['AlarmSource'] == ne]
            pre_alarm = pre_alarm.append(cur_alarm, ignore_index=True)
    topo_tree = build_tree(topo_path)
    res['topo'] = topo_tree
    res['table'] = json.loads(pre_alarm.to_json(orient='records'))
    return jsonify(res)


@app.route('/switch', methods=['GET'])
def switch():
    x_alarm = request.args.get('xAlarm')
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))

    if x_alarm == 'false':
        mask = pd.notnull(alarm['GroupId_Edited'])
        alarm = alarm.loc[mask]
    elif x_alarm == 'true':
        mask = pd.isnull(alarm['GroupId_Edited'])
        alarm = alarm.loc[mask]
        update_tree(alarm)

    res = dict()
    res['start'] = pd.to_datetime(alarm['First'].min()).timestamp()
    res['end'] = pd.to_datetime(alarm['First'].max()).timestamp()
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
            alarm.loc[mask, 'Confirmed'] = nan
    save_data(alarm, client_id)
    # construct json for frontend
    res = dict()
    alarm, confirmed_num, accuracy = result_monitor(client_id)
    res['accuracy'] = accuracy
    res['total_alarm'] = alarm.shape[0]
    res['p_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'P'].shape[0]
    res['c_count'] = alarm.loc[alarm['RcaResult_Edited'] == 'C'].shape[0]
    res['x_count'] = res['total_alarm'] - res['p_count'] - res['c_count']
    res['group_count'] = len(set(alarm['GroupId_Edited'].dropna()))
    res['confirmed'] = confirmed_num
    res['unconfirmed'] = res['group_count'] - res['confirmed']
    return jsonify(res)


@app.route('/detail', methods=['GET'])
def detail():
    x_alarm = request.args.get('xAlarm')
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # get confirmed/unconfirmed groups
    wrong_group = []
    confirmed_group = []
    unconfirmed_group = []
    alarm_tree = []
    if x_alarm == 'false':
        for group_id in set(alarm['GroupId_Edited'].dropna()):
            mask = alarm['GroupId_Edited'] == group_id
            if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
                confirmed_group.append(group_id)
                # get wrong groups
                pre_alarm = alarm.loc[mask][app.config['EDITED_COLUMNS']]
                cur_alarm = alarm.loc[mask][list(map(lambda x: x + '_Edited',
                                                 app.config['EDITED_COLUMNS']))]
                cur_alarm.columns = app.config['EDITED_COLUMNS']
                if not pre_alarm.equals(cur_alarm):
                    wrong_group.append(group_id)
            else:
                unconfirmed_group.append(group_id)
    elif x_alarm == 'true':
        pass
    # construct json for frontend
    res = dict()
    res['wrong'] = wrong_group
    res['confirmed'] = confirmed_group
    res['unconfirmed'] = unconfirmed_group
    res['alarm_tree'] = alarm_tree
    return jsonify(res)


@app.route('/download', methods=['GET'])
def download():
    # get directory path
    client_id = request.args.get('clientId')
    dirpath = os.path.join(app.config['UPLOAD_FOLDER'], client_id)
    # generate file name
    filename = 'alarm-verified-' + str(int(time.time())) + '.csv'
    return send_from_directory(dirpath, 'alarm_format.csv', as_attachment=True,
                               attachment_filename=filename)


@app.route('/clean', methods=['POST'])
def clean():
    for dirname in os.listdir(app.config['UPLOAD_FOLDER']):
        # get directory path
        dirpath = os.path.join(app.config['UPLOAD_FOLDER'], dirname)
        # clean up cache regularly
        diff = time.time() - os.path.getmtime(dirpath)
        if diff > 7 * 24 * 60 * 60:
            shutil.rmtree(dirpath)


@app.errorhandler(500)
def error_500(exception):
    # construct json for frontend
    error = dict()
    error['code'] = 500
    error['message'] = '500 INTERNAL SERVER ERROR'
    return jsonify(error), 500
