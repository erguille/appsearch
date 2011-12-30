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
    },

    getInitialResultSet: function(terms) { 
        for (let i=0; i<terms.length; i++) {
            // command line injection possible so santize
            if ( ! ( /^[-.,_0-9a-zA-Z]+$/.test(terms[i]) ) ) {
                return [];
            }
            let searched_app_name = terms[i];
            let argv = ["apt-cache","-q=2","-n","show",searched_app_name];
            let [success,pid,stdin,stdout,stderr] = 
                GLib.spawn_async_with_pipes(null,
                   argv,null,
                   GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                   null,null);
            if (!success) { return []; }

            let stream_stdin = new Gio.UnixOutputStream( { fd: stdin } );
            let stream_stdout = new Gio.UnixInputStream( { fd: stdout } );
            let stream_data_stdout = new Gio.DataInputStream( { base_stream: stream_stdout } );
            let stream_stderr = new Gio.UnixInputStream( { fd: stderr } );
                       
            this.startAsync();
            let _self = this;
            // close stream_stdin, stream_stdout, stream_stderr in the callback
            GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function(pid, status) {
                stream_stdin.close(null);
                stream_stderr.close(null);
                let count = 0;
                while (true) {
                    let [line,length] = stream_data_stdout.read_line(null);
                    //if (line.indexOf("Package") == 0 ) {
                    //    global.log("hit");
                    //}
                    count += 1;
                    if ( line == null ) { break; }
                }
                global.log(count);
                stream_stdout.close(null);
                GLib.spawn_close_pid(pid);
                if (status == 0) {
                    _self.addItems([searched_app_name]);
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
    	let args = ["apturl","apt://"+resultId];
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
