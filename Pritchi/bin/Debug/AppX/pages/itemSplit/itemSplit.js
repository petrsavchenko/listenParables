(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var binding = WinJS.Binding;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    // The selected item
    var pritch;
    var listView = null;
    var currentItemIndex;
    var playButtons = [];
    var playChar = "";
    var pauseChar = "";

    ui.Pages.define("/pages/itemSplit/itemSplit.html", {

        /// <field type="WinJS.Binding.List" />
        _items: null,
        _group: null,
        _itemSelectionIndex: -1,

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            listView = element.querySelector(".itemlist").winControl;
            playButtons = [];
            // Store information about the group and selection that this page will
            // display.
            this._group = (options && options.groupKey) ? Data.resolveGroupReference(options.groupKey) : Data.groups.getAt(0);
            this._items = Data.getItemsFromGroup(this._group);
            this._itemSelectionIndex = (options && "selectedIndex" in options) ? options.selectedIndex : -1;
            currentItemIndex = this._itemSelectionIndex;

            // Get the first item, which is the default selection
            pritch = this._items.getAt(Math.max(this._itemSelectionIndex, 0));
            element.querySelector("header[role=banner] .pagetitle").textContent = this._group.title;

            //mediaControls = Windows.Media.MediaControl;
            //mediaControls.addEventListener("playpausetogglepressed", playpause, false);
            //mediaControls.addEventListener("playpressed", play, false);
            //mediaControls.addEventListener("pausepressed", pause, false);
            //mediaControls.addEventListener("stoppressed", stop, false);


            // Set up the ListView.
            listView.itemDataSource = this._items.dataSource;
            //listView.itemTemplate = element.querySelector(".itemtemplate");
            listView.itemTemplate = pritchTemplate;
            listView.onselectionchanged = this._selectionChanged.bind(this);
            listView.layout = new ui.ListLayout();
            
            var playlist = Data.getPlaylistFromGroup(this._group);
            Audtag.createPlaylist(playlist);

            this._updateVisibility();
            if (this._isSingleColumn()) {
                //if (this._itemSelectionIndex >= 0) {
                //    // For single-column detail view, load the article.
                //    binding.processAll(element.querySelector(".articlesection"), this._items.getAt(this._itemSelectionIndex));
                //}
            } else {
                if (nav.canGoBack && nav.history.backStack[nav.history.backStack.length - 1].location === "/pages/itemSplit/itemSplit.html") {
                    // Clean up the backstack to handle a user snapping, navigating
                    // away, unsnapping, and then returning to this page.
                    nav.history.backStack.pop();
                }
                // If this page has a selectionIndex, make that selection
                // appear in the ListView.
                //listView.selection.set(Math.max(this._itemSelectionIndex, 0));
                ////listView.currentItem = { index: this._itemSelectionIndex, hasFocus: true, showFocus: true };
                //listView.indexOfFirstVisible = Math.max(this._itemSelectionIndex - 2, 0);
                listView.selection.set(Math.max(this._itemSelectionIndex, 0));
                listView.indexOfFirstVisible = Math.max(this._itemSelectionIndex - 2, 0);
                Audtag.currentSongIndex = Math.max(this._itemSelectionIndex, 0);
                Audtag.setCurrentPlaying(Math.max(this._itemSelectionIndex, 0));
                Audtag.playpause();
            }
            //var audtag = document.getElementById("audtag");
            //audtag.addEventListener("play", play, false);
            ////audtag.addEventListener("canplay", canplay, false);
            //audtag.addEventListener("pause", pause, false);
        },

        unload: function () {
            this._items.dispose();
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = element.querySelector(".itemlist").winControl;
            var firstVisible = listView.indexOfFirstVisible;
            this._updateVisibility();

            var handler = function (e) {
                listView.removeEventListener("contentanimating", handler, false);
                e.preventDefault();
            }

            if (this._isSingleColumn()) {
                listView.selection.clear();
                if (this._itemSelectionIndex >= 0) {
                    // If the app has snapped into a single-column detail view,
                    // add the single-column list view to the backstack.
                    nav.history.current.state = {
                        groupKey: this._group.key,
                        selectedIndex: this._itemSelectionIndex
                    };
                    nav.history.backStack.push({
                        location: "/pages/itemSplit/itemSplit.html",
                        state: { groupKey: this._group.key }
                    });
                    element.querySelector(".articlesection").focus();
                } else {
                    listView.addEventListener("contentanimating", handler, false);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                    listView.forceLayout();
                }
            } else {
                // If the app has unsnapped into the two-column view, remove any
                // splitPage instances that got added to the backstack.
                if (nav.canGoBack && nav.history.backStack[nav.history.backStack.length - 1].location === "/pages/itemSplit/itemSplit.html") {
                    nav.history.backStack.pop();
                }
                if (viewState !== lastViewState) {
                    listView.addEventListener("contentanimating", handler, false);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                    listView.forceLayout();
                }

                listView.selection.set(this._itemSelectionIndex >= 0 ? this._itemSelectionIndex : Math.max(firstVisible, 0));
            }
        },

        // This function checks if the list and details columns should be displayed
        // on separate pages instead of side-by-side.
        _isSingleColumn: function () {
            var viewState = Windows.UI.ViewManagement.ApplicationView.value;
            return (viewState === appViewState.snapped || viewState === appViewState.fullScreenPortrait);
        },

        _selectionChanged: function (args) {
            //var listView = document.body.querySelector(".itemlist").winControl;
            var details;
            // By default, the selection is restriced to a single item.
            listView.selection.getItems().done(function updateDetails(items) {
                if (items.length > 0) {
                    this._itemSelectionIndex = items[0].index;
                    currentItemIndex = this._itemSelectionIndex;
                    //Audtag.currentSongIndex = Math.max(this._itemSelectionIndex, 0);
                    //Audtag.setCurrentPlaying(Audtag.currentSongIndex);
                    // Get the item selected by the user
                    pritch = this._items.getAt(this._itemSelectionIndex);
                    if (this._isSingleColumn()) {
                        // If snapped or portrait, navigate to a new page containing the
                        // selected item's details.
                        //nav.navigate("/pages/itemSplit/itemSplit.html", { groupKey: this._group.key, selectedIndex: this._itemSelectionIndex });
                    } else {
                        // If fullscreen or filled, update the details column with new data.
                        details = document.querySelector(".articlesection");
                        binding.processAll(details, items[0].data);
                        details.scrollTop = 0;
                    }
                }
            }.bind(this));
        },

        // This function toggles visibility of the two columns based on the current
        // view state and item selection.
        _updateVisibility: function () {
            var oldPrimary = document.querySelector(".primarycolumn");
            if (oldPrimary) {
                utils.removeClass(oldPrimary, "primarycolumn");
            }
            if (this._isSingleColumn()) {
                if (this._itemSelectionIndex >= 0) {
                    utils.addClass(document.querySelector(".articlesection"), "primarycolumn");
                    document.querySelector(".articlesection").focus();
                } else {
                    utils.addClass(document.querySelector(".itemlistsection"), "primarycolumn");
                    document.querySelector(".itemlist").focus();
                }
            } else {
                document.querySelector(".itemlist").focus();
            }
        }
    });

    var pritchTemplate = WinJS.Utilities.markSupportedForProcessing(function(itemPromise) {
        return itemPromise.then(function (currentItem) {
            
            var result = document.createElement("div");

            // ListView item
            result.className = "item";
            result.style.overflow = "hidden";

            // Display image
            var image = document.createElement("img");
            image.className = "item-image";
            image.src = currentItem.data.image;
            result.appendChild(image);
            
            var title = document.createElement("h4");
            title.className = "item-title";
            title.innerText = currentItem.data.title;
            result.appendChild(title);

            var button = document.createElement("button");
            button.innerText = playChar;
            playButtons.push(button);

            if (currentItem.index == currentItemIndex) {
                changePlayButton(currentItemIndex);
            }
    
            button.addEventListener("click", function (eventObject) {
                if (Audtag.currentSongIndex != currentItem.index) {
                    Audtag.currentSongIndex = currentItem.index;
                    Audtag.setCurrentPlaying(Audtag.currentSongIndex);
                    listView.selection.set(currentItem.index);
                }
                Audtag.playpause();
                changePlayButton(currentItem.index);
            });
            result.appendChild(button);
            return result;
        });
    });

    function changePlayButton(index) {
        if (playButtons.length != 0) {

            if (index != currentItemIndex) {
                listView.selection.set(index);
            }

            playButtons.forEach(function (item) {
                item.innerText = playChar;
            });
        
            if (Audtag.isPlaying()) {
                playButtons[index].innerText = pauseChar;
            } else {
                playButtons[index].innerText = playChar;
            }
            
        }
        //if (playButtons[index].innerText.charCodeAt().toString(16) === playChar.charCodeAt().toString(16)) {
        //    playButtons[index].innerText = pauseChar;
        //} else {
        //    playButtons[index].innerText = playChar; 
        //}
        
    }
    
    WinJS.Namespace.define("ItemSplit", {
        changePlayButton: changePlayButton
    });
})();
