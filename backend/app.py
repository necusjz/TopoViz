#!/usr/bin/env python
# -*- coding: utf-8 -*-

import shutil
import uuid
import time
import json

from flask import render_template, send_from_directory
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
    # create folder and process files
    client_id = str(uuid.uuid1())
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], client_id))
    file_list = [file1, file2]
    process_file(file_list, client_id)
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


@app.route('/switch', methods=['GET'])
def switch():
    x_alarm = request.args.get('xAlarm')
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # determine which case
    mask = False
    if x_alarm == 'false':
        mask = pd.notnull(alarm['GroupId_Edited'])
    elif x_alarm == 'true':
        mask = pd.isnull(alarm['GroupId_Edited'])
        fill_tree(alarm)
    alarm = alarm.loc[mask]
    # construct json for frontend
    res = dict()
    res['start'] = pd.to_datetime(alarm['First'].min()).timestamp()
    res['end'] = pd.to_datetime(alarm['First'].max()).timestamp()
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
        res['group_id'] = list(alarm['GroupId_Edited'].drop_duplicates()
                                                      .dropna())
    elif x_alarm == 'true':
        alarm = alarm.sort_values('X_Alarm')
        res['group_id'] = list(alarm['X_Alarm'].drop_duplicates()
                                               .dropna())
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


@app.route('/confirm', methods=['POST'])
def confirm():
    # save confirmed data
    client_id = request.headers.get('Client-Id')
    save_edit(client_id)
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


@app.route('/expand', methods=['GET'])
def expand():
    group_id = request.args.get('groupId')
    add_time = int(request.args.get('addTime'))
    pre_alarm = group_filter(group_id)
    # get interval filtered dataframe
    a_time = datetime.fromtimestamp(pd.to_datetime(pre_alarm['First'].min())
                                    .timestamp() - add_time * 60 - 8 * 60 * 60)
    z_time = datetime.fromtimestamp(pd.to_datetime(pre_alarm['First'].max())
                                    .timestamp() + add_time * 60 - 8 * 60 * 60)
    cur_alarm = interval_limit(a_time, z_time)
    # get expand information
    yellow_ne, topo_tree, expand_alarm = get_expand(pre_alarm, cur_alarm)
    # construct json for frontend
    res = dict()
    res['yellow'] = yellow_ne
    res['topo'] = topo_tree
    res['table'] = json.loads(expand_alarm.to_json(orient='records'))
    return jsonify(res)


@app.route('/detail', methods=['GET'])
def detail():
    x_alarm = request.args.get('xAlarm')
    # get wrong and confirmed/unconfirmed groups
    column = 'GroupId_Edited'
    if x_alarm == 'true':
        column = 'X_Alarm'
    wrong, confirmed_group, unconfirmed_group = get_detail(column)
    # construct json for frontend
    res = dict()
    res['wrong'] = wrong
    res['confirmed'] = confirmed_group
    res['unconfirmed'] = unconfirmed_group
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


@app.route('/checkId', methods=['GET'])
def check_id():
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # get current/previous group id
    cur_id = {request.args.get('curId')}
    pre_id = set(alarm['GroupId_Edited'].dropna())
    # construct json for frontend
    res = dict()
    res['exist'] = False
    if cur_id & pre_id:
        res['exist'] = True
    return jsonify(res)


@app.route('/oneClick', methods=['POST'])
def one_click():
    x_alarm = request.args.get('xAlarm')
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # confirm masked alarms
    mask = pd.notnull(alarm['GroupId_Edited'])
    if x_alarm == 'true':
        mask = pd.notnull(alarm['X_Alarm'])
    alarm.loc[mask, 'Confirmed'] = '1'
    save_data(alarm, client_id)
    # construct json for frontend
    res = dict()
    alarm, confirmed_num, accuracy = result_monitor(client_id)
    group_count = len(set(alarm['GroupId_Edited'].dropna()))
    res['accuracy'] = accuracy
    res['confirmed'] = confirmed_num
    res['unconfirmed'] = group_count - confirmed_num
    return jsonify(res)


@app.route('/cleanUp', methods=['POST'])
def clean_up():
    client_id = request.json['clientId']
    # clean up previous directory
    if client_id:
        dirpath = os.path.join(app.config['UPLOAD_FOLDER'], client_id)
        shutil.rmtree(dirpath)
    # construct json for frontend
    res = dict()
    res['code'] = 200
    res['message'] = 'CLEAN UP SUCCESSFULLY'
    return jsonify(res), 200


@app.errorhandler(500)
def error_500(exception):
    # construct json for frontend
    error = dict()
    error['code'] = 500
    error['message'] = '500 INTERNAL SERVER ERROR'
    return jsonify(error), 500
