# TopoViewer
Flask + Vue.js to analyze Excel data based on pandas. Using `TopoViewer/sync.sh` you can synchronize dist package from frontend, and the fake Excel data is in `TopoViewer/topo_alarm`.
## Dependencies
### Python
[Python 3.6.8](https://www.python.org/downloads/release/python-368/) (with pip 19.0.3)

Install Python and check the versions like this:

![](https://raw.githubusercontent.com/ICHIGOI7E/mdpics/master/TopoViewer/1.jpeg)
### Install packages
Install some required dependencies for server deployment (`TopoViewer/backend/requirements.txt`).
```
$ pip install -r requirements.txt
```
## How to run
Run Flask application:
```
$ ./app.py
```
