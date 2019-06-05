import pandas as pd
import union_find
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
    client_id = request.headers.get('Client-Id')
    topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                    app.config['TOPO_FILE']))
    # calculate the topo paths need to be displayed
    topo_path = set()
    for alarm in alarms:
        res = topo.loc[topo['NEName'] == alarm]
        topo_path = topo_path | set(res['PathId'])
    return topo_path


def path2ne(paths):
    client_id = request.headers.get('Client-Id')
    topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                    app.config['TOPO_FILE']))
    # convert topo paths to net elements
    ne_set = set()
    for path in paths:
        res = topo.loc[topo['PathId'] == path]
        ne_set = ne_set | set(res['NEName'])
    return ne_set


def pair_path(path_dict):
    res = []
    paths = path_dict.keys()
    # get intersected pairs
    for pair in list(combinations(paths, 2)):
        set1 = set(pair[0])
        set2 = set(pair[1])
        if not set1.isdisjoint(set2):
            res.append((path_dict[pair[0]], path_dict[pair[1]]))
    return res


def fill_tree(x_alarm):
    client_id = request.headers.get('Client-Id')
    topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                    app.config['TOPO_FILE']))
    # generate ne tuple dict
    topo_path = list(ne2path(set(x_alarm['AlarmSource'])))
    path_tuple = []
    for path in topo_path:
        res = topo.loc[topo['PathId'] == path]
        path_tuple.append(tuple(res['NEName']))
    path_id = [i for i in range(len(topo_path))]
    path_dict = dict(zip(path_tuple, path_id))
    pair_list = pair_path(path_dict)
    # do union-find
    uf = union_find.UnionFind(len(topo_path))
    for pair in pair_list:
        path1 = pair[0]
        path2 = pair[1]
        uf.unite(path1, path2)
    uf.id = [uf.find(i) for i in uf.id]
    path_dict = dict(zip(path_tuple, uf.id))
    # empty x_alarm column
    alarm = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                     app.config['ALARM_FILE']))
    alarm.drop(columns='X_Alarm')
    alarm['X_Alarm'] = nan
    # fill x_alarm column
    for tree_id in set(uf.id):
        ne_set = set()
        tree = 'TOPO_TREE_' + str(tree_id + 1).zfill(4)
        net_elements = [k for k, v in path_dict.items() if v == tree_id]
        for ne in net_elements:
            ne_set = ne_set | set(ne)
        add_alarm = ne_set & set(x_alarm['AlarmSource'])
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


def build_tree(paths):
    client_id = request.headers.get('Client-Id')
    topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                    app.config['TOPO_FILE']))
    # combine paths into tree
    topo_tree = []
    for path in paths:
        # unified format for per path
        res = topo.loc[topo['PathId'] == path]
        res = res.sort_values('PathHop', ascending=False)
        per_path = []
        for name, kind in zip(res['NEName'], res['NEType']):
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
