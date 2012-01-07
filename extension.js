// inspired by github.com/brot/gnome-shell-extension-sshsearch/
// licence GPLv3
// author: Lukas Vacek <lucas.vacek@gmail.com>

// Ububtu, Debian, Linux Mint 12, and PackageKit supported
// uses apt-cache show to search for packages
// If apt-cache is not available, packagekit used instead
// uses mint-make-cmd to install
// /usr/share/gnome-shell/js/ui/search.js for API docs :-)
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Search = imports.ui.search;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
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
        this.mode = "apt";
    },

    getInitialResultSet: function(terms) { 
        for (let i=0; i<terms.length; i++) {
            // command line injection possible so santize
            if ( ! ( /^[-.,_0-9a-zA-Z]+$/.test(terms[i]) ) ) {
                return [];
            }
            let searched_app_name = terms[i];
            this.searched_app_name = searched_app_name;
            let argv;
            if (this.mode == "apt") {
                argv = ["apt-cache","-q=2","-n","show",searched_app_name];
            } else if (this.mode == "pkcon") {
                // 'get-depends' is slow (still sort of acceptable ...)
                // 'resolve' is faster - but doesnt return exit code > 0 on fail
                // plus we cant process its output because of 
                // https://bugzilla.gnome.org/show_bug.cgi?id=667069
                argv = ["pkcon","-p","get-depends",searched_app_name];
            }
            let [success,pid] = 
                GLib.spawn_async(null,
                   argv,null,
                   GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                   null,null);
            if (!success) { return []; }

            this.startAsync();
            let _self = this;
            GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function(pid, status) {
                GLib.spawn_close_pid(pid);
                if (status == 0) {
                    if (_self.searched_app_name == searched_app_name) {
                        _self.addItems([searched_app_name]);
                    }
                }
            });
        }
        return [];
    },

    getSubsearchResultSet: function(prevResults, terms) {
        this.tryCancelAsync();
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
        let args;
        if (this.mode == "apt") { 
    	    args = ["apturl","apt://"+resultId];
        } else if (this.mode == "pkcon") {
            args = ["gpk-install-package-name",resultId];
        }
	    Util.spawn(args);
    },

    setMode: function(mode) {
        this.mode = mode;
    }
}

function init() {
    appSearchProvider = new AppSearchProvider('APP SEARCH');
    let mode = "apt";
    let ret,stdout,stderr,which_apt_cache,which_apturl;
    [ret,stdout,stderr,which_apt_cache] = GLib.spawn_command_line_sync("which apt-cache");
    [ret,stdout,stderr,which_apturl] = GLib.spawn_command_line_sync("which apturl");
    if (which_apt_cache != 0 || which_apturl != 0) {
        let which_pkcon,which_gpk;
        [ret,stdout,stderr,which_pkcon] = GLib.spawn_command_line_sync("which pkcon");
        [ret,stdout,stderr,which_gpk] = GLib.spawn_command_line_sync("which gpk-install-package-name");
        if (which_pkcon == 0 && which_gpk == 0) {
            mode = "pkcon";
        }
    }
    appSearchProvider.setMode(mode);
}

function enable() {
    Main.overview.addSearchProvider(appSearchProvider);
}

function disable() {
    Main.overview.removeSearchProvider(appSearchProvider);
}
