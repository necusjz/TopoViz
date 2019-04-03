#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import pandas as pd

from flask import Flask, request, render_template
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
app.config.from_object('config')
CORS(app, resources=r'/*')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in \
           app.config['ALLOWED_EXTENSIONS']


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        file1 = request.files['file1']
        file2 = request.files['file2']
        date = request.form.get('date')
        if file1 and file2 and date and allowed_file(file1.filename) and \
                allowed_file(file2.filename):
            filename1 = secure_filename(file1.filename)
            filename2 = secure_filename(file2.filename)
            file1.save(os.path.join(app.config['UPLOAD_FOLDER'], filename1))
            file2.save(os.path.join(app.config['UPLOAD_FOLDER'], filename2))

        df = []
        if file2.filename.endswith('.csv'):
            df = pd.read_csv(file2)
        elif file2.filename.endswith('.xlsx') or file2.filename.endswith('xls'):
            df = pd.read_excel(file2)

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
    for file in os.listdir(app.config['UPLOAD_FOLDER']):
        if file.endswith('.csv'):
            df = pd.read_csv(app.config['UPLOAD_FOLDER'] + '/' + file, sep=',')
            data = df.describe()
            return data.to_json()
        elif file.endswith('.xlsx') or file.endswith('.xls'):
            df = pd.read_excel(app.config['UPLOAD_FOLDER'] + '/' + file,
                               sep=',')
            data = df.describe()
            return data.to_json()


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
