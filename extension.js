const Gio = imports.gi.Gio;
const St = imports.gi.St;
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

const DEBUG = false;

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
        let loggedInLabel = new PopupImageMenuItem('No user has logged in yet',
                                          'dialog-warning',
                                          { reactive: false }
        );

        loggedInLabel.actor.set_style("font-style: italic; min-width: 250px;");
        this.menu.addMenuItem(loggedInLabel);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // GPII On/Off
        //
        let gpiiStatus = new PopupMenu.PopupSwitchMenuItem("GPII Status", false);
        this.menu.addMenuItem(gpiiStatus);

        // User Listeners SubMenu
        //
        let userListeners =  new PopupMenu.PopupSubMenuMenuItem("Authentication methods");

        let usbListener = new PopupMenu.PopupSwitchMenuItem("USB Drive", false);
        userListeners.menu.addMenuItem(usbListener);

        let nfcListener = new PopupMenu.PopupSwitchMenuItem("NFC Tag", false);
        userListeners.menu.addMenuItem(nfcListener);

        this.menu.addMenuItem(userListeners);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // PMT/PCP Launchers
        //
        let pmt = new PopupMenu.PopupMenuItem('Start using the GPII');
        this.menu.addMenuItem(pmt);

        let pcp = new PopupMenu.PopupMenuItem('Adjust your current settings');
        pcp.actor.set_reactive(false);
        this.menu.addMenuItem(pcp);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // About GPII
        //
        let about = new PopupMenu.PopupMenuItem('About the GPII');
        this.menu.addMenuItem(about);

        this.menu.actor.set_style("min-width: 200px;");
    },

    enable: function() {
        debug("GPIIExtension.enable()");
        this.__add();
    },

    disable: function() {
        debug("GPIIExtension.disable()");
        this.__remove();
    },

    __add: function() {
        Main.panel._addToPanelBox('gpii', this, 0, Main.panel._rightBox);
        Main.panel.menuManager.addMenu(this.menu);
    },

    __remove: function() {
        Main.panel._rightBox.remove_actor(this.container);
        Main.panel.menuManager.removeMenu(this.menu)
    }
}

function init(extensionMeta) {
    debug("GPIIExtension::init()");
    return new GPIIExtension(extensionMeta);
}
