import * as  uuid from 'uuid';

export function getUUID() {

    return uuid.v4().replace(/-/g, '');
}