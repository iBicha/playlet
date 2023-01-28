' Playlet (App to play videos from an Invidious server on Roku TVs)
' Copyright (C) 2022 Brahim Hadriche

' This program is free software: you can redistribute it and/or modify
' it under the terms of the GNU Affero General Public License as published by
' the Free Software Foundation, either version 3 of the License, or
' (at your option) any later version.

' This program is distributed in the hope that it will be useful,
' but WITHOUT ANY WARRANTY; without even the implied warranty of
' MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
' GNU Affero General Public License for more details.

' You should have received a copy of the GNU Affero General Public License
' along with this program.  If not, see <https://www.gnu.org/licenses/>.

function Main(args as object) as void
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    m.global = screen.getGlobalNode()

    scene = screen.CreateScene("BootstrapScene")
    screen.show()
    scene.signalBeacon("AppLaunchComplete")

    scene.ObserveField("playletLibMsg", m.port)

    input = CreateObject("roInput")
    input.setMessagePort(m.port)

    if IsDebugMode()
        ' The following comment is to enable the SceneGraph inspector
        ' on the VSCode BrightScript plugin.
        ' vscode_rdb_on_device_component_entry

        ' The following comment is to enable RALE tracking
        ' vscode_rale_tracker_entry
    end if

    while true
        msg = wait(0, m.port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed()
                END
            end if
        else if msgType = "roSGNodeEvent"
            field = msg.getField()
            data = msg.getData()

            if field = "playletLibMsg"
                if data["source"] = "playlet-app"
                    continue while
                end if

                if data["command"] = "launchArgs"
                    scene.playletLibMsg = {
                        source: "playlet-app",
                        command: "launchArgs",
                        data: args
                    }
                end if

                if data["command"] = "exitChannel"
                    END
                end if
            end if
        else if msgType = "roInputEvent"
            scene.playletLibMsg = {
                source: "playlet-app",
                command: "inputArgs",
                data: msg.getInfo()
            }
        end if
    end while
end function
