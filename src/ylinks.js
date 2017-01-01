
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
    
    const channelMatcher       = /www\.youtube\.\w{2,3}\/channel\//g;
    const userMatcher          = /www\.youtube\.\w{2,3}\/user\//g
    const playlistMatcher      = /www\.youtube\.\w{2,3}\/playlist\?list=/g;
    const playlistVideoMatcher = /www\.youtube\.\w{2,3}\/watch\?v=\w+(\&t=\d+s)?\&list=\w+/g;
    const videoMatcher         = /www\.youtube\.\w{2,3}\/watch\?v=/g;
    
    const identChannel  = '/channel/';
    const identUser     = '/user/';
    const pNameVideo    = 'v';
    const pNamePlaylist = 'list';
    
    
    if( link.match(channelMatcher) ){
        
        //Add Channel by channel id
        addChannel( extractIdentValue(link, identChannel), CHANNEL_TYPE_CHANNEL );
        
    }else if( link.match(userMatcher) ){
        
        //Add channel by username
        addChannel( extractIdentValue(link, identUser), CHANNEL_TYPE_USER );
        
    }else if( link.match(playlistMatcher) || link.match(playlistVideoMatcher) ){
        
        //Add playlist by playlist id
        addPlaylist( getParamValue(link, pNamePlaylist) );
    
    }else if( link.match(videoMatcher) ){
        
        //Add channel by video id
        addChannelByVideo( getParamValue(link, pNameVideo) );
        
    }else{
        
        animatePulse('red', $('li#enterLink'));
        console.error('Adding content failed.');
    }
    
}

function getParamValue(youtubeURL, paramName){
    
    if( !youtubeURL || youtubeURL.indexOf('?') === -1 ) return '';
    
    var searchParams = new URLSearchParams( youtubeURL.substring( youtubeURL.indexOf('?') + 1 ) );
    
    for( let p of searchParams ){
        if( p[0] === paramName ) return p[1];
    }
    return '';
}

function extractIdentValue(link, ident){
    
    if( !link || link.indexOf(ident) === -1 ) return '';
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
            
            ylinks.subscriptions.unshift(newChannel);
            
            adjustStorage(ylinks, function(){
                    
                console.log('Added channel successfully (ID:'+channelID+').');
                    
                toggleAddContainer(function(){

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

function addChannelByVideo(videoID){
    
    const GAPI_URL_VIDEOS = 'https://www.googleapis.com/youtube/v3/videos';
    
    $.get(GAPI_URL_VIDEOS, {
        
        'key' : API_KEY,
        'part': GAPI_PART_SNIPPET,
        'id'  : videoID
        
    }).done(function(videoData){
        
        console.out(videoData);
        
        if( videoData.error || videoData.pageInfo.totalResults === 0 ){
            animatePulse('red', $('li#enterLink'));
            console.error('Adding channel by video (ID:'+videoID+') failed');
            return;
        }
        
        addChannel( videoData.items[0].snippet.channelId, CHANNEL_TYPE_CHANNEL );
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
       
        getPlaylistInfos(playlistID, function(playlistInfo){
            
            if(!playlistInfo || subsContain(ylinks.subscriptions, playlistID)){
                animatePulse('red', $('li#enterLink'));
                console.error('Adding playlist failed (ID:'+playlistID+').');
                return;
            }
            
            newPlaylist = { 'id'   : playlistID,
                            'type' : CONTENT_TYPE_PLAYLIST,
                            'valid': true,
                            'info' : playlistInfo };
            
            ylinks.subscriptions.unshift(newPlaylist);
            
            adjustStorage(ylinks, function(){
                
                console.log('Added playlist successfully (ID:'+playlistID+').');
                
                toggleAddContainer(function(){
                    
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
            
            if( frontend ) removeOldSub(subID);
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
    
    var playlistInfo;
    var snippetRequest, contentDetailsRequest;
    var snippet, contentDetails;
    
    snippetRequest        = getPlaylistSnippetRequest(playlistID, GAPI_PART_SNIPPET);
    contentDetailsRequest = getPlaylistSnippetRequest(playlistID, GAPI_PART_CONTENT_DETAILS);
    
    $.when(snippetRequest, contentDetailsRequest).then(function(snippetData, contentDetailsData){
        
        //Got Error
        if( snippetData[0].error || snippetData[0].pageInfo.totalResults === 0 ){
            console.error('GET playlist info failed at '+playlistID+'.');
            animatePulse('red', $('li#enterLink'));
            onInfoGET(undefined);
            return;
        }
        
        snippet        = snippetData[0].items[0].snippet;
        contentDetails = contentDetailsData[0].items[0].contentDetails;
        
        playlistInfo = { 'title'       : snippet.title,
                         'channelTitle': snippet.channelTitle,
                         'itemCount'   : contentDetails.itemCount,
                         'thumbnail'   : snippet.thumbnails.medium.url };
        
        onInfoGET(playlistInfo);
    });
}

function getPlaylistSnippetRequest(playlistID, part){

    const GAPI_URL_PLAYLISTS = 'https://www.googleapis.com/youtube/v3/playlists';
    
    var params = {};
    
    params['key']  = API_KEY;
    params['part'] = part;
    params['id']   = playlistID;
    
    return $.get(GAPI_URL_PLAYLISTS, params).fail(getInfosFail); 
}

var getInfosFail = function(data){
    
    console.error('Fatal error during info reading:');
    console.error(data.responseJSON);
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
        var linkIndex, cpHistIndex;
        
        if( Array.isArray(argArray[0]) ){
            
            //Multible subscriptions return a deeper data structure
            requestData = $.map(argArray, function(data, i){ return data[0] });
        }else{
        
            requestData.push(argArray[0]); //Just one subscription
        }
        
        $.each(requestData, function(i, reqData){
            
            if( reqData.pageInfo.totalResults === 0 ) return true;
            
            if( reqData.kind === 'youtube#searchListResponse' ){
                
                linkIndex   = ylinks.links.findIndex( l => l.id === reqData.items[0].snippet.channelId );
                cpHistIndex = ylinks.copyHistory.findIndex( l => l.id === reqData.items[0].snippet.channelId );
                
            }else if( reqData.kind === 'youtube#playlistItemListResponse' ){
                
                linkIndex   = ylinks.links.findIndex( l => l.id === reqData.items[0].snippet.playlistId );
                cpHistIndex = ylinks.copyHistory.findIndex( l => l.id === reqData.items[0].snippet.playlistId );
            }
            
            ylinks.links[linkIndex].videoLinks = $.map(reqData.items, function(item, i){
                
                if(item.kind === 'youtube#searchResult'){
                    if( ylinks.copyHistory[cpHistIndex].videoLinks.indexOf(item.id.videoId) === -1 ){
                        return item.id.videoId;                     //Type channel
                    }else{
                        return null;
                    }
                }else if(item.kind === 'youtube#playlistItem'){
                    if( ylinks.copyHistory[cpHistIndex].videoLinks.indexOf(item.snippet.resourceId.videoId) === -1 ){
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


function resetHistory(subID, type){
    
    var cpHistIndex;
    var linkContainer;
    
    getYLinks(function(ylinks){
        
        cpHistIndex = ylinks.copyHistory.findIndex( c => c.id === subID );
        
        if(cpHistIndex === -1){
            console.error('Resetting Copy History failed.');
            return;
        }
        
        ylinks.copyHistory[cpHistIndex].videoLinks = [];
        
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