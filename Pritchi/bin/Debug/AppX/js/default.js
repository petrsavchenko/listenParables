// For an introduction to the Grid template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=232446
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;
    
    var audtag = null;
    var mediaControl;
    var appbarBottom;

    var sldProgress;
    var sldVolume;
    
    var currentSongIndex = 0;
    var playlist = [];
    var playlistCount;
    var nextRegistered = false;
    var previousRegistered = false;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }

            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
               
                mediaControl = Windows.Media.MediaControl;
                mediaControl.addEventListener("playpausetogglepressed", playpause, false);
                mediaControl.addEventListener("playpressed", play, false);
                mediaControl.addEventListener("pausepressed", pause, false);
                mediaControl.addEventListener("stoppressed", stop, false);

                // TODO: Работа с файловой системой
                //Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync("audio").then(function (folder) {
                //    var search = Windows.Storage.Search;
                //    var fileTypeFilter = [".mp3"];
                //    var queryOptions = new search.QueryOptions(search.CommonFileQuery.orderByName, fileTypeFilter);
                //    var query = folder.createFileQueryWithOptions(queryOptions);
                //    return query.getFilesAsync(queryOptions);
                //}).done(function (files) {
                    
                //    if (files.length > 0) {
                //        createPlaylist(files);
                //        setCurrentPlaying(currentSongIndex);
                //    }

                //    //if (f) {
                //    //    files = f;
                //    //}
                //});
                
                if (!audtag) {
                    audtag = document.createElement('audio');
                    audtag.setAttribute("id", "audtag");
                    audtag.setAttribute("controls", "true");
                    audtag.setAttribute("msAudioCategory", "backgroundcapablemedia");
                    //audtag.setAttribute("src", "audio/02. Об отношениях.mp3");
                    audtag.addEventListener("timeupdate", audtagTimeUpdate, false);
                    audtag.addEventListener("canplay", canplay, false);
                    audtag.addEventListener("ended", songEnded, false);
                    document.getElementById("MediaElement").appendChild(audtag);
                    //audtag.setAttribute("autoplay");
                    //"http://testdriveie9.wise.glbdns.microsoft.com/ietestdrivecontent/Musopen.Com Symphony No. 5 in C Minor, Op. 67 - I. Allegro con brio.mp3"
                    audtag.load();
                }
                
                // Retrieve the app bar.
                appbarBottom = document.getElementById("appbarBottom").winControl;

                var btnPlay = appbarBottom.getCommandById("btnPlay");
                var btnPrev = appbarBottom.getCommandById("btnPrev");
                var btnNext = appbarBottom.getCommandById("btnNext");
                sldProgress = document.getElementById("range-progress");
                sldVolume = document.getElementById("range-volume");
                btnPlay.addEventListener("click", btnPlayClick, false);
                btnPrev.addEventListener("click", btnPrevClick, false);
                btnNext.addEventListener("click", btnNextClick, false);
                sldProgress.addEventListener("change", sldProgressChange, false);
                sldVolume.addEventListener("change", sldVolumeChange, false);
                
                
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }
            }));
        }
    });
     
    //Обработчики событий

    function btnPlayClick(eventInfo) {
        playpause();
    }

    function btnPrevClick(eventInfo) {
        previousTrack();
    }

    function btnNextClick(eventInfo) {
        nextTrack();
    }

    function sldProgressChange(eventInfo) {
        audtag.currentTime = sldProgress.value;
    }

    function sldVolumeChange(eventInfo) {
        audtag.volume = sldVolume.value / 100;
    }

    function audtagTimeUpdate(eventInfo) {
        sldProgress.value = audtag.currentTime;
        showCurTiming();
        showMaxTiming();
    }

    //Функции MediaElement
    function playpause() {
        if (!audtag.paused) {
            audtag.pause();
            Windows.Media.MediaControl.isPlaying = false;
            appbarBottom.getCommandById("btnPlay").icon = "play";
        } else {
            audtag.play();
            Windows.Media.MediaControl.isPlaying = true;
            appbarBottom.getCommandById("btnPlay").icon = "pause";
        }
        ItemSplit.changePlayButton(currentSongIndex);
    }

    function isPlaying() {
        return !audtag.paused;
    }
    
    function play() {
        playpause();
    }

    function pause() {
        playpause();
    }

    function stop() {
        audtag.pause();
        audtag.currentTime = 0;
    }

    function nextTrack() {
        if (currentSongIndex < (playlistCount - 1)) {
            currentSongIndex++;
            setCurrentPlaying(currentSongIndex);
            if (currentSongIndex > 0) {
                if (!previousRegistered) {

                    // add the previous track listener if not at the beginning of the playlist
                    mediaControl.addEventListener("previoustrackpressed", previousTrack, false);
                    id("btnPrev").disabled = false;
                    previousRegistered = true;
                }
            }
            if (currentSongIndex === (playlistCount - 1)) {
                if (nextRegistered) {

                    // remove the nexttrack registration if at the end of the playlist
                    mediaControl.removeEventListener("nexttrackpressed", nextTrack, false);
                    id("btnNext").disabled = true;
                    nextRegistered = false;
                }
            }
            play();
        }


    }

    function previousTrack() {

        if (currentSongIndex > 0) {
            if (currentSongIndex === (playlistCount - 1)) {
                if (!nextRegistered) {
                    // Add the next track listener if the playlist is not at the end.
                    mediaControl.addEventListener("nexttrackpressed", nextTrack, false);
                    id("btnNext").disabled = false;
                    nextRegistered = true;
                }
            }
            currentSongIndex--;
            

            if (currentSongIndex === 0) {
                if (previousRegistered) {
                    // Remove the previous track registration if the playlist is at the beginning
                    mediaControl.removeEventListener("previoustrackpressed", previousTrack, false);
                    id("btnPrev").disabled = true;
                    previousRegistered = false;
                }

            }
            setCurrentPlaying(currentSongIndex);
            play();
        }
    }

    function canplay() {
        sldProgress.max = audtag.duration;
        sldProgress.disabled = false;
        showCurTiming();
        showMaxTiming();
    }
    
    function songEnded() {
        // At the end of the song move to the next track
        nextTrack();
    }
    
    //Функции
    
    function id(elementId) {
        return document.getElementById(elementId);
    }

    function showCurTiming() {
        var cur = formatTime(audtag.currentTime);
        document.getElementById("current-progress-text").textContent = cur;
    }

    function showMaxTiming() {
        if (audtag.duration) {
            var maxDur = formatTime(audtag.duration);
            document.getElementById("max-progress-text").textContent = maxDur;
        }
    }
    
    function formatTime(time) {
        var
          minutes = Math.floor(time / 60) % 60,
          seconds = Math.floor(time % 60);

        return (minutes < 10 ? '0' + minutes : minutes) + ':' +
                 (seconds < 10 ? '0' + seconds : seconds);
    }
    
    function createPlaylist(files) {
        
        if (files.length > 0) {
            playlistCount = files.length;

            // Reset the event handlers
            //
            if (nextRegistered) {
                mediaControl.removeEventListener("nexttrackpressed", nextTrack, false);
                id("btnNext").disabled = true;
                nextRegistered = false;
            }
            if (previousRegistered) {
                mediaControl.removeEventListener("previoustrackpressed", previousTrack, false);
                id("btnPrev").disabled = true;
                previousRegistered = false;
            }

            // Set the current track back to 0 reset playlist
            //
            currentSongIndex = 0;
            playlist = [];

            if (playlistCount > 1) {
                if (!nextRegistered) {
                    mediaControl.addEventListener("nexttrackpressed", nextTrack, false);
                    id("btnNext").disabled = false;
                    nextRegistered = true;
                }
            }

            playlist = files;
        }

    }
    
    function setCurrentPlaying(index) {
        //var song = URL.createObjectURL(playlist[index], { oneTimeOnly: true });
        //audtag.src = song;
        if (currentSongIndex === 0 && playlistCount > 1 && index > 0) {
            if (!previousRegistered) {
                // add the previous track listener if not at the beginning of the playlist
                mediaControl.addEventListener("previoustrackpressed", previousTrack, false);
                id("btnPrev").disabled = false;
                previousRegistered = true;
            }
        }
        currentSongIndex = index;
        audtag.src = playlist[index];
        //setMetaData(index);
    }
    


    //Запуск и приостановка приложения
    WinJS.Namespace.define("Audtag", {
        createPlaylist: createPlaylist,
        setCurrentPlaying: setCurrentPlaying,
        currentSongIndex: currentSongIndex,
        isPlaying: isPlaying,
        playpause: playpause,
        mediaControl: mediaControl
    }); 
    
    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;
    };

    app.start();

})();
