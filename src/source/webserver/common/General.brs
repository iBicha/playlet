REM This file has no dependencies on other common files.
REM
REM Functions in this file:
REM     GetDeviceVersion
REM     GetDeviceESN
REM     IsHD
REM

'******************************************************
'Get our device version
'******************************************************
Function GetDeviceVersion()
    if m.softwareVersion = invalid OR m.softwareVersion = "" then
        m.softwareVersion = CreateObject("roDeviceInfo").GetVersion()
    end if
    return m.softwareVersion
End Function


'******************************************************
'Get our serial number
'******************************************************
Function GetDeviceESN()
    if m.serialNumber = invalid OR m.serialNumber = "" then
        m.serialNumber = CreateObject("roDeviceInfo").GetDeviceUniqueId()
    end if
    return m.serialNumber
End Function


'******************************************************
'Determine if the UI is displayed in SD or HD mode
'******************************************************
Function IsHD()
    di = CreateObject("roDeviceInfo")
    if di.GetDisplayMode() = "720p" then return true
    return false
End Function

