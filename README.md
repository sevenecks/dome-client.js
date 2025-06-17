dome-client.js
==============

This application is an open source socket.io / browser-based MUD/MOO client with SSL support and an integrated local editor that works out of the box with most MOO/MUD servers. It was designed for LambdaMOO / ToastStunt, but that doesn't stop it working for other games.

This is designed for games to provide to their players. Requires no flash. Requires no java plugin. Connections from end user's browser to the server occur via web socket to the node web application, which manages socket connections to the game itself.

## Check it out online
You can see a version of this running that will connect to whatever game you want here: https://pubclient.sindome.org/

You are free to use that public client as much as you want! In fact, it's the default client for connecting to games on http://www.mudverse.com/

## Requirements

1. nodejs (16+ recommended but may run on earlier versions)
2. npm

## Installation

* Run `npm install` to fetch the required node modules. You may need to run this as root.
* Copy `.env-example` to `.env` and modify it to your liking
* create log directory: sudo mkdir /var/log/dome-client
* sudo chmod 777 /var/log/dome-client
* create log file: sudo touch /var/log/dome-client/dome-client.js.log

## Starting the Server in Debug Mode
* `./debug.sh` or `sudo ./debug.sh`

## Starting the server in production mode as root
1. sudo nohup ./run.sh &

## Dealing with Port 80 and Root
If you want to use port 80 you need to run your node application as root or you need to allow node access to that port, which it doesn't seem to have out of the box. You can find more information on how to accomplish this here: https://stackoverflow.com/questions/413807/is-there-a-way-for-non-root-processes-to-bind-to-privileged-ports-on-linux

Below are also instructions for doing it on Ubuntu.

### Ubuntu Instructions
1. sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\`` <-- this allows node to open on port 80
2. sudo chown ubuntu:ubuntu css <- this allows node to write in the /public/css folder

## Features
* Connect to any MUD game that supports telnet/terminal connections
* Public / Private configuration, you can set the client to allow connections to any games (specified by user) or lock your dome-client to a specific game
* The client runs in the browser, meaning your players don't have to download anything
* Support for SSL connections
* Support for locally hosted command hints. Type a few characters and Command Hints will popup, specific to your role in Sindome (guests, players and staff). Forgetting a command doesn't have to be so frustrating for experienced players and new players can find commands much easier than ever.
* We Remember Input For You, Wholesale. Some telnet clients remember your commands as you play. Unfortunately, as soon as you close the program, all that history is gone. Our Webclient remembers the last 2000 commands you've entered. Browser crash? Power failure? No problem, we use HTML 5's local storage API and (once again) your modern web browser to keep those commands as long as you want us to.
* Lucid Logging. Full Color. Every time you disconnect from the game, you're giving an option to save your experience as an HTML-based log file. This keeps the full context of what you said and what you witnessed. Every color we support is preserved exactly as it was.
* Local Editing of files / properties / verbs. If you're connected to a MOO and you set @edit-options +local you should be able to edit verbs in the local edtior. The game you're using can actually ship any text to the local editor and a command that it should execute upon 'save'. Double click the screen to pause / unpause the scroll
* Object Number & Corified Reference selection on click (for easy copy and paste)

## Passthrough Identification of Player IP/Hostname
Running a webclient can be fun, but you may also be concerned about providing one that does not identify the player who is using it by their IP, since the IP that would show as connecting to the game would be the IP of the webclient server. That can be handled by the game. If you game sends the text: '#$# dome-client-user' the webclient running for the player will send @dome-client-user <IP or hostname>.

## Client Options
You can set client options on the client options page, but you can also use @client-options at any time to set various client options.

## Keyboard Shortcuts

### In the Main Window
* end: pause/unpause the scroll
* home: return focus to input area
* insert: open a window to send a command to the game without touching current text in input area

### In the Code editor
* control|command + 1 will turn on VIM mode and keybindings (acejs)
* control|command + 0 will turn off VIM mode
* control|command + s will send the current code/text to the game, same as if you hit the save button

## Local Modal Editing
This feature allows you to edit files locally in a modal window. The window has MOO Syntax highlighting and uses the [Ace editor](https://ace.c9.io/) which is excellent and can be extended pretty easily if you want to add things like VIM support or custom macros. The syntax for doing local modal editing is something like this:
```
`@edit obj:verb`
```
Or, for a property:
```
`@edit obj.prop`

On most LambdaMOO servers you can `@edit-options +local` and this feature will 'just work'. If your game doesn't support that, the code / instructions for adding Local Editing can be found here: https://github.com/SevenEcks/lambda-moo-programming/blob/master/code/LocalEditing.md
```

### Command Hints Customization

The code comes bundled with a set of command hints that are common to many MOO's, but every game is different. If you want to customize the command hints it's easy. Just edit config/ac/player.txt and add/remove whatever command hints you want. When a player starts typing a command, the web client will pop up an overlay that shows possible commands, and lets them use up/down arrows + enter to autocomplete! There is also built in support for config/ac/guest.txt to handle guest players.

## Linting
If you want a lint a file you need npx because that's the only way I got it to work. If you want to come up with a better linting solution for this code, I am open to pull requests!

npx eslint <file>

### No Software Required For Your Players

Works on a Mac, works on a PC. Use our Webclient without relying on Flash plugins or Java applets, those things are buggy and expose you to security risks. HTML 5 is available in all modern browsers, we already have all the technology we need. And since there isn't anything you need to install, you can log on from your office even if you can't install new software.

### Command Hints & Autocomplete for Players

Type a few characters and a Command Hints overlay will popup. Forgetting a command doesn't have to be so frustrating for experienced players and new players can find commands much easier than ever.

### Command History for Players

Some telnet clients remember your commands as you play. Unfortunately, as soon as you close the program, all that history is gone. This Webclient remembers the last 2000 commands you've entered. Browser crash? Power failure? No problem, we use HTML 5's local storage API and (once again) your modern web browser to keep those commands as long as you want us to.

### Lucid Logging. Full Color.

Every time you disconnect from the game, you're giving an option to save your experience as an HTML-based log file. This keeps the full context of what you said and what you witnessed. Every color we support is preserved exactly as it was.
