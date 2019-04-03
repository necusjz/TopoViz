#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import pandas as pd

from flask import Flask, request, render_template
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object('config')
CORS(app, resources=r'/*')
df = []


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in \
           app.config['ALLOWED_EXTENSIONS']


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload():
    file1 = request.files['file1']
    file2 = request.files['file2']
    date = request.form.get('date')
    if file1 and file2 and date and allowed_file(file1.filename) and \
            allowed_file(file2.filename):
        filename1 = secure_filename(file1.filename)
        filename2 = secure_filename(file2.filename)
        file1.save(os.path.join(app.config['UPLOAD_FOLDER'], filename1))
        file2.save(os.path.join(app.config['UPLOAD_FOLDER'], filename2))

    global df
    if file2.filename.endswith('.csv'):
        df = pd.read_csv(file2)
    elif file2.filename.endswith('.xlsx') or file2.filename.endswith('xls'):
        df = pd.read_excel(file2)

    a_time = datetime.fromtimestamp(date[0])
    z_time = datetime.fromtimestamp(date[1])
    df['First Occurrence'] = pd.to_datetime(df['First Occurrence'])
    mask = (a_time <= df['First Occurrence']) & (df['First Occurrence']
                                                 <= z_time)
    df = df.loc[mask]

    data = dict()
    data['total_alarm'] = int(df.shape[0])
    data['p_count'] = int(df[df['RCA Result'] == 1]['RCA Result'].count())
    data['c_count'] = int(df[df['RCA Result'] == 2]['RCA Result'].count())
    data['group_count'] = int(pd.Series(df['RCA Group ID']).nunique())
    data['confirmed'] = 0
    data['unconfirmed'] = data['group_count']
    data['group_id'] = df['RCA Group ID'].drop_duplicates().tolist()

    return json.dumps(data)


@app.route('/analyze')
def analyze():
    group_id = request.args.get('groupId')
    add_condition = request.args.get('addCondition')
    if add_condition:
        add_value = request.args.get('addValue')
        if add_condition == '0':
            df[df['Domain'] == add_value]
        if add_condition == '1':
            df[df['Alarm Name'] == add_value]
        if add_condition == '2':
            df[df['RCA Rule Name'] == add_value]
        if add_condition == '3':
            df[df['RCA Result'] == add_value]
        if add_condition == '4':
            df[df['RCA Result'] == add_value]
    df[df['RCA Group ID'] == group_id]

    data = dict()
    data['topo'] = []
    data['table'] = df.stack().to_json()

    return json.dump(data)


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
