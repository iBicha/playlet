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
Function isxmlelement(obj as dynamic) As Boolean
    return obj <> invalid and  GetInterface(obj, "ifXMLElement") <> invalid
End Function


'******************************************************
'islist
'
'Determine if the given object supports the ifList interface
'******************************************************
Function islist(obj as dynamic) As Boolean
    return obj <> invalid and GetInterface(obj, "ifArray") <> invalid
End Function


'******************************************************
'isint
'
'Determine if the given object supports the ifInt interface
'******************************************************
Function isint(obj as dynamic) As Boolean
    return obj <> invalid and GetInterface(obj, "ifInt") <> invalid
End Function


'******************************************************
'isfunc
'
'Determine if the given object supports the function interface
'******************************************************
Function isfunc(obj as dynamic) As Boolean
    tf = type(obj)
    return tf="Function" or tf="roFunction"
End Function


'******************************************************
'isstr
'
'Determine if the given object supports the ifString interface
'******************************************************
Function isstr(obj as dynamic) As Boolean
    return obj <> invalid and  GetInterface(obj, "ifString") <>invalid
End Function


'******************************************************
'isbool
'
'Determine if the given object supports the ifBoolean interface
'******************************************************
Function isbool(obj as dynamic) As Boolean
    if obj = invalid return false
    if GetInterface(obj, "ifBoolean") = invalid return false
    return true
End Function


'******************************************************
'isfloat
'
'Determine if the given object supports the ifFloat interface
'******************************************************
Function isfloat(obj as dynamic) As Boolean
    if obj = invalid return false
    if GetInterface(obj, "ifFloat") = invalid return false
    return true
End Function


'******************************************************
' validstr
'
' always return a valid string. if the argument is 
' invalid or not a string, return an empty string.
'******************************************************
Function validstr(obj As Object) As String
    if obj <> invalid and GetInterface(obj, "ifString") <> invalid
        return obj
    else
        return ""
    endif
End Function 


'******************************************************
' validint
'
' Always return a valid integer. If the argument is 
' invalid or not an integer, return zero.
'******************************************************
Function validint(obj As Dynamic) As Integer
    if obj <> invalid and GetInterface(obj, "ifInt") <> invalid
        return obj
    else
        return 0
    end if
End Function 


'******************************************************
'Validate parameter is the correct type
'******************************************************
Function validateParam(param As Object, paramType As String,functionName As String, allowInvalid = false) As Boolean
    if paramType = "roString" or paramType = "String" then
        if type(param) = "roString" or type(param) = "String" then
            return true
        end if
    else if type(param) = paramType then
        return true
    endif

    if allowInvalid = true then
        if type(param) = invalid then
            return true
        endif
    endif

    print "invalid parameter of type "; type(param); " for "; paramType; " in function "; functionName 
    return false
End Function

