import pandas as pd
import os

from flask import Flask, request
from datetime import datetime
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
        df['X_Alarm'] = nan
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
    wrong_num = 0
    confirmed_num = 0
    total_num = len(set(alarm['GroupId_Edited'].dropna()))
    # count the number of confirmed groups
    for group_id in set(alarm['GroupId_Edited'].dropna()):
        mask = alarm['GroupId_Edited'] == group_id
        if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
            confirmed_num += 1
            # count the number of wrong groups
            pre_alarm = alarm.loc[mask][app.config['EDITED_COLUMNS']]
            cur_alarm = alarm.loc[mask][list(map(lambda x: x + '_Edited',
                                                 app.config['EDITED_COLUMNS']))]
            cur_alarm.columns = app.config['EDITED_COLUMNS']
            if not pre_alarm.equals(cur_alarm):
                wrong_num += 1
    # calculate global accuracy
    accuracy = 1 - (wrong_num / total_num)
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
    if group_id.startswith('TOPO_TREE_'):
        alarm = alarm.loc[alarm['X_Alarm'] == group_id]
    else:
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


def sort_path(paths):
    # count the number of each network element
    total_ne = []
    for path in paths:
        topo = path_filter(path)
        total_ne.extend(list(topo['NEName']))
    count_res = pd.value_counts(total_ne)
    # sort by complexity
    path_res = dict()
    for path in paths:
        complexity = 0
        topo = path_filter(path)
        for ne in list(topo['NEName']):
            complexity += count_res.loc[ne]
        path_res[path] = complexity
    res = sorted(path_res.items(), key=lambda item: item[1], reverse=True)
    res = list(map(lambda x: [x[0]], res))
    return res


def merge_path(paths, merge_res):
    # exit
    if len(paths) == 1:
        merge_res.append(paths[0])
        return merge_res
    # recursive merge path
    ne_set = path2ne(paths[0])
    for i in range(1, len(paths)):
        if ne_set & path2ne(paths[i]):
            paths[0].extend(paths[i])
            paths.remove(paths[i])
            return merge_path(paths, merge_res)
    merge_res.append(paths[0])
    paths.remove(paths[0])
    return merge_path(paths, merge_res)


def build_tree(paths):
    # combine paths into tree
    topo_tree = []
    for path in paths:
        # unified format for per path
        topo = path_filter(path)
        topo = topo.sort_values('PathHop', ascending=False)
        per_path = []
        for name, kind in zip(topo['NEName'], topo['NEType']):
            per_path.append({'NEName': name,
                             'NEType': app.config['NE_ICON'].get(kind, 'OTHER'),
                             'Layer': app.config['TOPO_LAYER'].get(kind)})
        topo_tree.append(per_path)
    return topo_tree


def fill_tree(alarm):
    client_id = request.headers.get('Client-Id')
    merge_res = []
    topo_path = ne2path(set(alarm['AlarmSource']))
    serial_path = sort_path(topo_path)
    merge_res = merge_path(serial_path, merge_res)

    alarm.drop(columns='X_Alarm')
    alarm['X_Alarm'] = nan
    for i, paths in enumerate(merge_res):
        tree = 'TOPO_TREE_' + str(i + 1).zfill(3)
        add_alarm = path2ne(paths) & set(alarm['AlarmSource'])
        for ne in add_alarm:
            mask = alarm['AlarmSource'] == ne
            alarm.loc[mask, 'X_Alarm'] = tree
    save_data(alarm, client_id)


def save_edit(client_id):
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # get edited information
    req = request.get_json()
    row_edited = req['row']
    columns_edited = req['columns']
    values_edited = req['values']
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


def get_detail(column):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    wrong = []
    confirmed_group = []
    unconfirmed_group = []
    for i in set(alarm[column].dropna()):
        mask = alarm[column] == i
        if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
            confirmed_group.append(i)
            # get wrong groups
            pre_alarm = alarm.loc[mask][app.config['EDITED_COLUMNS']]
            cur_alarm = alarm.loc[mask][list(map(lambda x: x + '_Edited',
                                                 app.config['EDITED_COLUMNS']))]
            cur_alarm.columns = app.config['EDITED_COLUMNS']
            if not pre_alarm.equals(cur_alarm):
                wrong.append(i)
        else:
            unconfirmed_group.append(i)
    return wrong, confirmed_group, unconfirmed_group


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
