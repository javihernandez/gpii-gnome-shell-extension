const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Soup = imports.gi.Soup;
const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;

// Custom implementation of PopupImageMenuItem to get rid of
// https://bugzilla.gnome.org/show_bug.cgi?id=733540
// TODO: Remove when fixed
// 
const PopupBaseMenuItem = imports.ui.popupMenu.PopupBaseMenuItem;
const PopupImageMenuItem = new Lang.Class({
    Name: 'PopupImageMenuItem',
    Extends: PopupBaseMenuItem,

    _init: function (text, iconName, params) {
        this.parent(params);

        this._icon = new St.Icon({ style_class: 'popup-menu-icon' });
        this.actor.add_child(this._icon, { align: St.Align.START });

        this.label = new St.Label({ text: text });
        this.actor.add_child(this.label);

        this.setIcon(iconName);
    },

    setIcon: function(name) {
        this._icon.icon_name = name;
    }
});

// Common debug and initialisation utilities and variables
//
const DEBUG = true;

function debug(message)
{
    if (DEBUG) log(message);
}

function GPIIExtension(extensionMeta) {
    this._init.apply(this, [extensionMeta]);
}

GPIIExtension.prototype = {
    __proto__: PanelMenu.Button.prototype,
    
    run: false,

    _init: function(extensionMeta){
        debug("GPIIExtension._init()");

        PanelMenu.Button.prototype._init.call(this, 0);
        this.extensionMeta = extensionMeta;

        // Create a Soup session
        //session = Soup.Session.new();

        // Set-up Icon
        //
        iconPic = Gio.icon_new_for_string(extensionMeta.path +
                                          "/icons/gpii-logo-symbolic.svg");

        icon = new St.Icon({
            style_class: 'system-status-icon',
            gicon: iconPic
        });
        icon.set_icon_size(22);

        this.actor.add_actor(icon);

        /* Menu items of the extension */

        // Current User
        //
        this.loggedInLabel = new PopupImageMenuItem(
            'No user has logged in yet',
            'dialog-warning',
            { reactive: false }
        );

        this.loggedInLabel.actor.set_style("font-style: italic; min-width: 250px;");
        this.menu.addMenuItem(this.loggedInLabel);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // GPII On/Off toggle
        //
        let gpiiStatus = this._buildGpiiToggle("GPII Status", "net.gpii", "gpii-enabled"); 
        this.menu.addMenuItem(gpiiStatus);

        //// User Listeners SubMenu
        ////
        //let userListeners =  new PopupMenu.PopupSubMenuMenuItem("Authentication methods");

        //let usbListener = new PopupMenu.PopupSwitchMenuItem("USB Drive", false);
        //userListeners.menu.addMenuItem(usbListener);

        //let nfcListener = new PopupMenu.PopupSwitchMenuItem("NFC Tag", false);
        //userListeners.menu.addMenuItem(nfcListener);

        //this.menu.addMenuItem(userListeners);

        //this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // PMT/PCP Launchers
        //
        let pmt = new PopupMenu.PopupMenuItem('Preferences Management Tool');
        pmt.connect('activate', Lang.bind(this, this._onPMTActivate));
        this.menu.addMenuItem(pmt);

        //let pcp = new PopupMenu.PopupMenuItem('Adjust your current settings');
        //pcp.actor.set_reactive(false);
        //this.menu.addMenuItem(pcp);

        this.logout = new PopupMenu.PopupMenuItem('Log Out');
        this.logout.connect('activate', Lang.bind(this, this._onLogoutActivate));
        this.logout.actor.hide();
        this.menu.addMenuItem(this.logout);


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // About GPII
        //
        let about = new PopupMenu.PopupMenuItem('About the GPII');
        about.connect('activate', Lang.bind(this, this._onAboutGpiiActivate));
        this.menu.addMenuItem(about);

        this.menu.actor.set_style("min-width: 200px;");

        // Check if a user is already logged in every 2.5 secs
        //
        Mainloop.timeout_add(2500, Lang.bind(this, this._checkLoggedInUsers));
    },

    enable: function() {
        debug("GPIIExtension.enable()");
        this.__add();
    },

    disable: function() {
        debug("GPIIExtension.disable()");
        this.__remove();
    },

    _onPMTActivate: function () {
        try {
            var cmd = "firefox http://localhost:5559/demos/prefsEditor/index.html";
            GLib.spawn_command_line_async(cmd, null);
        } catch (e) {
            throw e;
        }
    },

    _onAboutGpiiActivate: function () {
        try {
            var cmd = "firefox http://gpii.net"
            GLib.spawn_command_line_async(cmd, null);
        } catch (e) {
            throw e;
        }
    },

    _onLogoutActivate: function () {
        session = Soup.Session.new();
        msg = Soup.Message.new("GET", "http://localhost:8081/user/" + this.__loggedInUserToken + "/logout");
        session.queue_message(msg, Lang.bind(this, function (a, b) {
            debug("Logged out " + this.__loggedInUserToken);
        }));
    },

    _buildItemExtended: function(string, initial_value, writable, on_set) {
        let widget = new PopupMenu.PopupSwitchMenuItem(string, initial_value);
        if (!writable)
            widget.actor.reactive = false;
        else
            widget.connect('toggled', function(item) {
                on_set(item.state);
            });
        return widget;
    },

    _buildGpiiToggle: function(string, schema, key) {
        let settings = new Gio.Settings({ schema: schema });
        let widget = this._buildItemExtended(string,
            settings.get_boolean(key),
            settings.is_writable(key),
            function(enabled) {
                return settings.set_boolean(key, enabled);
            });
        settings.connect('changed::'+key, Lang.bind(this, function() {
            widget.setToggleState(settings.get_boolean(key));
            if (settings.get_boolean(key) === false) {
                try {
                    let [res, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(null,
                        ['/usr/bin/pgrep', '--full', 'node\ gpii.js'],
                        null,
                        0,
                        null);

                    let out_reader = new Gio.DataInputStream({
                        base_stream: new Gio.UnixInputStream({'fd': out_fd})
                    });

                    let [pidId, size] = out_reader.read_line(null);
                    GLib.spawn_command_line_async('kill -9 ' + pidId, null);
                } catch (e) {
                    throw e;
                }
            }
        }));
        return widget;
    },

    _checkLoggedInUsers: function () {
        session = Soup.Session.new();
        msg = Soup.Message.new("GET", "http://localhost:8081/userToken");
        session.queue_message(msg, Lang.bind(this, this._getUserTokenCb));
        return true;
    },

    _getUserTokenCb: function (session, msg, data) {
        var isJSON = msg.response_body.data.charAt(0) === "{" ? true: false;

        if (isJSON) {
            var res = JSON.parse(msg.response_body.data);
            if (res.isError) {
                this.__loggedInUserToken = null;
                this.logout.actor.hide();
                this.loggedInLabel.label.set_text("No user has logged in yet");
                this.loggedInLabel.actor.set_style("font-style: italic; min-width: 250px;");
                this.loggedInLabel.setIcon("dialog-warning");
            }
        } else {
            var userToken = eval(msg.response_body.data);
            this.__loggedInUserToken = userToken;
            this.logout.actor.show();
            if(Object.prototype.toString.call(userToken) === '[object Array]') {
                this.loggedInLabel.label.set_text("Current user: " + userToken);
                this.loggedInLabel.actor.set_style("font-style: normal; font-weight: bold; min-width: 250px;");
                this.loggedInLabel.setIcon("avatar-default");
            }
        }
    },

    __add: function() {
        Main.panel._addToPanelBox('gpii', this, 0, Main.panel._rightBox);
        Main.panel.menuManager.addMenu(this.menu);
    },

    __remove: function() {
        Main.panel._rightBox.remove_actor(this.container);
        Main.panel.menuManager.removeMenu(this.menu)
    },

    __loggedInUserToken: null
}

function init(extensionMeta) {
    debug("GPIIExtension::init()");
    return new GPIIExtension(extensionMeta);
}
