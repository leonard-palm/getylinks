
const API_KEY              = "AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo";
const CHANNEL_TYPE_CHANNEL = 'CHANNEL';
const CHANNEL_TYPE_USER    = 'USER';

function init(){
    
    if(!navigator.onLine){
        setPopupOffline();
        console.error('No Internet Connection.')
        return;
    }
    
    //Set my custom YouTube-API Key
    gapi.client.setApiKey(API_KEY);
    
    //Load YouTube-API
    gapi.client.load("youtube", "v3", function(){
        
        initStorage(function(){
            
            updateChannelInfos(function(){
                
                scan(function(links){
                    
                    displaySubscriptions(function(){
                    
                        adjustClipboardButtons(links);
                    });
                });    
            });
        });
    });
}

function scan(onCompleteScan){
    
    getYLinks(function(ylinks){
        
        if(ylinks.subscriptions.length === 0){
            console.log('Scanning finished successfull.');
            onCompleteScan(ylinks.links);
            return;
        } 
        
        getVideos(ylinks, 0, 0, function(warnings){
            
            if(warnings < ylinks.subscriptions.length){
                
                updateYLinks(ylinks, function(){
                    console.log('Scanning finished successfull.');
                    onCompleteScan(ylinks.links);
                });
            }else{
                console.error('Scanning failed.');
            }
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
    
    var newSub;
    
    if( playlistID.length === 0 ){
        animatePulse('red', $('li#enterLink'));
        console.error('Adding playlist failed (ID:'+playlistID+').');
        return;
    }
    
    getYLinks(function(ylinks){
       
        getPlaylistInfos(playlistID, function(info){
            
            newSub = { 'id'        : playlistID,
                       'type'      : CONTENT_TYPE_PLAYLIST,
                       'info'      : info };
            
            ylinks.subscriptions.push(newSub);
            
            updateYLinks(ylinks, function(){
                
                console.log('Added playlist successfully (ID:'+playlistID+').');

                removeDummySub();
                toggleadd(function(){
                    insertNewSub(newSub, function(){
                        scan(function(links){
                            adjustClipboardButtons(links);
                        });     
                    }); 
                });
                
            });
            
        });
        
    });
    
}

function removeChannel(channelID){
    
    getYLinks(function(ylinks){
        
        if(!subsContain(ylinks.subscriptions, channelID)) return;
        
        ylinks.subscriptions.splice(ylinks.subscriptions.findIndex(s => s.id === channelID), 1);
        
        adjustStorage(ylinks, function(){
                
            removeOldSub(channelID, function(){
                console.log('Channel removed successfully (ID:'+channelID+').');

                if(ylinks.subscriptions.length <= 0){

                    insertDummySub(function(){
                        console.log('Inserted dummy sub successfully.')
                    });
                }
            });
            
        });
        
    });
    
}

function removePlaylist(playlistID){
    
    
}

function getChannelInfos(channelID, channelType, onInfoGET){
    
    var infoRequest;
    const GAPI_URL_CHANNELS = 'https://www.googleapis.com/youtube/v3/channels';
    var snippetGET, statisticsGET;
    var snippetParams = {};
    var statisticsParams = {};
    
    if(channelID.length === 0 || channelType.length === 0){
        
        console.error('GET channelInfo failed (ID:'+channelID+').');
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
    
    snippetParams['part']    = 'snippet';
    statisticsParams['part'] = 'statistics';
    statisticsParams['key']  = API_KEY;
    snippetParams['key']     = API_KEY;
    
    snippetGET    = $.get(GAPI_URL_CHANNELS, snippetParams);
    statisticsGET = $.get(GAPI_URL_CHANNELS, statisticsParams);
    
    $.when(snippetGET, statisticsGET).done(function(dataSnippet, dataStatistics){

        console.log('GET channelInfo was successfull (ID:'+channelID+').');
        
        var info = {'title'    : dataSnippet[0].items[0].snippet.title,
                    'thumbnail': dataSnippet[0].items[0].snippet.thumbnails.default.url};
        
        var statistics = {'subscriberCount': dataStatistics[0].items[0].statistics.subscriberCount,
                          'videoCount'     : dataStatistics[0].items[0].statistics.videoCount,
                          'viewCount'      : dataStatistics[0].items[0].statistics.viewCount}
        
        onInfoGET(dataSnippet[0].items[0].id, info, statistics);
        
    }).fail(function(response){
        
        $.each(response.responseJSON.error.errors, function(i, errorEntry){
            console.error("Message: '"+errorEntry.message+"', Reason: '"+errorEntry.reason+"'");
        });
        onInfoGET(undefined, undefined, undefined);
    });
    
}

function updateChannelInfos(onFinish){
    
    getYLinks(function(ylinks){
        
        if(ylinks.subscriptions.length === 0){
            onFinish();
            return;
        }
        
        updateChannelInfo(ylinks.subscriptions, 0, 0, 0, function(changes, warnings){
            
            if(warnings == 0){
                console.log('Updating channel infos finished with '+changes+' change(s) and no warning(s).');
            }else{
                console.warn('Updating channel infos finished with '+changes+' change(s) and '+warnings+' warning(s).');
            }
            
            if(changes == 0){
                onFinish();
                return;
            }else{
                adjustStorage(ylinks, function(){
                    onFinish();
                    return;
                });
            }
        });
        
    });
}

function updateChannelInfo(subscriptions, i, changes, warnings, onComplete){
    
    var changesMade = false;
    var errorOccured = false;
    
    getChannelInfos(subscriptions[i].id, CHANNEL_TYPE_CHANNEL, function(channelID, info, statistics){

         if(!channelID || !info){
             console.error('Updating channel infos failed at "'+subscriptions[i].id+'".');
             
             errorOccured = true;
             warnings += 1;
         }
        
         if(!errorOccured){
             
             $.each(subscriptions[i].info, function(key, value){
                if(value != info[key]){
                    subscriptions[i].info = info;
                    changesMade = true;
                    return false;
                }
             });
             
             $.each(subscriptions[i].statistics, function(key, value){
                if(value != statistics[key]){
                    subscriptions[i].statistics = statistics;
                    changesMade = true;
                    return false;
                } 
             });
             
             if(changesMade) changes += 1;
         }

         if((i+1) < subscriptions.length){
             
             //Update next channel's info
             updateChannelInfo(subscriptions, (i+1), changes, warnings, onComplete);
             
         }else{
             
             //All channels were processed
             if(changesMade){
                onComplete(changes, warnings);
                return;
            }else{
                onComplete(changes, warnings);
                return;
            }
             
         }
     });
}

function getPlaylistInfos(playlistID, onInfoGET){

    const GAPI_URL_PLAYLISTS = 'https://www.googleapis.com/youtube/v3/playlists';
    var infoRequest, playlistSnippet, playlistInfo;
    
    infoRequest = gapi.client.request({
        'path':   GAPI_URL_PLAYLISTS,
        'params': {
          'part': 'snippet',
          'id'  : playlistID
        }
    });
    
    infoRequest.execute(function(data){
        
        //Got Error
        if(data.error || !data.items || !data.items[0]){
            console.error('GET playlist info failed at '+playlistID+'.');
            animatePulse('red', $('li#enterLink'));
            return;
        }
        
        playlistSnippet = data.items[0].snippet;
        
        playlistInfo = { 'title'       : snippet.title,
                         'channelTitle': snippet.channelTitle,
                         'thumbnail'   : snippet.thumbnails.default.url };
        
        onInfoGET(playlistInfo);
    });
    
}

function getVideos(ylinks, i, warnings, onComplete) {
    
    const GAPI_URL_SEARCH = 'https://www.googleapis.com/youtube/v3/search'
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