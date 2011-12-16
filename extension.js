const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Search = imports.ui.search;

let appSearchProvider;

function init() {
        appSearchProvider = Search.SearchProvider();
}

function enable() {
        Main.overview.addSearchProvider(appSearchProvider)
}

function disable() {
        Main.overview.removeSearchProvider(appSearchProvider)
}
