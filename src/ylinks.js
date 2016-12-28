
const API_KEY                   = "AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo";
const CHANNEL_TYPE_CHANNEL      = 'CHANNEL';
const CHANNEL_TYPE_USER         = 'USER';
const GAPI_PART_SNIPPET         = 'snippet';
const GAPI_PART_STATISTICS      = 'statistics';
const GAPI_PART_CONTENT_DETAILS = 'contentDetails';

function init(){
    
    if(!navigator.onLine){
        setPopupOffline();
        console.error('No Internet Connection.')
        return;
    }
    
    //Set my custom YouTube-API Key
    gapi.client.setApiKey(API_KEY);
    
    //Load YouTube-API
    gapi.client.load('youtube', 'v3', function(){
        
        initStorage(function(){
            
            updateSubInfos(function(){
                
                removeInvalidSubs(function(){
                    
                    scan(function(links){
                    
                        displaySubscriptions(function(){

                            adjustClipboardButtons(links);
                        });
                    });    
                });
            });
        });
    });
}

function scan(onCompleteScan){
    
    getYLinks(function(ylinks){
        
        if(ylinks.subscriptions.length === 0){
            console.log('Scanning finished successfully.');
            onCompleteScan(ylinks.links);
            return;
        } 

        getSubVideos(ylinks, function(){

            updateYLinks(ylinks, function(){

                console.log('Scanning finished successfully.');
                onCompleteScan(ylinks.links);
            });
        });
    });
}

function addContent(link){
    
    const channelMatcher  = /www\.youtube\.com\/channel\//g;
    const userMatcher     = /www\.youtube\.com\/user\//g
    const playlistMatcher = /www\.youtube\.com\/playlist\?list=/g;
    
    const channelIdent  = '/channel/';
    const userIdent     = '/user/';
    const playlistIdent = '/playlist?list=';
    
    
    if(link.match(channelMatcher)){
        
        addChannel( extractIdentValue(link, channelIdent), CHANNEL_TYPE_CHANNEL );
        
    }else if(link.match(userMatcher)){
        
        addChannel( extractIdentValue(link, userIdent), CHANNEL_TYPE_USER );
        
    }else if(link.match(playlistMatcher)){
        
        addPlaylist( extractIdentValue(link, playlistIdent) );
        
    }else{
        
        animatePulse('red', $('li#enterLink'));
        console.error('Adding content failed.');
    }
    
}

function extractIdentValue(link, ident){
    
    if( link.indexOf(ident) === -1 ) return '';
    var identVal = link.substr( link.indexOf(ident) + ident.length, link.length );
    return ( identVal.indexOf('/') != -1 ) ? identVal.substr( 0, identVal.indexOf('/') ) : identVal;
}

function addChannel(channelName, channelType){
    
    var newChannel;
    
    if( channelName.length === 0 || channelType.length === 0 ){
        animatePulse('red', $('li#enterLink'));
        console.error('Adding channel failed (ID:'+channelID+').');
        return;
    }
    
    getYLinks(function(ylinks){
        
        getChannelInfos(channelName, channelType, function(channelID, channelInfo, channelStats){
            
            if(!channelInfo || subsContain(ylinks.subscriptions, channelID)){
                animatePulse('red', $('li#enterLink'));
                console.error('Adding channel failed (ID:'+channelID+').');
                return;
            }
            
            newChannel = { 'id'        : channelID,
                           'type'      : CONTENT_TYPE_CHANNEL,
                           'valid'     : true,
                           'info'      : channelInfo, 
                           'statistics': channelStats };
            
            ylinks.subscriptions.push(newChannel);
            
            adjustStorage(ylinks, function(){
                    
                console.log('Added channel successfully (ID:'+channelID+').');

                removeDummySub();
                
                toggleadd(function(){
                    
                    insertChannel(newChannel, function(){
                        
                        scan(function(links){
                            
                            adjustClipboardButtons(links);
                        });     
                    }); 
                });
            }); 
        });
    });
}

function addPlaylist(playlistID){
    
    var newPlaylist;
    
    if( playlistID.length === 0 ){
        animatePulse('red', $('li#enterLink'));
        console.error('Adding playlist failed (ID:'+playlistID+').');
        return;
    }
    
    getYLinks(function(ylinks){
       
        getPlaylistInfos(playlistID, function(info){
            
            newPlaylist = { 'id'   : playlistID,
                            'type' : CONTENT_TYPE_PLAYLIST,
                            'valid': true,
                            'info' : info };
            
            ylinks.subscriptions.push(newPlaylist);
            
            adjustStorage(ylinks, function(){
                
                console.log('Added playlist successfully (ID:'+playlistID+').');

                removeDummySub();
                
                toggleadd(function(){
                    
                    insertPlaylist(newPlaylist, function(){
                        
                        scan(function(links){
                            
                            adjustClipboardButtons(links);
                        });
                    }); 
                });
            });
        });
    });
}

