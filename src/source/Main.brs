' TODO:
'  - New template
'  - Use brighterscript
'  - Use classes and tests
'  - Use vs code config
'  - Use unit tests
'  - Use bs promises
'  - Check tools under roku community (linter, etc)
'  - Use RALE app to make UIs
'  - Fix non-Latin characters (Unicode on Roku sucks)


' FEATURES:
'  - Sign in with account
'  - Youtube backend abstraction (Invidious vs TubeArchvist)
'  - Settings page
'    - Configure SponsorBlock
'    - Configure Invidious Backend (allow self-hosted)
'    - Closed caption settings?
'  - Search page
'  - Channel page
'  - Comments page? (especially on live videos)
'  - Dislike count?
'  - Closed caption
'  - Launch app to specific video (deep link)
'  - Youtube android app -> share -> custom app -> push to tv

function Main(args as dynamic)
    initScreen()
end function

sub initScreen()
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)

    scene = screen.CreateScene("MainScene")
    screen.show()

    while(true)
        msg = wait(0, m.port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        end if
    end while
end sub