import service from './service';

export function postTopoData(data: FormData) {
    return service({
        url: 'upload',
        method: 'post',
        data: data
    })
}

export function getStaticsDataByInterval(params: {start: string, end: string}) {
    return service({
        url: 'interval',
        method: 'get',
        params
    })
}

export function getAlarmDatas(params: {groupId?: string, addCondition?: number, addValue?: string}) {
    return service({
        url: 'analyze',
        method: 'get',
        params
    })
}

