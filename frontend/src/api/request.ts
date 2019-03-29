import service from './service';

export function postTopoData(data: FormData) {
    return service({
        url: 'post/excel',
        method: 'post',
        data: data
    })
}
