import zhLocale from 'element-ui/lib/locale/lang/en';

const en = {
  lang: {
    upload: 'Upload',
    export: 'Export Data',
    importTopoData: 'Import TOPO',
    importRCAData: 'Import RCA',
    rcaResultStatics: 'Summary',
    totalAlarm: 'Total Alarm',
    pAlarm: 'P Alarm',
    cAlarm: 'C Alarm',
    xAlarm: 'Unknown Alarm',
    groupNumber: 'Group Number',
    confirmed: 'Confirmed',
    unconfirmed: 'Unconfirmed',
    accuracy: 'Accuracy',
    noData: 'No Data',
    noDataMsg: 'You have not confirmed the data, go to "unconfirmed" to see it.',
    knownAlarm: 'Known Alarm',
    unknownAlarm: 'Unknown Alarm',
  },
  ...zhLocale
}

export default en;