function removeSub(subID, frontend){
    
    getYLinks(function(ylinks){
        
        if( !subsContain(ylinks.subscriptions, subID) ) return;
        
        ylinks.subscriptions.splice( ylinks.subscriptions.findIndex(s => s.id === subID), 1 );
        
        adjustStorage(ylinks, function(){
            
            console.log('Subscription removed successfully (ID:'+subID+').');
            
            if(frontend){
                removeOldSub(subID, function(){
                    if(ylinks.subscriptions.length === 0) insertDummySub(function(){});
                });
            }
        });
    });
}

function removeInvalidSubs(onRemovedAllInvalid){
    
    getYLinks(function(ylinks){
        
        if( !ylinks.subscriptions.find( s => s.valid === false) ){
            onRemovedAllInvalid();
            return;
        } 
        
        ylinks.subscriptions = $.map(ylinks.subscriptions, function(sub, i){
            return ( sub.valid ) ? sub : null;
        });
        
        adjustStorage(ylinks, function(){
            onRemovedAllInvalid();
        });
    });
}

function updateSubInfos(onAllInfosGET){
    
    getYLinks(function(ylinks){
        
        if( ylinks.subscriptions.length === 0 ){ 
            onAllInfosGET();               
            return;
        }

        $.each(ylinks.subscriptions, function(i, sub){

            if( sub.type === CONTENT_TYPE_CHANNEL ){

                getChannelInfos(sub.id, CHANNEL_TYPE_CHANNEL, function(newID, info, stats){

                    sub.info = info;
                    sub.statistics = stats;

                    if( !info ) sub.valid = false;

                    if( (i+1) === ylinks.subscriptions.length ){
                        updateYLinks(ylinks, function(){
                            onAllInfosGET();
                        });
                    }
                });

            }else if( sub.type === CONTENT_TYPE_PLAYLIST ){

                getPlaylistInfos(sub.id, function(info){

                    sub.info = info;

                    if( !info ) sub.valid = false;

                    if( (i+1) === ylinks.subscriptions.length ){
                        updateYLinks(ylinks, function(){
                            onAllInfosGET();
                        });
                    }
                });
            }
        });
    });
}

function getChannelInfos(channelID, channelType, onInfoGET){
    
    const GAPI_URL_CHANNELS = 'https://www.googleapis.com/youtube/v3/channels';
    
    var infoRequest, itemSnippet, itemStatistics;
    var snippetGET, statisticsGET;
    var snippetParams = {};
    var statisticsParams = {};
    var info, statistics;
    
    if(channelID.length === 0 || channelType.length === 0){
        
        console.error('GET channelinfo failed (ID:'+channelID+').');
        onInfoGET(undefined, undefined, undefined);
        return;
    }
    
    if(channelType === CHANNEL_TYPE_CHANNEL){
        
        snippetParams['id']    = channelID;
        statisticsParams['id'] = channelID;
        
    }else if(channelType === CHANNEL_TYPE_USER){
        
        snippetParams['forUsername']    = channelID;
        statisticsParams['forUsername'] = channelID;
    }
    
    snippetParams['part']    = GAPI_PART_SNIPPET;
    statisticsParams['part'] = GAPI_PART_STATISTICS;
    statisticsParams['key']  = API_KEY;
    snippetParams['key']     = API_KEY;
    
    snippetGET    = $.get(GAPI_URL_CHANNELS, snippetParams);
    statisticsGET = $.get(GAPI_URL_CHANNELS, statisticsParams);
    
    $.when(snippetGET, statisticsGET).done(function(dataSnippet, dataStatistics){
        
        if( dataSnippet[0].pageInfo.totalResults === 0 ){
            console.error('GET channel infos failed (ID:'+channelID+').');
            onInfoGET(undefined, undefined, undefined);
            return;
        }

        console.log('GET channelInfo was successfull (ID:'+channelID+').');
        
        itemSnippet    = dataSnippet[0].items[0].snippet;
        itemStatistics = dataStatistics[0].items[0].statistics;
        
        info = { 'title'    : itemSnippet.title,
                 'thumbnail': itemSnippet.thumbnails.default.url };
        
        statistics = { 'subscriberCount': itemStatistics.subscriberCount,
                       'videoCount'     : itemStatistics.videoCount,
                       'viewCount'      : itemStatistics.viewCount };
        
        onInfoGET(dataSnippet[0].items[0].id, info, statistics);
        
    }).fail(function(response){
        
        $.each(response.responseJSON.error.errors, function(i, errorEntry){
            console.error("Message: '"+errorEntry.message+"', Reason: '"+errorEntry.reason+"'");
        });
        onInfoGET(undefined, undefined, undefined);
    });
    
}


