SERVER_HOST = '0.0.0.0'
SERVER_PORT = '8080'

UPLOAD_FOLDER = 'temp'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

TOPO_FILE = 'topo_format.xlsx'
ALARM_FILE = 'alarm_format.xlsx'

TOPO_COLUMNS = ['PathID', 'NEName', 'Path Hop', 'NEType']
TOPO_MAPPING = ['PathId', 'NEName', 'PathHop', 'NEType']

ALARM_COLUMNS = ['Alarm Name', 'Alarm Source', 'Vendor', 'First Occurrence',
                 'Last Occurrence', 'Raw Severity', 'Cleared On', 'Domain',
                 'RCA Group ID', 'RCA Result', 'RCA Rule Name']
ALARM_MAPPING = ['AlarmName', 'AlarmSource', 'Vendor', 'First', 'Last',
                 'Level', 'Clear', 'Domain', 'GroupId', 'RcaResult', 'RuleName']

DISTINCT_NUM = 16

DEBUG = False
