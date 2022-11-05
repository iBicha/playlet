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
function GetDeviceVersion()
    if m.softwareVersion = invalid or m.softwareVersion = "" then
        m.softwareVersion = CreateObject("roDeviceInfo").GetVersion()
    end if
    return m.softwareVersion
end function


'******************************************************
'Get our serial number
'******************************************************
function GetDeviceESN()
    if m.serialNumber = invalid or m.serialNumber = "" then
        m.serialNumber = CreateObject("roDeviceInfo").GetDeviceUniqueId()
    end if
    return m.serialNumber
end function


'******************************************************
'Determine if the UI is displayed in SD or HD mode
'******************************************************
function IsHD()
    di = CreateObject("roDeviceInfo")
    if di.GetDisplayMode() = "720p" then return true
    return false
end function

function GetLocalIpAddress()
    if m.ipAddress = invalid or m.ipAddress = "" then
        di = CreateObject("roDeviceInfo")
        ips = di.GetIPAddrs()
        for each ip in ips
            m.ipAddress = ips[ip]
            return m.ipAddress
        end for
    end if
end function