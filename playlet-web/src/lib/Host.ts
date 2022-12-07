function GetHost() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get('host') ?? window.location.host
}

export { GetHost }