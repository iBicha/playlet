' /**
'  * @module requests
'  */

' /**
'  * @memberof module:requests
'  * @name Requests
'  * @function
'  * @description Main Class for Requests
'  * @param {Dynamic} args - Associative array of args to pass into Alacrity

function Requests() as Object
    return {
        request : Requests_request
        get: Requests_getRequest
        post: Requests_postRequest
    }
end function

function Requests_getRequest(url as String, args=invalid)
    return m.request("GET", url, args)
end function

function Requests_postRequest(url as String, args=invalid)
    return m.request("POST", url, args)
end function

function Requests_request(method, url as String, args as Object)

    _params = {}
    _headers = {}
    ' _cookies = invalid
    _data = invalid
    _json = invalid
    _timeout = 30000
    _retryCount = 0
    ' _allow_redirects = true
    _verify = "common:/certs/ca-bundle.crt"
    _useCache = true
    _cacheSeconds = invalid

    if args <> invalid and type(args) = "roAssociativeArray"
        if args.params <> invalid and type(args.params) = "roAssociativeArray"
            _params = args.params
        end if
        if args.headers <> invalid and type(args.headers) = "roAssociativeArray"
            _headers = args.headers
        end if
        if args.data <> invalid and (type(args.data) = "String" or type(args.data) = "roString")
            _data = args.data
        end if
        if args.json <> invalid and type(args.json) = "roAssociativeArray"
            _json = FormatJson(args.json)
        end if
        if args.timeout <> invalid and (type(args.timeout) = "Integer" or type(args.timeout) = "roInteger")
            _timeout = args.timeout
        end if
        if args.retryCount <> invalid and (type(args.retryCount) = "Integer" or type(args.retryCount) = "roInteger")
            _retryCount = args.retryCount
        end if
        if args.verify <> invalid and (type(args.verify) = "String" or type(args.verify) = "roString")
            _verify = args.verify
        end if
        if args.useCache <> invalid and (type(args.useCache) = "Boolean" or type(args.useCache) = "roBoolean")
            _useCache = args.useCache
        end if
        if args.cacheSeconds <> invalid and (type(args.cacheSeconds) = "Integer" or type(args.cacheSeconds) = "roInteger")
            _cacheSeconds = args.cacheSeconds
        end if
    end if

    ' Constructs and sends a Request.
    ' :param method: method for the new Request object.
    ' :param url: URL for the new Request object.
    ' :param params: (optional) AA to append as a query string to the Request.
    ' :param data: (optional) String to send in the body of the Request.
    ' :param json: (optional) A JSON serializable object to send in the body of the Request.
    ' :param headers: (optional) AA of HTTP Headers to send with the Request.
    ' :param cookies: (optional) Dict or CookieJar object to send with the Request.
    ' :param timeout: (optional) How many seconds to wait for the server to send data
    '     before giving up, as a float
    ' :param retryCount: (optional) How many times to retry a failed response.
    ' :param allow_redirects: (optional) Boolean. Enable/disable GET/OPTIONS/POST/PUT/PATCH/DELETE/HEAD redirection.
    ' :param verify: (optional) String to specify SSL cert bundle.
    '               If this is set to empty string `InitClientCertificates` is not called on roUrlTransfer.
    '               Defaults to `common:/certs/ca-bundle.crt`
    ' :param useCache: (optional) Boolean. Enable/Disable caching. Defaults to true
    ' :param cacheSeconds: (optional) Integer. Enable/Disable caching. Defaults to response's Cache-Control if it exists
    ' :return: :class:`Requests <Response>` object
    ' Usage::
    '   req = Requests().get('http://httpbin.org/get')


    requestHeaders = Requests_headers()
    requestHeaders.addHeadersAA(_headers)

    requestQueryString = Requests_queryString()
    requestQueryString.addParamsAA(_params)

    ' Setup the data (we overwrite JSON if it's provided)
    if _data <> invalid
        data = _data
    else if _json <> invalid
        data = _json
        requestHeaders.addHeader("Content-Type", "application/json")
    else
        data = ""
    end if

    'TODO: Add Cookies Support
    'urlTransfer.EnableCookies()
    'urlTransfer.GetCookies(domain, path)
    'urlTransfer.AddCookies(cookies)
    'urlTransfer.ClearCookies()

    url = requestQueryString.append(url)
    headers = requestHeaders._headers

    rc = Requests_cache(method, url, headers)

    response = invalid
    if rc <> invalid and _useCache
        response = rc.get(_cacheSeconds)
    end if

    if response = invalid
        response = Requests_run(method, url, headers, data, _timeout, _retryCount, _verify)
        if rc <> invalid and _useCache
            rc.put(response)
        end if
    end if

    return response

