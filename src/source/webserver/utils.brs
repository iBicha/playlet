function min(a as Integer, b as Integer) as Integer
    if a<b then return a else return b
end function

function dbg(obj as Object, level as String, message as String, code=0 as Integer)
    tag = ""
    if isstr(obj)
        tag = obj
    else
        class = obj.class
        id    = obj.id
        if class<>invalid then tag = tag + class
        if isint(id)
            tag = tag +"[" + itostr(id) + "]"
        else if isstr(id)
            tag = tag +"[" + id + "]"
        end if
    end if
    print tag; ".";  level; ": ";
    if code<>0 then print "*"; Stri(code).trim(); "* ";
    print message
end function

function info(obj as Object, message as String, code=0 as Integer)
    dbg(obj, "info", message, code)
end function

function warn(obj as Object, message as String, code=0 as Integer)
    dbg(obj, "warning", message, code)
end function

function err(obj as Object, message as String, code=0 as Integer)
    dbg(obj, "error", message, code)
end function

function errx(obj as Object, message as String, code=0 as Integer)
    dbg(obj, "fatal", message, code)
    stop
end function

function UnixNL()
    return chr(10)
end function

function WinNL()
    return chr(13) + chr(10)
end function

function Quote()
    return chr(34)
end function

function rfc1123_date(when as Object)
    wd  = when.getWeekday().left(3)
    dom = Stri(when.getDayOfMonth()).trim()
    mon = Ucase(MonthStr(when.getMonth()).left(3))
    yr  = Stri(when.getYear()).trim()
    hr  = Stri(when.getHours()).trim()
    mn  = Stri(when.getMinutes()).trim()
    sc  = Stri(when.getSeconds()).trim()
    date = wd+", "+dom+" "+mon+" "+yr+" "+hr+":"+mn+":"+sc+" GMT"
    return date
end function

function date_rfc1123(when as String)
    date = CreateObject("roDateTime")
    parts = when.tokenize(", ")
    if parts.count()=8
        iso8601 = parts.GetIndex(3) + "-" + monthNum(parts.GetIndex(2)) + "-" + parts.GetIndex(1) + " " + parts.GetIndex(4) + ":" + parts.GetIndex(5) + ":" + parts.GetIndex(6)
        date.fromISO8601String(iso8601)
    end if
    return date
end function

function monthNum(mStr as String)
    mm = m.Month2Num
    if mm=invalid
        mm = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12}
        m.Month2Num = mm
    end if
    return validint(mm[lcase(mStr.left(3))])
end function

function monthStr(mNum as Integer)
    ma = m.Num2Month
    if ma=invalid
        ma = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
        m.Num2Month = ma
    end if
    return validstr(ma[mNum-1])
end function

function HttpTitle(code=0 as Integer) as String
    hcm = m.HttpTitles
    if hcm=invalid
        hcm = {n200:"OK",n206:"Partial Content"}
        hcm.append({n301:"Moved Permanently",n304:"Not Modified"})
        hcm.append({n400:"Bad Request",n403:"Forbidden",n404:"Not Found",n413:"Request Entity Too Large"})
        hcm.append({n500:"Internal Server Error",n501:"Not Implemented"})
        m.HttpTitles = hcm
    end if
    return validstr(hcm["n"+Stri(code).trim()])
end function

function Now() as Object
    this = m.now
    if this = invalid
        this = CreateObject("roDateTime")
        m.now = this
    end if
    this.mark()
    return this
end function

function UrlEncode(url as String) as String
    ue = m.UrlEncoder
    if ue = invalid
        ue = CreateObject("roUrlTransfer")
        m.UrlEncoder = ue
    end if
    return ue.UrlEncode(url)
end function

function UrlEscape(url as String) as String
    ue = m.UrlEncoder
    if ue = invalid
        ue = CreateObject("roUrlTransfer")
        m.UrlEncoder = ue
    end if
    return ue.escape(url)
end function

function UrlUnescape(url as String) as String
    ue = m.UrlEncoder
    if ue = invalid
        ue = CreateObject("roUrlTransfer")
        m.UrlEncoder = ue
    end if
    return ue.unescape(url)
end function

function MimeType(uri="" as String) as String
    map = m.MimeTypes
    if map = invalid
        map = {
            ' Default mimetype mappings
            ogg:"application/ogg",
            pdf:"application/pdf",
            xsl:"application/xml",
            xml:"application/xml",
            dtd:"application/xml-dtd",
            xslt:"application/xslt+xml",
            zip:"application/zip",
            mp2:"audio/mpeg",
            mp3:"audio/mpeg",
            mpga:"audio/mpeg",
            gif:"image/gif",
            jpeg:"image/jpeg",
            jpe:"image/jpeg",
            jpg:"image/jpeg",
            png:"image/png",
            css:"text/css",
            html:"text/html",
            js:"text/javascript",
            txt:"text/plain",
            asc:"text/plain",
            brs:"text/plain",
            bs:"text/plain",
            map:"text/plain",
            mpeg:"video/mpeg",
            mpe:"video/mpeg",
            mpg:"video/mpeg",
            qt:"video/quicktime",
            mov:"video/quicktime",
            avi:"video/x-msvideo",
            default:"application/octet-stream"
        }
        m.MimeTypes = map
    end if
    ext = GetExtension(uri)
    if map.doesexist(ext) then return map[ext] else return map.default
end function

function GetExtension(fn as String) as String
    l = fn.tokenize(".")
    if l.count()>0 then return l.GetTail() else return ""
end function

function deduceType(val as String, force=invalid as Dynamic) as Dynamic
    if isstr(force)
        tforce = lcase(force)
        if tforce.right(6)="string" then return val
        if tforce.left(3)="int" then return strtoi(val)
        if tforce.left(4)="bool" then return (lcase(val)="true" or strtoi(val)=1)
    end if
    tval = lcase(val)
    if tval="false" then return false
    if tval="true" then return true
    if tval="0" then return 0
    tval = strtoi(val)
    if tval<>0 then return tval
    return val
end function