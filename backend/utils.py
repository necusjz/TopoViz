import pandas as pd
import os

from itertools import combinations
from flask import Flask, request
from numpy import nan

app = Flask(__name__, static_url_path='')


def format_data(df):
    if df.shape[1] > app.config['DISTINCT_NUM']:
        # map column name and format raw data
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
        # sort alarms by first occurrence
        df['First'] = pd.to_datetime(df['First'])
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
    if total_num != 0:
        accuracy = 1 - (wrong_num / total_num)
    else:
        accuracy = 1
    return alarm, confirmed_num, accuracy


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


def union_path(path_dict):
    paths = [k for k, v in path_dict.items()]
    for pair in list(combinations(paths, 2)):
        if not path2ne([pair[0]]).isdisjoint(path2ne([pair[1]])):
            path_dict[pair[0]] = path_dict[pair[1]]
    return path_dict


def fill_tree(x_alarm):
    client_id = request.headers.get('Client-Id')
    # get paths union result
    topo_path = list(ne2path(set(x_alarm['AlarmSource'])))
    path_id = [i for i in range(len(topo_path))]
    path_dict = dict(zip(topo_path, path_id))
    path_dict = union_path(path_dict)
    # empty x_alarm column
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    alarm.drop(columns='X_Alarm')
    alarm['X_Alarm'] = nan
    # fill x_alarm column
    ids = [v for k, v in path_dict.items()]
    ids = pd.value_counts(ids)
    for tree_id in ids.index:
        tree = 'TOPO_TREE_' + str(tree_id + 1).zfill(3)
        paths = [k for k, v in path_dict.items() if v == tree_id]
        add_alarm = path2ne(paths) & set(x_alarm['AlarmSource'])
        for ne in add_alarm:
            mask = (alarm['AlarmSource'] == ne) & \
                   (pd.isnull(alarm['GroupId_Edited']))
            alarm.loc[mask, 'X_Alarm'] = tree
    save_data(alarm, client_id)


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
    # decide which case
    if group_id.startswith('TOPO_TREE_'):
        alarm.loc[:, 'RcaResult_Edited'] = 'C'
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


def build_tree(paths):
    # combine paths into tree
    topo_tree = []
    for path in paths:
        # unified format for per path
        topo = path_filter(path)
        topo = topo.sort_values('PathHop', ascending=False)
        per_path = []
        for name, kind in zip(topo['NEName'], topo['NEType']):
            kind = kind.upper()
            per_path.append({'NEName': name,
                             'NEType': app.config['NE_ICON'].get(kind, 'OTHER'),
                             'Layer': app.config['NE_LAYER'].get(kind)})
        topo_tree.append(per_path)
    return topo_tree


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
        if alarm.loc[mask]['GroupId_Edited'].any():
            alarm.loc[mask, 'Confirmed'] = '1'
        else:
            if alarm.loc[mask]['X_Alarm'].any():
                alarm.loc[mask, 'Confirmed'] = '1'
            else:
                alarm.loc[mask, 'Confirmed'] = nan
    save_data(alarm, client_id)


def get_expand(pre_alarm, cur_alarm):
    # get previous status
    group_id = request.args.get('groupId')
    topo_path = ne2path(set(pre_alarm['AlarmSource']))
    topo_ne = path2ne(topo_path)
    # check intersection and update topo, table
    yellow_ne = []
    if not cur_alarm.loc[cur_alarm['GroupId_Edited'] != group_id].empty:
        cur_alarm = cur_alarm.loc[cur_alarm['GroupId_Edited'] != group_id]
        add_path = ne2path(set(cur_alarm['AlarmSource']))
        add_alarm = set()
        for path in add_path:
            add_ne = path2ne([path])
            if add_ne & topo_ne:
                topo_path = topo_path | {path}
                add_alarm = add_alarm | (add_ne & set(cur_alarm['AlarmSource']))
        yellow_ne = list(add_alarm)
        for ne in add_alarm:
            extra_alarm = cur_alarm.loc[cur_alarm['AlarmSource'] == ne]
            if not extra_alarm['GroupId_Edited'].any():
                extra_alarm.loc[:, 'RcaResult_Edited'] = 'C'
            pre_alarm = pre_alarm.append(extra_alarm, ignore_index=True)
    topo_tree = build_tree(topo_path)
    return yellow_ne, topo_tree, pre_alarm


def get_detail(column):
    client_id = request.headers.get('Client-Id')
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    # initialize variables
    wrong = []
    confirmed_group = []
    unconfirmed_group = []
    for item in set(alarm[column].dropna()):
        mask = alarm[column] == item
        if alarm.loc[mask].shape[0] == alarm.loc[mask]['Confirmed'].count():
            confirmed_group.append(item)
            # get wrong groups
            pre_alarm = alarm.loc[mask][app.config['EDITED_COLUMNS']]
            cur_alarm = alarm.loc[mask][list(map(lambda x: x + '_Edited',
                                                 app.config['EDITED_COLUMNS']))]
            cur_alarm.columns = app.config['EDITED_COLUMNS']
            if not pre_alarm.equals(cur_alarm):
                wrong.append(item)
        else:
            unconfirmed_group.append(item)
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