end function

function Requests_run(method, url, headers, data, timeout, retryCount, verify)

    urlTransfer = RequestsUrlTransfer(true, true, verify)
    urlTransfer.setUrl(url)
    urlTransfer.SetHeaders(headers)

    ? "[http] ------ START HTTP REQUEST ------"

    ? "[http] URL:", urlTransfer.GetURL()

    ? "[http] Timeout= ", timeout

    ? "[http] Headers: ",  headers

    cancel_and_return = false

    responseEvent = invalid
    requestDetails = {
        timesTried : 0,
    }
    'while we still have try times
    while retryCount >= 0

        'deincrement the number of retries
        retryCount = retryCount - 1
        requestDetails.timesTried = requestDetails.timesTried + 1

        ? "[http] Method: ",  method
        if method="POST"
            sent = urlTransfer.AsyncPostFromString(data)
        else if method = "GET"
            sent = urlTransfer.AsyncGetToString()
        else if method = "HEAD"
            sent = urlTransfer.AsyncHead()
        else
            'PUT, PATCH, DELETE
            urlTransfer.SetRequest(method)
            sent = urlTransfer.AsyncPostFromString(data)
        end if

        if sent = true
            clock = CreateObject("roTimespan")
            timeout_call = clock.TotalMilliseconds() + timeout

            while true and cancel_and_return = false

                if m.top <> invalid
                    if m.top.quit <> invalid
                        cancel_and_return = m.top.quit
                    end if
                end if

                event = urlTransfer.GetPort().GetMessage()

                if type(event) = "roUrlEvent"
                    exit while
                end if

                if clock.TotalMilliseconds() > timeout_call
                    exit while
                end if
            end while

            if type(event) = "roUrlEvent"
                responseEvent = event
                responseCode = event.GetResponseCode()
                ? "[http] Response Code", responseCode
                if responseCode > 0 and responseCode < 400
                    'Response was good, so we break the while
                    exit while
                else
                    'We have a bad response
                    ? "[http] Bad response", responseCode
                    ? "[http] Will Retry ", retryCount
                end if
            else
                if m.cancel_and_return = true
                    ? "[http] Killing the Task"
                    exit while
                else
                    'We timed out so we should cancel the request
                    ? "[http] Event Timed Out"
                    urlTransfer.AsyncCancel()
                    'Exponential backoff timeouts
                    timeout = timeout * 2
                    ? "[http] Timeout=", timeout
                end if
            end if
        end if
    end while
    ? "[http] ------ END HTTP REQUEST ------"

    return Requests_response(urlTransfer, responseEvent, requestDetails)

end function



function Requests_cache(method as String, url as String, headers as Object)

    if method <> "GET"
        return invalid
    end if

    cacheKey = url
    headersString = FormatJson(headers)
    if headersString <> invalid
        cacheKey = cacheKey + headersString
    end if

    ba = CreateObject("roByteArray")
    ba.FromAsciiString(cacheKey)
    digest = CreateObject("roEVPDigest")
    digest.Setup("md5")
    md5Key = digest.Process(ba)

    fileLocation = "cachefs:/" + md5Key

    return {
        _cacheKey: cacheKey
        _md5Key: md5Key

        location: fileLocation

        exists: function() as Boolean
                fs = CreateObject("roFileSystem")
                return fs.Exists(m.location)
            end function

        get: function(expireSeconds) as Object
                if m.exists()
                    fileData = ReadAsciiFile(m.location)
                    if fileData <> ""
                        dataSplit = fileData.Split(chr(10))
                        if dataSplit.count() = 2
                            fileTimeastamp = dataSplit[0].toInt()
                            date = CreateObject("roDateTime")
                            nowTimestamp = date.AsSeconds()
                            response = ParseJson(dataSplit[1])
                            if response <> invalid
                                if expireSeconds = invalid and response.headers <> invalid
                                    cacheControl = response.headers["cache-control"]
                                    if cacheControl <> invalid
                                        cacheControlSplit = cacheControl.split(",")
                                        if cacheControlSplit.count() > 1
                                            cacheControlMaxAgeSplit = cacheControlSplit[1].split("=")
                                            if cacheControlMaxAgeSplit.count() > 1
                                                expireSeconds = val(cacheControlMaxAgeSplit[1])
                                            end if
                                        end if
                                    end if
                                end if
                                if expireSeconds <> invalid
                                    if fileTimeastamp + expireSeconds >= nowTimestamp
                                        response.cacheHit = true
                                        return response
                                    end if
                                end if
                            end if
                        end if
                    end if
                end if
                return invalid
            end function

        put: function(response) as Boolean
                date = CreateObject("roDateTime")
                timestamp = date.AsSeconds()
                putString = stri(timestamp) + chr(10)
                jsonResponse = FormatJson(response)

                if jsonResponse <> invalid
                    putString = putString + jsonResponse
                    return WriteAsciiFile(m.location, putString)
                end if
                return false
            end function

        delete: function() as Boolean
            fs = CreateObject("roFileSystem")
                return fs.Delete(m.location)
            end function

    }

