#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import pandas as pd

from flask import Flask, request, redirect, url_for, render_template
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
            return redirect(url_for('analyze'))
    return render_template('index.html')


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
