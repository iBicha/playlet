function Main(args as dynamic)
    m.msgPort = CreateObject("roMessagePort")
    m.screen = CreateObject("roSGScreen")
    m.screen.setMessagePort(m.msgPort)

    loginServer()
    initScreen()
end function

sub loginServer()
    ' TODO: check expiry of token
    token = RokuYoutube.Utils.Registry.Read("token")
    if token <> invalid then return

    scene = m.screen.CreateScene("QRTestScene")
    m.screen.show()

    authorizeUrl = RokuYoutube.Services.Invidious.GetAuthorizeTokenLink()

    QRPoster = scene.findNode("TestQRPoster")
    QRPoster.text = authorizeUrl

    settings = new RokuYoutube.Http.HttpSettings(m.msgPort)

    ' Root at www to get http://IP_ADDRESS:PORT/index.html
    settings.WwwRoot = "pkg:/www"
    server = new RokuYoutube.Http.HttpServer(settings)

    timeout = validint(settings.Timeout)
    update = true

    while (true)
        server.PreWait()
        if settings.ShouldClose
            exit while
        end if
        msg = wait(timeout, settings.MessagePort)
        msgType = type(msg)
        if msgType = "roSocketEvent" or msg = invalid
            server.PostWait()
        end if
        ' TODO: this does not work. Need a better exit strategy
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed() then exit while
        end if
    end while

    server.Close()
    ' screen.close()
end sub

sub initScreen()
    previousScreen = m.screen

    m.screen = CreateObject("roSGScreen")
    m.screen.setMessagePort(m.msgPort)

    scene = m.screen.CreateScene("MainScene")
    m.screen.show()

    ' TODO: proper control flow between screens...
    ' previousScreen.close()

    while(true)
        msg = wait(0, m.msgPort)
        msgType = type(msg)
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        end if
    end while
end sub