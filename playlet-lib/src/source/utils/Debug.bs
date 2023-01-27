function IsDebugMode() as boolean
    appInfo = CreateObject("roAppInfo")
    bsConst = appInfo.GetValue("bs_const")
    symbols = bsConst.Tokenize(";")

    for each symbol in symbols
        keyValuePair = symbol.Tokenize("=")
        if keyValuePair.Count() <> 2
            continue for
        end if
        if UCase(keyValuePair[0]) = "DEBUG"
            return UCase(keyValuePair[1]) = "TRUE"
        end if
    end for

    return false
end function
