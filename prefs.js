const St = imports.gi.St;
const Gtk = imports.gi.Gtk;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Me.imports.lib;

let settings;
let settings_bool;
let settings_range;
let settings_slider;
let settings_combo;
let settings_switch;
let settings_text;
let slider_label;


// Let's have a global place where to store the settings
//let Me = imports.misc.extensionUtils.getCurrentExtension();

function init() {
    settings = Lib.getSettings(Me);    
    //settings_combo = {
    //    position: { label : "Extension position",help : "Extension position"
    //                      }
    //};
    settings_text = {
        "gpii-start": {
            label: "Location of the GPII init script",
            help: "Location of the GPII init script"
        }
    };
    settings_slider = {
        "poll-time": {
            label: "Check logged in user every {0} seconds",
            help: "Check logged in user every {0} seconds"
        }
    };
    //settings_switch = {
    //      "usemail": { label: "Use default email client instead of browser", help: "Use default email client instead of browser"
    //                   },
    //      "notify" : { label: "Notify about incoming mail", help: "Notify about incoming mail"
    //                   },
    //      "showsummary" : { label: "Show email summary", help: "Show email summary"
    //                   },
    //      "safemode" : { label: "Safe Mode", help: "Safe mode"
    //                   }                                       
    //};
}

//function createComboSetting(setting) {
//
//        let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
//        let setting_label = new Gtk.Label({label: settings_combo[setting].label,
//                                       xalign: 0 });
//        let setting_combo = new Gtk.ComboBoxText({});
//        setting_combo.append("right","Right");
//        setting_combo.append("left","Left");
//        setting_combo.append("center","Center");
//        setting_combo.set_active_id(settings.get_string(setting))
//        setting_combo.connect('changed', function(button) {
//                settings.set_string(setting, button.get_active_id());
//        });
//        if (settings_combo[setting].help) {
//                setting_label.set_tooltip_text(settings_combo[setting].help)
//                setting_combo.set_tooltip_text(settings_combo[setting].help)
//        }
//        hbox.pack_start(setting_label, true, true, 0);
//        hbox.add(setting_combo);
//        return hbox;
//}

function createSwitchSetting(setting) {

    let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
    let setting_label = new Gtk.Label({label: settings_switch[setting].label,
                                       xalign: 0 });                        
    let setting_switch = new Gtk.CheckButton({});
    setting_switch.active = (settings.get_int(setting) == 1) ? true :false;
    setting_switch.connect('toggled', function(button,data) {               
        try {                   
            settings.set_int(setting, (button.active) ? 1 : 0);
        } catch (err) {                   
                
        }
    });
    if (settings_switch[setting].help) {
        setting_label.set_tooltip_text(settings_switch[setting].help)
    }
    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(setting_switch);
    return hbox;
}

function createSliderSetting(setting) {

    let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
    let slider_label = new Gtk.Label({label: settings_slider[setting].label,
                                      xalign: 0 });
    slider_label.label = "Check logged in user every " + settings.get_int(setting).toString()  + " seconds";

    let setting_slider =  Gtk.Scale.new_with_range(0,1,300,1);
    setting_slider.set_value(settings.get_int(setting));
    setting_slider.expand = true;
    setting_slider.connect('value-changed', function(button,data) {         
        try {                   
            let i = Math.round(button.get_value());
            slider_label.label="Check logged in user every {0} seconds".replace('{0}', i.toString());
            settings.set_int(setting, i);
        } catch (err) {

        }
    });
    if (settings_slider[setting].help) {
        slider_label.set_tooltip_text(settings_slider[setting].help)    
    }
    hbox.pack_start(slider_label, false, false, 5);
    hbox.add(setting_slider);
    return hbox;
}

function createTextSetting(setting) {

    let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
    let setting_label = new Gtk.Label({label: settings_text[setting].label,
                                       xalign: 0 });
    let setting_text = new Gtk.Entry({});
    setting_text.expand = true;
    setting_text.text = settings.get_string(setting);
    setting_text.connect('changed', function(button,direction) {
        settings.set_string(setting, button.text );
    });
    setting_text.connect('button-press-event', function (a, b) {
        chooser = new Gtk.FileChooserDialog({ 
            action: Gtk.FileChooserAction.OPEN,
            select_multiple: false,
            title: 'Select GPII init script'
        });

        chooser.add_button('Cancel', Gtk.ResponseType.CANCEL);
        chooser.add_button('OK', Gtk.ResponseType.OK);

        result = chooser.run();
        name = chooser.get_filename();

        chooser.destroy();
        settings.set_string(setting, name);
        setting_text.set_text(name);
    });
    if (settings_text[setting].help) {
        setting_label.set_tooltip_text(settings_text[setting].help)
    }
    hbox.pack_start(setting_label, false, false, 25);
    hbox.add(setting_text);
    return hbox;
}

function buildPrefsWidget() {
    let setting;
    let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10, expand: false });
    let vbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin: 5, margin_top: 1, expand: false });
    //for (setting in settings_combo) {
    //      let hbox = createComboSetting(setting);
    //      vbox.add(hbox);
    //}
    //for (setting in settings_switch) {
    //      let hbox = createSwitchSetting(setting);
    //      vbox.add(hbox);
    //}

    for (setting in settings_text) {
        let hbox = createTextSetting(setting);
        vbox.add(hbox);
    }
    for (setting in settings_slider) {
        let hbox = createSliderSetting(setting);
        vbox.add(hbox);
    }

    frame.add(vbox);
    frame.show_all();
    return frame;
}
