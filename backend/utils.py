import os
import pandas as pd

from flask import Flask, request

app = Flask(__name__, static_folder='static', static_url_path='')


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
    topo_tree = []
    for path in paths:
        # get elements for per path
        client_id = request.headers.get('Client-Id')
        topo = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], client_id,
                                        app.config['TOPO_FILE']))
        # unified format for per path
        topo = topo.loc[topo['PathId'] == path]
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
