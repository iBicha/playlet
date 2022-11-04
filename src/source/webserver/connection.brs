function ClassConnection()
    ' initializes static members once
    this = m.ClassConnection
    if this=invalid
        this = CreateObject("roAssociativeArray")
        ' constants
        this.class              = "Connection"
        this.INIT               = 0 ' initial state; shouldn't last long
        this.RECV_REQUEST       = 1 ' receiving request
        this.SEND_HEADER        = 2 ' sending generated header
        this.SEND_REPLY         = 3 ' sending reply
        this.DONE               = 4 ' reply sent, close or reuse as indicated
        this.BUFSIZE            = 65536
        this.MAX_REQUEST_LENGTH = 4000
        ' copy-initializable members
        this.total_received     = 0
        this.total_sent         = 0
        this.id                 = "<uninit>"
        this.close              = true
        this.state              = this.INIT
        ' functions
        this.reset        = connection_reset
        this.restart      = connection_restart
        this.recycle      = connection_recycle
        this.accepted     = connection_accepted
        this.pollRequest  = connection_poll_receive_request
        this.pollHeader   = connection_poll_send_header
        this.pollReply    = connection_poll_send_reply
        this.checkTimeout = connection_check_timeout
        this.checkResult  = connection_check_result
        this.setState     = connection_set_state
        this.log          = connection_log
        ' constructor
        this.reset()
        ' singleton
        m.ClassConnection = this
    end if
    return this
end function

 ' ---------------------------------------------------------------------------
 ' Allocate and initialize an empty connection.
 '
function InitConnection()
    this = CreateObject("roAssociativeArray")
    this.append(ClassConnection())
    this.reset()
    return this
end function

 ' ---------------------------------------------------------------------------
 ' Accept a connection from sockin and add it to the connection queue.
 '
function AcceptConnection(server as Object)
    sockin = server.sockin
    socket = sockin.accept()
    if not sockin.eOK() err(m, "accept()",sockin.status())
    if socket=invalid then return invalid
    this = InitConnection()
    this.accepted(server,socket)
    return this
end function

function connection_reset()
    ' re-initializes all instance members
    m.socket = invalid
    m.addr   = invalid
    m.restart()
end function

function connection_restart()
    ' re-initializes members for next request-reply
    m.last_active  = CreateObject("roTimespan")
    m.request      = InitRequest()
    m.header       = invalid
    m.reply        = invalid
    m.header_only  = false
    m.http_code    = 0
    m.close        = true
    m.setState(m.INIT)
end function

function connection_recycle()
    info(m,"recycle")
    m.restart()
    m.setState(m.RECV_REQUEST) ' ready for another
end function

function connection_accepted(server as Object, socket as Object)
    m.socket = socket
    m.id = Stri(socket.getID()).trim()
    m.setState(m.RECV_REQUEST)
    m.client = m.socket.getReceivedFromAddress().getAddress()

    info(m,"accepted connection @" + m.client)

    ' try to read right away rather than going through another iteration
    ' of the poll loop.
    m.pollRequest(server)
end function

function connection_check_result(byteCount as Integer, op as String) as Boolean
    gotSome = false
    if byteCount>0
        m.last_active.mark()
        gotSome = true
    else if m.socket.eOK() and not m.socket.eSuccess()
        'info(m,op + " would have blocked @"+m.client)
    else
        if m.socket.eSuccess()
            info(m,op + " peer closed @"+m.client)
        else
            err(m,op + " transfer error @"+m.client,m.socket.status())
        end if
        m.close = true
        m.setState(m.DONE)
    end if
    return gotSome
end function

function connection_poll_receive_request(server as Object)
    if m.state<>m.RECV_REQUEST then errx(m,"illegal request state @"+m.client)

    rcvStr = m.socket.receiveStr(m.BUFSIZE)
    received = rcvStr.len()

    if m.checkResult(received,"receive request")
        m.total_received = m.total_received + received
        server.total_in = server.total_in + received
    end if

    ' append to connection request
    m.request.add(rcvStr)

    if m.request.isComplete()
        server.num_requests = validint(server.num_requests) + 1
        if m.request.process(m)
            m.reply = InitReply(m.request)
            m.reply.process()
            m.setState(m.SEND_HEADER)
        else
            m.setState(m.DONE)
            m.close = true
            err(m,"couldn't process request or reply, closing @"+m.client)
        end if
    else if m.request.buf.len() > m.MAX_REQUEST_LENGTH ' die if it's too long
        m.default_reply(413, "Request Entity Too Large", "Your request was dropped because it was too long.")
        m.setState(m.SEND_HEADER)
    end if

    ' if we've moved on to the next state, try to send right away, instead of
    ' going through another iteration of the poll loop.
    '
    if m.state = m.SEND_HEADER then m.pollHeader(server)
end function

function connection_poll_send_header(server as Object) as Boolean
    if m.state<>m.SEND_HEADER errx(m,"illegal header state @"+m.client)

    sent = m.reply.sendHdr(m.socket,m.BUFSIZE)

    if m.checkResult(sent, "send header")
        m.total_sent = m.total_sent + sent
        server.total_out = server.total_out + sent
    end if

    if m.reply.doneHdr()
        if m.reply.header_only
            m.setState(m.DONE)
        else
            m.setState(m.SEND_REPLY)
            m.pollReply(server)
        end if
    end if
end function

function connection_poll_send_reply(server as Object)
    if m.state<>m.SEND_REPLY or m.reply.header_only then errx(m,"illegal reply state @"+m.client)

    sent = m.reply.send(m.socket,m.BUFSIZE)
    if m.checkResult(sent,"send reply")
        m.total_sent = m.total_sent + sent
        server.total_out = server.total_out + sent
    end if
    if m.reply.done() then m.setState(m.DONE)
end function

function connection_check_timeout(timeout as Integer)
    if m.last_active.totalSeconds() > timeout
        m.close = true
        m.setState(m.DONE)
    end if
end function

function connection_set_state(newState as Integer)
    if m.state<>newState
        'info(m,"state change" + Stri(m.state) + " ->" + Stri(newState)) 
        m.state = newState
    end if
end function

function connection_log()
    if m.http_code <> 0 and isnonemptystr(m.method)
        print m.last_active.totalSeconds(); " client:"; m.client; " meth:"; m.method; " uri:"; m.uri; " code:"; m.code; " sent:"; m.total_sent; " referer:"; m.referer; " user agent:"; m.user_agent
    end if
end function

