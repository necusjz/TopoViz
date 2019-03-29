#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request
# 解决跨域问题
from flask_cors import CORS
import json

app = Flask(__name__, static_folder='static', static_url_path='')

# read config file
app.config.from_object('config')

CORS(app, resources=r'/*')

# return homepage
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/post/excel', methods=['POST'])
def postExcel():
    file1 = request.files.get('file1')
    file2 = request.files.get('file2')
    date = request.form.get('date')
    # file1.save('aa.doc') 保存文件
    return json.dumps({'data': '1'})

if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])
