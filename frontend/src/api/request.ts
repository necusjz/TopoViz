import service from './service';

export function postTopoData(data: FormData) {
    return service({
        url: 'upload',
        method: 'post',
        data: data
    })
}
