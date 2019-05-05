import pandas as pd
import os

from flask import Flask, request
from numpy import nan

app = Flask(__name__, static_folder='static', static_url_path='')


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
        df['Confirmed'] = nan
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
    error_num = 0
    confirmed_num = 0
    total_num = len(set(alarm['GroupId_Edited'].dropna()))
    # count the number of confirmed groups
    for group_id in set(alarm['GroupId_Edited'].dropna()):
        mask = alarm['GroupId_Edited'] == group_id
        if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
            confirmed_num += 1
            # count the number of correct groups
            pre_alarm = alarm.loc[mask][app.config['EDITED_COLUMNS']]
            cur_alarm = alarm.loc[mask][list(map(lambda x: x + '_Edited',
                                                 app.config['EDITED_COLUMNS']))]
            cur_alarm.columns = app.config['EDITED_COLUMNS']
            if not pre_alarm.equals(cur_alarm):
                error_num += 1
    # calculate global accuracy
    accuracy = 1 - (error_num / total_num)
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


def path_filter(path):
    client_id = request.headers.get('Client-Id')
    topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                    app.config['TOPO_FILE']))
    topo = topo.loc[topo['PathId'] == path]
    return topo


def ne2path(alarms):
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


def path2ne(paths):
    ne_set = set()
    for path in paths:
        topo = path_filter(path)
        ne_set = ne_set | set(topo['NEName'])
    return ne_set


def build_tree(paths):
    # combine paths into tree
    topo_tree = []
    for path in paths:
        # unified format for per path
        topo = path_filter(path)
        per_path = []
        for ne_name, ne_type in zip(topo['NEName'], topo['NEType']):
            per_path.append({'NEName': ne_name, 'NEType': ne_type})
        topo_tree.append(per_path)
    return topo_tree


def check_column(df):
    try:
        if df.shape[1] > app.config['DISTINCT_NUM']:
            if 'Confirmed' not in df.columns:
                df[app.config['ALARM_COLUMNS']]
            else:
                df[app.config['ALARM_MAPPING']]
        else:
            df[app.config['TOPO_COLUMNS']]
    # catch key error
    except KeyError:
        error = dict()
        error['code'] = 400
        error['message'] = 'Column name does not match.'
        return error
    else:
        return False


def check_type(types):
    try:
        if not types[0] ^ types[1]:
            raise TypeError()
    # catch type error
    except TypeError:
        error = dict()
        error['code'] = 400
        error['message'] = 'File type does not match.'
        return error
    else:
        return False
