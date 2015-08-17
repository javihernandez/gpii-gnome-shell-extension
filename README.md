gpii-gnome-shell-extension
==========================

A GNOME-Shell extension for the GPII Personalization Framework

You can build and installing it by running:

	./autogen.sh && make && make install

## gsettings-integration branch

This branch is a prototype of an integration between the GPII and the GNOME shell extension for the GPII.
It includes:

* An xdg-autostart file, located in the  _data_ folder
* A system-wide gsettings schema, located in the _data_ folder 

Currently, the extension:

* Tracks the currently logged-in user by polling the flowManager
* If there's a keyed-in user, the token is shown by the extension and it is possible to log the current user out of the GPII
* The GPII can be start by changing a gsettings key (see _data_ folder)
* There's a button to open the PMT