function getPlaylistInfos(playlistID, onInfoGET){

    const GAPI_URL_PLAYLISTS = 'https://www.googleapis.com/youtube/v3/playlists';
    var infoRequest, playlistSnippet, playlistInfo;
    
    infoRequest = gapi.client.request({
        'path':   GAPI_URL_PLAYLISTS,
        'params': {
          'part': GAPI_PART_SNIPPET,
          'id'  : playlistID
        }
    });
    
    infoRequest.execute(function(data){
        
        //Got Error
        if(data.error || !data.items || !data.items[0]){
            console.error('GET playlist info failed at '+playlistID+'.');
            animatePulse('red', $('li#enterLink'));
            onInfoGET(undefined);
            return;
        }
        
        playlistSnippet = data.items[0].snippet;
        
        playlistInfo = { 'title'       : playlistSnippet.title,
                         'channelTitle': playlistSnippet.channelTitle,
                         'thumbnail'   : playlistSnippet.thumbnails.default.url };
        
        onInfoGET(playlistInfo);
    });
    
}

function getSubVideos(ylinks, onAllVideosGET){
    
    var $deferreds = [];
    
    $.each(ylinks.subscriptions, function(i, sub){
        
        //Fill array with AJAX requests depending on subscription's type
        if( sub.type === CONTENT_TYPE_CHANNEL ){
            $deferreds.push( getChannelVideoRequest(sub.id) );
        }else if( sub.type === CONTENT_TYPE_PLAYLIST ){
            $deferreds.push( getPlaylistVideoRequest(sub.id) );
        }
    });
    
    $.when.apply($, $deferreds).then(function(){
        
        var argArray = $.makeArray(arguments);
        var requestData = [];
        var linkField, linkIndex;
        var cpHistField, cpHistIndex;
        
        if( Array.isArray(argArray[0]) ){
            
            //Multible subscriptions return a deeper data structure
            requestData = $.map(argArray, function(data, i){ return data[0] });
        }else{
        
            requestData.push(argArray[0]); //Just one subscription
        }
        
        $.each(requestData, function(i, reqData){
            
            if( reqData.pageInfo.totalResults === 0 ) return true;
            
            if( reqData.kind === 'youtube#searchListResponse' ){
                
                linkField   = ylinks.links.channels;
                cpHistField = ylinks.copyHistory.channels;
                linkIndex   = linkField.findIndex( l => l.id === reqData.items[0].snippet.channelId );
                cpHistIndex = cpHistField.findIndex( l => l.id === reqData.items[0].snippet.channelId );
                
            }else if( reqData.kind === 'youtube#playlistItemListResponse' ){
                
                linkField   = ylinks.links.playlists;
                cpHistField = ylinks.copyHistory.playlists;
                linkIndex   = linkField.findIndex( l => l.id === reqData.items[0].snippet.playlistId );
                cpHistIndex = cpHistField.findIndex( l => l.id === reqData.items[0].snippet.playlistId );
                
            }
            
            linkField[linkIndex].videoLinks = $.map(reqData.items, function(item, i){
                
                if(item.kind === 'youtube#searchResult'){
                    if( cpHistField[cpHistIndex].videoLinks.indexOf(item.id.videoId) === -1 ){
                        return item.id.videoId;                     //Type channel
                    }else{
                        return null;
                    }
                }else if(item.kind === 'youtube#playlistItem'){
                    if( cpHistField[cpHistIndex].videoLinks.indexOf(item.snippet.resourceId.videoId) === -1 ){
                        return item.snippet.resourceId.videoId;     //Type playlist
                    }else{
                        return null;
                    }
                }else{
                    return null;                                    //Nothing of both
                }
            });
        });
        
        onAllVideosGET();
    });
}

