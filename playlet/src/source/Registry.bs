function ReadRegistryKey(key as string, section as string) as dynamic
    sec = CreateObject("roRegistrySection", section)
    if not sec.Exists(key)
        return invalid
    end if
    return sec.Read(key)
end function

function DeleteRegistryKey(key as string, section as string)
    sec = CreateObject("roRegistrySection", section)
    sec.Delete(key)
    sec.Flush()
end function
