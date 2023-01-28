function IsDebugMode() as boolean
    bsConst = GetBsConstValues()
    return bsConst["DEBUG"]
end function

function GetBsConstValues() as object
    result = {}

    bsConst = ReadManifestValue("bs_const")
    symbols = bsConst.Tokenize(";")

    for each symbol in symbols
        keyValuePair = symbol.Tokenize("=")
        if keyValuePair.Count() <> 2
            continue for
        end if

        result[UCase(keyValuePair[0])] = UCase(keyValuePair[1]) = "TRUE"
    end for

    return result
end function

function ReadManifestValue(key as string) as string
    appInfo = CreateObject("roAppInfo")
    return appInfo.GetValue(key)
end function
