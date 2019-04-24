# TopoViewer
Flask + Vue.js to analyze Excel data based on pandas, and display topology map using Canvas. You can synchronize dist package from frontend with `TopoViewer/sync.sh`, and the fake Excel data is in `TopoViewer/topo_alarm`.
## Dependencies
### Python
[Python 3.6.8](https://www.python.org/downloads/release/python-368/) (with pip 19.0.3)

Install Python and check the version like this:

![](https://raw.githubusercontent.com/ICHIGOI7E/mdpics/master/TopoViewer/1.jpeg)
### Install packages
Install some required dependencies for deployment:
```
$ pip install -r requirements.txt
```
## How to run
Run Flask application:
```
$ git clone git@github.com:ICHIGOI7E/TopoViewer.git
$ cd TopoViewer/backend
$ flask run
* Running on http://127.0.0.1:5000/
```
Enter the URL in your browser, you can see the page like this:

![](https://raw.githubusercontent.com/ICHIGOI7E/mdpics/master/TopoViewer/2.jpeg)
