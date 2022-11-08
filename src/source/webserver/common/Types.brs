REM Functions in this file:
REM     isxmlelement
REM     islist
REM     isint
REM     isfunc
REM     isstr
REM     isbool
REM     isfloat
REM     validstr
REM     validateParam
REM

'******************************************************
'isxmlelement
'
'Determine if the given object supports the ifXMLElement interface
'******************************************************
function isxmlelement(obj as dynamic) as boolean
    return obj <> invalid and GetInterface(obj, "ifXMLElement") <> invalid
end function


'******************************************************
'islist
'
'Determine if the given object supports the ifList interface
'******************************************************
function islist(obj as dynamic) as boolean
    return obj <> invalid and GetInterface(obj, "ifArray") <> invalid
end function


'******************************************************
'isint
'
'Determine if the given object supports the ifInt interface
'******************************************************
function isint(obj as dynamic) as boolean
    return obj <> invalid and GetInterface(obj, "ifInt") <> invalid
end function


'******************************************************
'isfunc
'
'Determine if the given object supports the function interface
'******************************************************
function isfunc(obj as dynamic) as boolean
    tf = type(obj)
    return tf = "Function" or tf = "roFunction"
end function


'******************************************************
'isstr
'
'Determine if the given object supports the ifString interface
'******************************************************
function isstr(obj as dynamic) as boolean
    return obj <> invalid and GetInterface(obj, "ifString") <> invalid
end function


'******************************************************
'isbool
'
'Determine if the given object supports the ifBoolean interface
'******************************************************
function isbool(obj as dynamic) as boolean
    if obj = invalid return false
    if GetInterface(obj, "ifBoolean") = invalid return false
    return true
end function


'******************************************************
'isfloat
'
'Determine if the given object supports the ifFloat interface
'******************************************************
function isfloat(obj as dynamic) as boolean
    if obj = invalid return false
    if GetInterface(obj, "ifFloat") = invalid return false
    return true
end function


'******************************************************
' validstr
'
' always return a valid string. if the argument is
' invalid or not a string, return an empty string.
'******************************************************
function validstr(obj as object) as string
    if obj <> invalid and GetInterface(obj, "ifString") <> invalid
        return obj
    else
        return ""
    end if
end function


'******************************************************
' validint
'
' Always return a valid integer. If the argument is
' invalid or not an integer, return zero.
'******************************************************
function validint(obj as dynamic) as integer
    if obj <> invalid and GetInterface(obj, "ifInt") <> invalid
        return obj
    else
        return 0
    end if
end function


'******************************************************
'Validate parameter is the correct type
'******************************************************
function validateParam(param as object, paramType as string, functionName as string, allowInvalid = false) as boolean
    if paramType = "roString" or paramType = "String"
        if type(param) = "roString" or type(param) = "String"
            return true
        end if
    else if type(param) = paramType
        return true
    end if

    if allowInvalid = true
        if type(param) = invalid
            return true
        end if
    end if

    print "invalid parameter of type "; type(param); " for "; paramType; " in function "; functionName
    return false
end function

