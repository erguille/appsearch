// inspired by https://github.com/brot/gnome-shell-extension-sshsearch/
// licence GPLv3
// author: Lukas Vacek <lucas.vacek@gmail.com>

// Linux Mint 12 supported
// uses apt-cache showpkg to search for packages
// uses mint-make-cmd to install
// /usr/share/gnome-shell/js/ui/search.js for API docs :-)
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Search = imports.ui.search;

let appSearchProvider;

// inherits from Searc.SearchProvider
function AppSearchProvider() {
	Search.SearchProvider.call(this,"AppSearch"); // call parent constructor
}
// inheritance
AppSearchProvider.prototype = new Search.SearchProvider();
AppSearchProvider.prototype.constructor = AppSearchProvider;
// override methods
AppSearchProvider.prototype.getInitialResultSet = function(terms) {
	return [ "hello" ];
}

AppSearchProvider.prototype.getSubsearchResultSet = function(prevResults,terms) {
	return this.getInitialResultSet(terms);
}

AppSearchProvider.prototype.getResultMeta = function(resultId) {
	return {
		'id':"123",
		'name':"hi there!",
		'createIcon': function(size) {
			return new St.Icon({ 
				'icon_type':St.IconType.FULLCOLOR,
				'icon_size':size,
				'icon_name':"system-software-install"
			});
		}
	};
}

function init() {
	appSearchProvider = new AppSearchProvider();
}

function enable() {
        Main.overview.addSearchProvider(appSearchProvider);
}

function disable() {
        Main.overview.removeSearchProvider(appSearchProvider);
}
