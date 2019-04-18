import service from './service';

export function postTopoData(data: FormData) {
    return service({
        url: 'upload',
        method: 'post',
        data: data
    })
}

export function getGroupIdsDataByInterval(params: { start: string, end: string }) {
    return service({
        url: 'interval',
        method: 'get',
        params
    })
}

export function getAlarmDatas(params: { groupId?: string, addCondition?: number, addValue?: string }) {
    return service({
        url: 'analyze',
        method: 'get',
        params
    })
}

export function getExpandAlarmDatas(params: { groupId: string }) {
    return service({
        url: 'expand',
        method: 'get',
        params
    })
}

export function confirmAlarmDatas(groupId: string, data: { row: number[], columns: string[][], values: string[][] }) {
    return service({
        url: 'confirm',
        method: 'post',
        params: { groupId },
        data
    })
}

export function getStaticsGroupData() {
    return service({
        url: 'detail',
        method: 'get'
    })
}

export function exportAlarmData() {
    return service({
        url: 'download',
        method: 'get'
    })
}