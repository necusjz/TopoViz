DISTINCT_NUM = 8

UPLOAD_FOLDER = 'temp'

EDITED_COLUMNS = ['GroupId', 'RcaResult', 'RuleName']

TOPO_FILE = 'topo_format.csv'
ALARM_FILE = 'alarm_format.csv'

TOPO_COLUMNS = ['PathID', 'NEName', 'Path Hop', 'NEType']
TOPO_MAPPING = ['PathId', 'NEName', 'PathHop', 'NEType']

ALARM_COLUMNS = ['Alarm Name', 'Alarm Source', 'Vendor', 'First Occurrence',
                 'Last Occurrence', 'Raw Severity', 'Cleared On', 'Domain',
                 'RCA Group ID', 'RCA Result', 'RCA Rule Name']
ALARM_MAPPING = ['AlarmName', 'AlarmSource', 'Vendor', 'First', 'Last',
                 'Level', 'Clear', 'Domain', 'GroupId', 'RcaResult', 'RuleName']

NE_ICON = {'nodeB': 'BTS', 'BTS': 'BTS', 'E Node': 'BTS', 'MicroWave': 'MW',
           'ATN': 'ATN', 'Router': 'ATN', 'BSC': 'BSC', 'RNC': 'RNC'}
NE_LAYER = {'nodeB': 0, 'BTS': 0, 'E Node': 0, 'MicroWave': 1, 'ATN': 2,
            'Router': 2, 'BSC': 3, 'RNC': 3}
