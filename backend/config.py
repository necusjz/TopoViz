DISTINCT_NUM = 10

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

NE_ICON = {'NODEB': 'BTS', 'BTS': 'BTS', 'E NODE': 'BTS',
           'MICROWAVE': 'MW',
           'ATN': 'ATN', 'ROUTER': 'ATN',
           'BSC': 'BSC', 'RNC': 'RNC'}

NE_LAYER = {'NODEB': 0, 'BTS': 0, 'E NODE': 0,
            'MICROWAVE': 1,
            'ATN': 2, 'ROUTER': 2,
            'BSC': 3, 'RNC': 3}
