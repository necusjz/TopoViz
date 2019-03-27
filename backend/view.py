#!/usr/bin/python
# -*- coding: utf-8 -*-

from flask import Flask, redirect

app = Flask(__name__)

# read config file
app.config.from_object('config')

# upload excel file
@app.route('/', methods=['GET', 'POST'])
def index():
    return redirect('/index.html')

if __name__ == '__main__':
    app.run(host=app.config['SERVER_HOST'], port=app.config['SERVER_PORT'])