function getChannelVideoRequest(channelID){
    
    const GAPI_URL_SEARCH = 'https://www.googleapis.com/youtube/v3/search';
    
    var params = {};
    
    params['key']        = API_KEY;
    params['part']       = GAPI_PART_SNIPPET;
    params['channelId']  = channelID;
    params['maxResults'] = 10;
    params['type']       = 'video';
    params['order']      = 'date';
    
    return $.get(GAPI_URL_SEARCH, params).fail(getVideosFail);
}

function getPlaylistVideoRequest(playlistID){
    
    const GAPI_URL_PLAYLIST_ITEMS = 'https://www.googleapis.com/youtube/v3/playlistItems';
    
    var params = {};
    
    params['key']        = API_KEY;
    params['part']       = GAPI_PART_SNIPPET;
    params['maxResults'] = 10;
    params['playlistId'] = playlistID;
    
    return $.get(GAPI_URL_PLAYLIST_ITEMS, params).fail(getVideosFail);
}

var getVideosFail = function(data){
    
    console.error('Fatal error during video scanning:');
    console.error(data.responseJSON);
}

function getVideos(ylinks, i, warnings, onComplete) {
    
    const GAPI_URL_SEARCH = 'https://www.googleapis.com/youtube/v3/search';
    var errorOccured = false;
    
    var requestVideos = gapi.client.request({
        'path':   GAPI_URL_SEARCH,
        'params': {
          'part'      : 'snippet',
          'channelId' : ylinks.subscriptions[i].id,
          'maxResults': 10,
          'type'      : 'video',
          'order'     : 'date'
        }
    });

    requestVideos.execute(function(data){
        
        //Got Error
        if(data.error || !data.items){
            console.error('GET videos at "'+ylinks.subscriptions[i].id+'" failed.');
            errorOccured = true; 
            warnings += 1;
        }
        
        if(!errorOccured && data.items && data.items.length > 0){
            
            //Fill local links
            var linkIndex      = ylinks.links.channels.findIndex( l => l.id == ylinks.subscriptions[i].id );
            var cpHistoryIndex = ylinks.copyHistory.channels.findIndex( c => c.id == ylinks.subscriptions[i].id );

            $.each(data.items, function(i, videoEntry){
                
                if( ylinks.copyHistory.channels[cpHistoryIndex].videoLinks.indexOf(videoEntry.id.videoId) === -1
                   && ylinks.links.channels[linkIndex].videoLinks.indexOf(videoEntry.id.videoId) === -1
                   && videoEntry.snippet.liveBroadcastContent != 'live' ){
                    
                    ylinks.links.channels[linkIndex].videoLinks.push(videoEntry.id.videoId);
                }
            });
        }
        
        //Next channel
        if( (i+1) < ylinks.subscriptions.length ){
            getVideos(ylinks, (i+1), warnings, onComplete);
        }else{
            if(warnings > 0){
                console.warn('GET videos finished with '+warnings+' warning(s).');
            }else{
                console.log('GET videos finished with no warnings.');
            }
            onComplete(warnings);
        }
    });
    
};


function resetHistory(id, type){
    
    var cpHistIndex;
    var cpHistField;
    var linkContainer;
    
    getYLinks(function(ylinks){
        
        if(type === CONTENT_TYPE_CHANNEL){
            cpHistField = ylinks.copyHistory.channels;
        }else if(type === CONTENT_TYPE_PLAYLIST){
            cpHistField = ylinks.copyHistory.playlists;
        }
        
        cpHistIndex = cpHistField.findIndex( c => c.id === id );
        
        if(cpHistIndex === -1){
            console.error('Resetting Copy History failed.');
            return;
        }
        
        cpHistField[cpHistIndex].videoLinks = [];
        
        linkContainer = $('input#linkContainer');
        linkContainer.val('; ')
        linkContainer.select();
        document.execCommand('copy');
        
        updateYLinks(ylinks, function(){
            scan(function(links){
                adjustClipboardButtons(links);
            }); 
        });
    });
}

function openChannel(channelID){
    createTab('http://www.youtube.com/channel/' + channelID);
}

function openPlaylist(playlistID){
    createTab('http://www.youtube.com/playlist?list=' + playlistID);
}

function createTab(url){
    chrome.tabs.create({'url': url}, function(){});
}
  
function getSubByID(subs, id){
    return subs.find( s => s.id === id );
}

function subsContain(subs, id){
    return getSubByID(subs, id) != undefined;
}