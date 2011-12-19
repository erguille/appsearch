// inspired by github.com/brot/gnome-shell-extension-sshsearch/
// licence GPLv3
// author: Lukas Vacek <lucas.vacek@gmail.com>

// Linux Mint 12 supported
// uses apt-cache show to search for packages
// uses mint-make-cmd to install
// /usr/share/gnome-shell/js/ui/search.js for API docs :-)
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Search = imports.ui.search;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;

let appSearchProvider;

function AppSearchProvider() {
    this._init.apply(this, arguments);
}

AppSearchProvider.prototype = {
    // inherits from Search.SearchProvider
    __proto__: Search.SearchProvider.prototype,

    _init: function(title) {
        Search.SearchProvider.prototype._init.call(this, title);
    },

    getInitialResultSet: function(terms) { 
        for (let i=0; i<terms.length; i++) {
            // command line injection possible so santize
            if ( ! ( /^[-.,_0-9a-zA-Z]+$/.test(terms[i]) ) ) {
                return [];
            }
            let argv = "apt-cache -q=2 -n show "+terms[i];
            let [res, out, err, return_code] = GLib.spawn_command_line_sync(argv);
            if (return_code == 0) {
                return [ terms[i] ];
            }
        }
        return [];
    },

    getSubsearchResultSet: function(prevResults, terms) {
        return this.getInitialResultSet(terms);
    },

    getResultMeta: function(resultId) {
        return {
            'id': resultId,
            'name': resultId,
            'createIcon': function(size) {
                return new St.Icon({ 
                    'icon_type':St.IconType.FULLCOLOR,
                    'icon_size':size,
                    'icon_name':"system-software-install"
                });
            }
        };
    },

    activateResult: function(resultId) {
    	let args = ["mint-make-cmd",resultId];
	    Util.spawn(args);
    }
}

function init() {
    appSearchProvider = new AppSearchProvider('APP SEARCH');
}

function enable() {
    Main.overview.addSearchProvider(appSearchProvider);
}

function disable() {
    Main.overview.removeSearchProvider(appSearchProvider);
}
