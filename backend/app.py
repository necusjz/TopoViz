#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import pandas as pd
import json
import json2html
from flask import Flask, request, redirect, url_for, render_template
from werkzeug import secure_filename
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object('config')
CORS(app, resources=r'/*')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        file1 = request.files('file1')
        file2 = request.files('file2')
        date = request.form.get('date')
        if file1 and file2 and date and allowed_file(file1.filename) and allowed_file(file2.filename):
            filename1 = secure_filename(file1.filename)
            filename2 = secure_filename(file2.filename)
            file1.save(os.path.join(app.config['UPLOAD_FOLDER'], filename1))
            file2.save(os.path.join(app.config['UPLOAD_FOLDER'], filename2))
            return redirect(url_for('analyze'))
    return render_template('index.html')


@app.route("/analyze")
def analyze():
    for excel in os.listdir('./flask_upload'):
        if excel.endswith(".csv"):
            df = pd.read_csv("flask_upload" + "\\" + excel, sep=",")
            data = df.describe()
            os.remove("flask_upload" + "\\" + excel)
            return data.to_html()
        elif excel.endswith(".xlsx") or excel.endswith(".xls"):
            df = pd.read_excel("C:\Users\windows 7\Desktop\Flask_Upload" + "\\" + file,sep=",")
            data = df.describe()
            os.remove("C:\Users\windows 7\Desktop\Flask_Upload" + "\\" + file)
            return data.to_html()


@app.route('/post/excel', methods=['POST'])
def postExcel():
    file1 = request.files.get('file1')
    file2 = request.files.get('file2')
    date = request.form.get('date')
    # file1.save('aa.doc') 保存文件
    return json.dumps({'data': '1'})


if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
