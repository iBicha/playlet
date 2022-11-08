REM Functions in this file:
REM     isnonemptystr
REM     isnullorempty
REM     strtobool
REM     itostr
REM     strTrim
REM     strTokenize
REM     strReplace
REM

'******************************************************
'isnonemptystr
'
'Determine if the given object supports the ifString interface
'and returns a string of non zero length
'******************************************************
function isnonemptystr(obj)
    return ((obj <> invalid) and (GetInterface(obj, "ifString") <> invalid) and (Len(obj) > 0))
end function


'******************************************************
'isnullorempty
'
'Determine if the given object is invalid or supports
'the ifString interface and returns a string of zero length
'******************************************************
function isnullorempty(obj)
    return ((obj = invalid) or (GetInterface(obj, "ifString") = invalid) or (Len(obj) = 0))
end function


'******************************************************
'strtobool
'
'Convert string to boolean safely. Don't crash
'Looks for certain string values
'******************************************************
function strtobool(obj as dynamic) as boolean
    if obj = invalid return false
    if type(obj) <> "roString" and type(obj) <> "String" return false
    o = strTrim(obj)
    o = Lcase(o)
    if o = "true" return true
    if o = "t" return true
    if o = "y" return true
    if o = "1" return true
    return false
end function

'******************************************************
'booltostr
'
'Converts a boolean value to a cannonical string value
'******************************************************
function booltostr(bool as boolean) as string
    if bool = true then return "true"
    return "false"
end function

'******************************************************
'itostr
'
'Convert int to string. This is necessary because
'the builtin Stri(x) prepends whitespace
'******************************************************
function itostr(i as integer) as string
    str = Stri(i)
    return strTrim(str)
end function


'******************************************************
'Trim a string
'******************************************************
function strTrim(str as string) as string
    st = CreateObject("roString")
    st.SetString(str)
    return st.Trim()
end function


'******************************************************
'Tokenize a string. Return roList of strings
'******************************************************
function strTokenize(str as string, delim as string) as object
    st = CreateObject("roString")
    st.SetString(str)
    return st.Tokenize(delim)
end function


'******************************************************
'Replace substrings in a string. Return new string
'******************************************************
function strReplace(basestr as string, oldsub as string, newsub as string) as string
    newstr = ""

    i = 1
    while i <= Len(basestr)
        x = Instr(i, basestr, oldsub)
        if x = 0
            newstr = newstr + Mid(basestr, i)
            exit while
        end if

        if x > i
            newstr = newstr + Mid(basestr, i, x - i)
            i = x
        end if

        newstr = newstr + newsub
        i = i + Len(oldsub)
    end while

    return newstr
end function
