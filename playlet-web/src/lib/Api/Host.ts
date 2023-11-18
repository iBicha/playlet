function getHost() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get('host') ?? window.location.host
}

function getIp() {
    const host = getHost()
    return host.split(':')[0]
}

export { getHost, getIp }