end function

function Requests_headers()

    return {
        _headers: {}
        addHeader: function(key as String, value as String)
                m._headers[key] = value
            end function

        addHeadersAA: function(headers as Object)
                m._headers.Append(headers)
            end function

        build: m.get
        get: m._headers
    }

end function

function Requests_queryString()

    return {
        _urlTransfer: CreateObject("roUrlTransfer")
        _qs_array: []
        addString: function(params as String)
                if Requests_Utils_inString("&", params)
                    split_params = params.split("&")
                    for each param in split_params
                        if Requests_Utils_inString("=", param)
                            split_param = param.split("=")
                            m.addParamKeyValue(split_param[0], split_param[1])
                        else
                            m.addParamKeyValue(param, "")
                        end if
                    end for
                else if Requests_Utils_inString("=", params)
                    split_params = params.split("=")
                    m.addParamKeyValue(split_params[0], split_params[1])
                else
                    m.addParamKeyValue(params, "")
                end if
            end function
        addParamKeyValue: function(param as String, key as String)
                m._qs_array.push([param, key])
            end function
        addParamsAA: function(params as Object)
                for each item in params.Items()
                    m.addParamKeyValue(item.key, item.value)
                end for
            end function
        addParamsArray: function(params as Object)
                if params.Count() > 0
                    for each item in params
                        if item.Count() > 1
                            m.addParamKeyValue(item[0], item[1])
                        else if item.Count() > 0
                            m.addParamKeyValue(item[0], "")
                        end if
                    end for
                end if
            end function

        build: function() as String
            ' "build the QS output from the added params"
                output = ""
                c = 0
                for each qs in m._qs_array
                    if c = 0
                        output = qs[0] + "=" + m._urlTransfer.Escape(qs[1])
                    else
                        output = output + "&" + qs[0] + "=" + m._urlTransfer.Escape(qs[1])
                    end if
                    c += 1
                end for
                return output
            end function

        append: function(url as String) as String
            ' "append the QS on a provided URL"
                if m._qs_array.Count() > 0
                    if Requests_Utils_inString("?", url)
                        if url.right(1) = "?"
                            return url + m.build()
                        else
                            return url + "&" + m.build()
                        end if
                    else
                        return url + "?" + m.build()
                    end if
                end if
                return url
            end function
    }

end function

function Requests_response(urlTransfer as Object, responseEvent as Object, requestDetails as Object)

    rr = {}

    rr.timesTried = requestDetails.timesTried
    rr.url = urlTransfer.GetUrl()
    rr.ok = false
    rr.cacheHit = false

    if responseEvent <> invalid
        rr.statusCode = responseEvent.GetResponseCode()
        rr.text = responseEvent.GetString()
        rr.headers = responseEvent.GetResponseHeaders()
        rr.headersArray = responseEvent.GetResponseHeadersArray()

        rr.GetSourceIdentity = responseEvent.GetSourceIdentity()
        rr.GetFailureReason = responseEvent.GetFailureReason()
        rr.target_ip = responseEvent.GetTargetIpAddress()
        if rr.statusCode > 0 and rr.statusCode < 400
            rr.ok = true
        end if
    end if



    if rr.text <> invalid
        rr.json = parseJson(rr.text)
        rr.body = rr.text
    end if

    return rr

end function


function RequestsUrlTransfer(EnableEncodings as Boolean, retainBodyOnError as Boolean, verify as String)

    _urlTransfer = CreateObject("roUrlTransfer")
    _urlTransfer.SetPort(CreateObject("roMessagePort"))

     _urlTransfer.EnableEncodings(enableEncodings)
     _urlTransfer.RetainBodyOnError(retainBodyOnError)
    if verify <> ""
        _urlTransfer.SetCertificatesFile(verify)
        _urlTransfer.InitClientCertificates()
    end if

    return _urlTransfer

end function
function Requests_Utils_inString(char as String, strValue as String)

    for each single_char in strValue.split("")
        if single_char = char
            return true
        end if
    end for

    return false

end function