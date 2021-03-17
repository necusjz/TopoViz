# topology-graph
Based on pandas, use Flask + Vue.js to analyze Excel and display topology graph via Canvas. You can synchronize the dist packages from frontend with `synchronize.sh`.
## Dependency
### Python
[Python 3.6.8](https://www.python.org/downloads/release/python-368/) (with pip 19.0.3)

Install Python and check the version like this:

![](https://raw.githubusercontent.com/snlndod/mPOST/master/topology-graph/00.png)
### Install packages
Install some required dependencies for deployment:
```bash
$ pip install -r requirements.txt
```
## How to run
Run Flask application:
```bash
$ git clone git@github.com:was48i/topology-graph.git
$ cd topology-graph/backend
$ flask run
* Running on http://127.0.0.1:5000/
```
Enter the URL in your browser, you can see the page like this:

![](https://raw.githubusercontent.com/snlndod/mPOST/master/topology-graph/01.png)
