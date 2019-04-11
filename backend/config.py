SERVER_HOST = 'localhost'
SERVER_PORT = '8080'

ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}
UPLOAD_FOLDER = 'temp'

ALARM_FILE = 'alarm_format.xlsx'
TOPO_FILE = 'topo_format.xlsx'

ALARM_COLUMNS = ['Alarm Name', 'Alarm Source', 'Vendor', 'First Occurrence',
                 'Last Occurrence', 'Raw Severity', 'Cleared On', 'Domain',
                 'RCA Group ID', 'RCA Result', 'RCA Rule Name']
ALARM_MAPPING = ['AlarmName', 'AlarmSource', 'Vendor', 'First', 'Last', 'Level',
                 'Clear', 'Domain', 'GroupID', 'RCAResult', 'RuleName']

TOPO_COLUMNS = ['PathID', 'NEName', 'Path Hop', 'NEType']
TOPO_MAPPING = ['PathID', 'NEName', 'PathHop', 'NEType']

DISTINCT_NUM = 16

DEBUG = False
