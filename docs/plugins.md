# Playlet Brighterscript Plugins

- [Json5/Yaml support](#json5yaml-support)
- [Manifest editing](#manifest-editing)
- [Validation](#validation)
- [Includes](#includes)
- [@oninit](#oninit)
- [Bindings](#bindings)
- [Async Task Generator](#async-task-generator)
- [Tracking transpilied files](#tracking-transpilied-files)
- [Logger](#logger)
- [Type Gen](#type-gen)
- [Web Server](#web-server)
- [Locale validation](#locale-validation)
- [Protobuf Generator](#protobuf-generator)

Playlet implements a few [Brighterscript Plugins](https://github.com/rokucommunity/brighterscript/blob/master/docs/plugins.md). The plugins inject themselves in the compilation process, allowing the modification of bs scripts, xml components, and even assets or the app manifest. Let's start with a simple one:

<!-- markdownlint-disable MD024 -->

## Json5/Yaml support

**[Source](/tools/bs-plugins/json-yaml-plugin.ts)**

This plugin allows us to include `jsonc`, `json5` and `yaml` files into the app as static assets. They are an alternative to plain `json`, which for instance, does not support comments. Additionally, this plugin minifies the `json` files.

### Why

Brightscript can only parse json natively using [ParseJson](https://developer.roku.com/en-ca/docs/references/brightscript/language/global-utility-functions.md#parsejsonjsonstring-as-string-flags---as-string-as-object). But it is nice to format config files as we please, include comments, and use the [Json5](https://json5.org/) format in general. Additionally, we get smaller files than the original assets.

### How

At the end of the build, the plugin scans for certain files (`jsonc`, `json`, `json5` and `yaml`), and converts them to plain json, while keeping the original file name. That way they are all parsable by the [ParseJson](https://developer.roku.com/en-ca/docs/references/brightscript/language/global-utility-functions.md#parsejsonjsonstring-as-string-flags---as-string-as-object) function, even though their original format is not compatible.

## Manifest editing

**[Source](/tools/bs-plugins/manifest-edit-plugin.ts)**

This plugin allows us to make modifications to the app manifest dynamically, mostly based on compiler flags.

### Why

A few reasons. For example:

- If `--debug` flag is passed to the compiler, we want the `DEBUG` [compilation constant](https://developer.roku.com/en-ca/docs/references/brightscript/language/conditional-compilation.md) to be true
- If `--test-mode` flag is passed, Turn `playlet-lib` into a standalone app instead of a component library, so we can run it as a standalone app for testing
- Allows us to `DEBUG_HOST_IP_ADDRESS` with the local ip address of the debugging machine, so that `playlet-app` is able to find the `playlet-lib.zip` file that VSCode is serving during a debug session.

### How

We simply read the content of the original manifest, and modify it before the compilation starts. When the build is finished, we restore the source file of the manifest.

## Validation

**[Source](/tools/bs-plugins/validation-plugin.ts)**

This plugin allows us to add custom diagnostic errors messages to source code, to prevent using certain patterns of functions.

### Why

Let's see an example. consider this code:

```brighterscript
node.ObserveField("someField", "OnSomeFieldChanged")
```

This code makes it possible to make a typo in "OnSomeFieldChanged", and this callback ends up never firing.

Let's suppose we want to eliminate this pattern and always use:

```brighterscript
node.ObserveField("someField", FuncName(OnSomeFieldChanged))
```

Where `FuncName` will determine the function name at runtime. This way, we will get a linter error if there's a typo, and adds a bit of safety.

### How

It's usually possible to create all types of validation plugins using the [brigherscript plugin APIs](https://github.com/rokucommunity/brighterscript/blob/master/docs/plugins.md). But this particular plugin is generic enough to allow us to define rules based on Regex. To define the rule in the previous example, we simply add this to the `bsconfig.json` file:

```json
"validation": [
    {
        "code": "NO_OBSERVE_STRING_CALLBACK",
        "regex": "\\.observeField(scoped)?\\s*\\(\\s*\"\\w+\"\\s*,\\s*\"\\w+\"\\s*\\)",
        "regexFlags": "ig",
        "message": "observeField(\"field\", \"callback\") is not allowed. Use observeField(\"field\", FuncName(callback)) instead."
    }
],
```

The plugin will scan all the code for usage matching `"regex"` with the `"regexFlags"`. If found, it will error with the `"message"` and the error code `"code"`.

The code allows us to ignore this diagnostics message, using the following:

```brighterscript
' bs:disable-next-line NO_OBSERVE_STRING_CALLBACK
node.ObserveField("someField", "OnSomeFieldChanged")
```

## Includes

**[Source](/tools/bs-plugins/component-includes-plugin.ts)**

This plugin allows us "include" different pieces of a component, enabling [Composition over inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance)

### Why

Consider a "behaviour" that we want in multiple components. For example:

```xml
<!-- Beep.xml -->
<component name="Beep" extends="Node">
    <interface>
        <field id="beepNow" type="boolean" alwaysNotify="true" onChange="OnBeepSet" />
    </interface>
    <script type="text/brightscript" uri="pkg:/path/to/Beep.bs" />
</component>
```

```brighterscript
' Beep.bs
function OnBeepSet()
    print("BEEP BEEP!")
end function
```

Imagine you want to enable many components to "Beep". You have a few options:

- Inheritance: you make a base component that can "Beep", and extend it in different components. This can seem ok at first, but as your app scales, it becomes a burden to manage these inheritance relationships.
- Copy the fields, and the `<script>` tags to components everywhere. Can lead to lots of duplication, is error prone, but it can work
- Use this plugin, which will do all the copying for you!

### How

The plugin looks for the `includes` attribute in components:

```xml
<!-- MyComponent.xml -->
<component name="MyComponent" extends="Node" includes="Beep">
</component>
```

Once it finds it, it will try to look for `Beep.part.xml`, and will do the following:

- Copy all `field`s from `Beep` to `MyComponent`
- Copy all `function`s from `Beep` to `MyComponent`
- Copy all `<script>` tags from `Beep` to `MyComponent`
- Copy all children nodes from `Beep` to `MyComponent`
- Remove the `includes` attribute, since it is technically not a valid attribute for Roku components

After it is transpiled, `MyComponent.xml` should look like this

```xml
<component name="MyComponent" extends="Node">
    <interface>
        <field id="beepNow" type="boolean" alwaysNotify="true" onChange="OnBeepSet" />
    </interface>
    <script type="text/brightscript" uri="pkg:/path/to/Beep.bs" />
</component>
```

This way, we can share the functionality in a composable way, but still keep the code base sane enough.

A couple of more details:

- the "behaviours" are supposed to be pieces of functionality, and not to be used as components. This is why we explicitely look for files named `*.part.xml`, to be more intentional with what is a component, and what is a "part".
- It's possible to include multiple "parts" in a component, separated by a comma:

```xml
<!-- MyComponent.xml -->
<component name="MyComponent" extends="Node" includes="Beep,FadeIn">
</component>
```

## @oninit

**[Source](/tools/bs-plugins/oninit-plugin.ts)**

`@oninit` is an annotation that can be added to functions, and then these functions will be called in the `Init()` function of the component it is in.

### Why

Consider the components "parts" from [Includes](#includes) plugin. Sometimes these behaviours need to initialize. Without the `@oninit` annotation, components including a part need to be aware of of any functions that we need to call in `Init()`. But the reality is, this is an implementation detail that the including component should not be concerned with.

### How

Simply this code:

```brighterscript
function Init()
end function

@oninit
function SomeFunction()
end function
```

would transpile to:

```brighterscript
function Init()
    SomeFunction() ' auto-generated!
end function

function SomeFunction()
end function
```

Important implementation details:

- A component including a function annotated with `@oninit` must have an `Init()` function.
  - If needed, add an empty `Init()` function where `@oninit` functions will be called
- An `Init()` function that will be calling `@oninit` functions must be included in only one component
  - Let's explain why with an example:
    - We have two components: `ComponentA` and `ComponentB`
    - We have a script named `MyCompScript.bs` which has an `Init()` function
    - We have a script named `MyBehaviour.bs` which has a function named `DoSomethingOnInit()` annotated with `@oninit`
    - `ComponentA` includes `MyCompScript.bs` and `MyBehaviour.bs`
    - `ComponentB` includes only `MyCompScript.bs`
    - With this setup, the compiler will call `DoSomethingOnInit()` in the `Init()` function of `MyCompScript.bs`
    - `ComponentA` would work fine
    - `ComponentB` will have an error, since it doesn't include `MyBehaviour.bs`, but calls `DoSomethingOnInit()`
  - For simplicity, the convention in this code base is to always keep the `Init()` function of a component in a bs file of the same name.
    - For example, the `Init()` function of `MyComponent.xml` would live in `MyComponent.bs`
- functions with `@oninit` must have a name.
- functions with `@oninit` must have no arguments.

## Bindings

**[Source](/tools/bs-plugins/bindings-plugin.ts)**

This plugin allows us to "bind" different node references together. It's a simple form of dependency injection to manage dependencies between nodes.

### Why

Consider a real (but simplified) example from Playlet Lib:

```xml
<ApplicationInfo id="ApplicationInfo" />

<Invidious id="Invidious" />

<PlayletWebServer
    id="WebServer"
    port="8888" />
```

The `Invidious` node is able to provide a link that will be used to login. Let's assume it is something like:

```bash
http://192.168.1.2:8888/invidious/login
```

`Invidious` needs to ask `PlayletWebServer` for the server url, and append `/invidious/login`.

To create the url, `PlayletWebServer` needs to get the local ip address from `ApplicationInfo`, to create a string in the form of `http://IP_ADDRESS:PORT`.

These different dependencies need to be managed somehow. Without plugins, a combintion of the following would be necessary:

- `m.top.findNode` (see [ifSGNodeDict.findNode](https://developer.roku.com/en-ca/docs/references/brightscript/interfaces/ifsgnodedict.md#findnodename-as-string-as-object))
  - This is useful to find child nodes, but it is tricky to find parent or sibling nodes
- using the attribute `role` (see [Defining SceneGraph components](https://developer.roku.com/en-ca/docs/developer-program/core-concepts/xml-components/defining-scenegraph-components.md))
  - This is also shortcut for assigning a child node to a field, and is pretty limited
- using the attribute value starting with `dictionary:` (see [Defining SceneGraph components](https://developer.roku.com/en-ca/docs/developer-program/core-concepts/xml-components/defining-scenegraph-components.md))
  - The `dictionary:` is close in functionality to what we want, but it is heavily dependent on the order of the defined nodes, and pretty limited in terms of what it can do.

With this plugin, it is simple to assign the dependencies on each node by using special annotations:

```xml
<ApplicationInfo id="ApplicationInfo" />

<Invidious id="Invidious"
    webServer="bind:../WebServer" />

<PlayletWebServer
    id="WebServer"
    port="8888"
    applicationInfo="bind:../ApplicationInfo" />
```

And now `Invidious` has a reference to the `WebServer`, and the `WebServer` has a reference to the `ApplicationInfo`.
Nodes can reference other nodes they depend on by describing the path to reach said nodes.

### How

An important thing to know about nodes lifecycle is that child node get created and initialized first. This means when `Init()` gets called, the children of a node are ready, but the node itself is not attached to its parent yet.

This makes it difficult to prepare references between nodes at `Init()` time, if the nodes are siblings for example. This is why we introduce a different lifecycle event to nodes: `OnNodeReady()`.

With that in mind, let's dive into it.

#### Using the "AutoBind" component part

In the [Includes](#includes) plugin, we talked about how to include different parts into a component. For binding, the part `AutoBind` is required, since it contains the logic to do binding.

```xml
<component name="MyComponent" extends="Group" includes="AutoBind">
</component>
```

#### Two types of binding references

The plugin introduces two types of binds:

- In Component field references

This is done at the declaration level of a field in a node. For example:

```xml
<component name="MyComponent" extends="Group" includes="AutoBind">
    <interface>
        <!-- Tries to find a sibling to the current node, with a node ID "AppController" -->
        <field id="appController" type="node" bind="../AppController" />
    </interface>
</component>
```

- In Component child declarations. For example

```xml
<component name="MyComponent" extends="Group" includes="AutoBind">
    <children>
        <!-- Tries to find a sibling to Node1, with a node ID "Node2" -->
        <Group id="Node1" field1="bind:../Node2" />
        <!-- Tries to find a sibling to Node2, with a node ID "Node1" -->
        <Group id="Node2" field1="bind:../Node1" />
    </children>
</component>
```

Note that even though it looks like this is not valid xml declarations, the plugin will take care of transpiling to correct SceneGraph components.

#### Defining paths

Paths are used in both types of bindings are used to describe the relative (or absolute) of the nodes. They are very similar to unix file system paths.

- `.` indicates the current node
- `..` indicates the parent node
- `/` indicates the scene node when used at the start of the path
- Anything else indicates the ID of the node we're looking for.

This means `/Node1/../Node2/./Node3` would translate to:

```brighterscript
node = m.top.getScene()       ' "/"
node = node.findNode("Node1") ' "Node1"
node = node.getParent()       ' ".."
node = node.findNode("Node2") ' "Node2"
node = node                   ' "."
node = node.findNode("Node3") ' "Node3"
```

Note that since we use `findNode`, it means finding a node by ID can dig multiple levels into a node.

#### Control flow

Let's go step by step on what happens at compile time, and at runtime.

Consider this component:

```xml
<component name="MyComponent" extends="Group" includes="AutoBind">
    <interface>
        <field id="appController" type="node" bind="../AppController" />
    </interface>
    <children>
        <Group id="Node1" field1="bind:../Node2" />
        <Group id="Node2" field1="bind:../Node1" />
    </children>
</component>
```

First, the plugin generate a structure describing the bindings that need to be done, and generates this function

```brighterscript
@oninit
function InitializeBindings()
    m.top.bindings = {
        fields: {
            "appController": "../AppController"
        },
        childProps: {
            "Node1": {
                "field1": "../Node2"
            },
            "Node2": {
                "field1": "../Node1"
            }
        }
    }
end function
```

Notice how the function has `@oninit`, which means it will be called in the `Init()` function.

When the `bindings` field is set, the node registers itself to a global array of nodes that need binding.

Next, once all nodes are registered, we need to call a function called `AutoBindSceneGraph()`. This need to be called once from the root node's `Init()` (concretely, [here](https://github.com/iBicha/playlet/blob/bea7fb209b2bd42aff620d06b416cf1e45988190/playlet-lib/src/components/MainScene.bs#L17))

`AutoBindSceneGraph()` will loop through all the nodes that require binding, and use the information we assigned to `m.top.bindings` of each node to populate all the needed references.

Next, all fields of type node will be added to the component scope `m`. This means if you have a field named `field1`, you can access it with `m.field1` in addition to `m.top.field1`. This is just for conveninece.

Finally, the `AutoBindSceneGraph()` will signal to all `AutoBind` nodes that bindings are ready, by setting the field `binding_done`, and calling the function `OnNodeReady()`

So in most cases, we use `Init()` as a first step of initialization where all child nodes are ready, but not all dependencies, while `OnNodeReady()` indicates that everything is ready for use, and that nodes can call dependency nodes.

#### Dynamically created nodes

We've talked about nodes that are mostly declared in the `xml` files. What about dynamically created nodes with the `CreateObject` function? There's a pattern for that as well:

```brighterscript
' Create a component
myNode = CreateObject("roSGNode", "MyComponent")
' Add it to the right parent
myParentNode.appendChild(myNode)
' Trigger the binding manually
myNode@.BindNode()
```

calling `BindNode` will trigger all the binding steps just for this node. But it is expected that all its dependencies are already in the scene and can be found.

## Async Task Generator

**[Source](/tools/bs-plugins/asynctask-plugin.ts)**

This plugin generates `Task` components a scripts that makes it simpler to call a function in a background thread, and get the result in a callback function.

### Why

To implement functionality that runs in background threads, [Task](https://developer.roku.com/en-ca/docs/references/scenegraph/control-nodes/task.md)s must be used.

Setting up a task involves lots of boilerplate: setting up the task in an xml file, defining inputs and outputs, code to listen for a task to finish, and so on.

Additionally, there's no standard way to do error handling, cancellation, and so on.

### How

Use a function with the attribute `@asynctask`.

In a separate file, define the task function:

```brighterscript
@asynctask
function MyBackgroundTask(input as object) as object
    myVar = input.myVar

    value = DoWork(myVar)

    return {
        value: value
    }
end function
```

And use the function like so

```brighterscript
import "pkg:/source/AsyncTask/Tasks.bs"
import "pkg:/source/AsyncTask/AsyncTask.bs"

AsyncTask.Start(Tasks.MyBackgroundTask, {myVar: "some input"}, function(output as object) as void
    if output.success
      print(output.result.value)
    end if
end function)
```

The rest will be taken care of by the plugin, which will generate an `xml` file containing the task component, and a script that handles calling the function.

Although very useful, this pattern might not be the best for long running tasks (like the Web Server) or other tasks that require task reuse. This is because `AsyncTask.Start` create a new instance of the task every time.

## Tracking transpilied files

**[Source](/tools/bs-plugins/track-transpiled-plugin.ts)**

By now, you realize we make a lot of transformations to the source code through many plugins. As a sanity check, this plugin allows us to keep track of the transpiled files, so we can be sure that the output is what we expect.

### Why

This is useful to catch errors with the plugin usage, of bugs with the plugins themselves.

### How

When transpiling a file, say `MyComponent.xml`, the plugin will see if there is a `MyComponent.transpiled.xml` right next to it in the source.
If a file is found, then the transpiled file of `MyComponent.xml` will be copied back from the staging folder to `MyComponent.transpiled.xml`.

Additionally, if there's a folder `MyFolder` and `MyFolder.transpiled` in the source, then all transpiled files of `MyFolder` will also be copied back to `MyFolder.transpiled`. Keeping track of entire folders is primarily to track of transpiled files of test nodes and scripts.

To reduce the noise of this plugin, it only runs when we're making a test build.

Because we continiously make test build in Github actions, the tracked transpilied files will be automatically added to PRs, so that we notice if outputs do not look right.

## Logger

**[Source](/tools/bs-plugins/logger-plugin.ts)**

### Why

The logger plugin does some code transformation to log calls, which can add caller path at compile time, or the filename, based on debug/release configuration.

### How

The logger plugin searches for calls to the predefined functions `LogError`, `LogWarn`, `LogInfo` and `LogDebug`. Once found, it does the following (we take `LogError` as an example):

- It replaces calls of `LogError` with `LogErrorX` where X is the number of arguments.
  - For example, it replaces `LogError("Cannot complete operation:", error)` with `LogError2("Cannot complete operation:", error)`
- Based on usage, it generates `LogErrorX` functions used. Example:

```brs
function LogError2(arg0, arg1) as void
    logger = m.global.logger
    if logger.logLevel < 0
        return
    end if
    m.global.logger.logLine = "[ERROR]" + ToString(arg0) + " " + ToString(arg1)
end function
```

- Finally, it adds the caller file and line number to the args.
  - `LogError("Cannot complete operation:", error)` is replaced with `LogError(CALLER, "Cannot complete operation:", error)`
  - `CALLER` would be the full path to the source .bs file and line number, for easier debugging
  - In release mode, `CALLER` would be only the file name and line number, without the full path. This is so that dev directory does not get "leaked" in releases.

This is implemented to make it easy to identify where logs came from, and to generate log functions with the right number of parameters based on usage. This way we do not need all combination of functions (`LogError`, `LogWarn`, `LogInfo` and `LogDebug` multiplied by number of parameters, `LogError1`, `LogError2`, `LogError3`, and so on). Since brightscript does not support function templates or function overloading, it is either this method, or use optional parameters (but then we would have to check which parameter was passed, and which was is using the default value.) and end up with a log function with logs of if's else'es.

To understand more about what's being generated, download `playlet-lib.zip` from [releases](https://github.com/iBicha/playlet/releases), extract, and inspect the file `source/utils/Logging.brs`. You will see it contains log functions in the form `LogVerbX`, that are generated based on usage.

To give credit where credit is due, some of the ideas here (like adding the source location to the log) came from [roku-log](https://github.com/georgejecook/roku-log)

## Type Gen

**[Source](/tools/bs-plugins/type-gen-plugin.ts)**

### Why

I found myself implementing type checking functions like `IsBool`, `IsInt`, and `IsString`, and functions for getting a valid type, like `ValidBool`, `ValidInt`, and `ValidString`. The implementation is the same, why not generate them?

### How

Simply we declare them in an object describing the type, the interface, and the default value, and generate all corresponding functions.

Sample output:

```brs
' Returns true if the given object is of type Bool, false otherwise
function IsBool(obj as dynamic) as boolean
    return obj <> invalid and GetInterface(obj, "ifBoolean") <> invalid
end function

' Returns the given object if it is of type Bool, otherwise returns the default value `false`
function ValidBool(obj as dynamic) as boolean
    if obj <> invalid and GetInterface(obj, "ifBoolean") <> invalid
        return obj
    else
        return false
    end if
end function
```

## Web Server

**[Source](/tools/bs-plugins/web-server-plugin.ts)**

### Why

Handles routing annotations (e.g. `@get("/api/something")) so that they are handled by the routers/middlewares. It's nicer than having to register things by hand.

### How

Routers need to inherit from `Http.HttpRouter`. Then, once a request handled is annotated, e.g.

```bs
@get("/")
function GoHome(context as object) as boolean
    response = context.response
    response.Redirect("/index.html")
    return true
end function
```

The route and the handler are added to the router. In this example, the `/` route redirects to `index/html`.

There one special annotation, and one special route:

- `@all` matches all methods
- `*` matches all paths

So `@all(*)` would be a middleware that will be matched with any request.

## Locale validation

**[Source](/tools/bs-plugins/locale-validation-plugin.ts)**

### Why

Roku's built-in localization system has some undesired side effects: for example, it might translate node ids, which would break the relationship between the nodes.
This plugin enforces some rules to ensure translation files are kept up to date with code implementation.
See the next section for the validation rules.

### How

The plugin checks for the following:

- Translated words and sentenses are defined in an enum annotated with `@locale`
- All the values in the `@locale` enums must be provided in the English (`en_US`) translation. This is because `en_US` is the fallback translation when the current localte translations are not complete.
- `en_US` must have matching source and translation values, so it can act as a fallback translation.
- All `source` translations from all languages must be present in the `@locale` enums. This is to prevent renaming the values in the code without updating translation files.
- Translation `source` keys can't be used except for certain fields such as `"text"` and `"title"`. This is to prevent the accidental localization of non-display fields, such as node ids.

## Protobuf Generator

**[Source](/tools/bs-plugins/proto-gen-plugin.ts)**

### Why

To generate BrighterScript encoding/decoding functions for Protobuf types.
These are needed for some functionality (e.g. Search filters in Innertube backend)

### How

The plugin scans for `.proto` files, and parse them into plain objects using [protocol-buffers-schema](https://www.npmjs.com/package/protocol-buffers-schema)
Then the right functions that get generated to serialize/deserialize types.
Please note this generator is VERY bare bone: only features necessary for Playlet were implemented.
The generation can be improved as needed.
