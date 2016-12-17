
var apikey = "AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo";

function init(){
    
    //Set my custom YouTube-API Key
    gapi.client.setApiKey(apikey);
    
    //Load YouTube-API
    gapi.client.load("youtube", "v3", function(){
        
        initStorage(function(retcode){
            
            updateChannelInfos(function(){
                
                displaySubscriptions(function(){
                    
                    scan(function(links){
                        
                        adjustClipboardButtons(links);
                    });     
                });
            });
        });
    });
}

function scan(onCompleteScan){
    
    var storageLinkIndex;
    
    chrome.storage.getYLinks(function(ylinks){
        
        if(!ylinks || !ylinks.subscriptions){
            console.error('Scanning failed.');
            return;
        }else if(ylinks.subscriptions.length == 0){
            console.log('Scanning finished successfull.');
            onCompleteScan(ylinks.links);
            return;
        } 
        
        getVideos(ylinks, 0, 0, function(warnings){
            
            if(warnings < ylinks.subscriptions.length){
                
                chrome.storage.updateYLinks(ylinks, function(retcode){
                    console.log('Scanning finished successfull.');
                    onCompleteScan(ylinks.links);
                });
            }else{
                console.error('Scanning failed.');
            }
        });
    });
}

function addChannel(channelLink){
    
    var channelType;
    var channelID;
    
    if(channelLink.length <= 0) return;
    
    if(channelLink.includes('/channel/')){
        channelType = 'channel';
    }else if(channelLink.includes('/user/')){
        channelType = 'user';
    }else{
        channelType = 'unknown';
    }
    
    channelID = channelLink.substring(channelLink.lastIndexOf('/')+1, channelLink.length);
    
    chrome.storage.getYLinks(function(ylinks){
       
        if(!ylinks || subsContain(ylinks.subscriptions, channelID) ) return;
        
        getChannelInfo(channelID, channelType, function(info){
            
            if(!info){
                animatePulse('red', $('li#enterLink'));
                console.error('Adding channel failed (ID:'+channelID+').');
                return;
            }
            
            var newSub = {'id'  : info.id,
                          'info': {'title': info.snippet.title,
                                   'thumbnail': info.snippet.thumbnails.default.url}};
            
            ylinks.subscriptions.push(newSub);
                    
            adjustStorage(ylinks, function(retcode){

                if(retcode == 0){
                    
                    console.log('Added channel successfully (ID:'+channelID+').');
                    
                    removeDummySub();
                    toggleadd(function(){
                        insertNewSub(newSub, function(){
                            scan(function(links){
                                adjustClipboardButtons(links);
                            });     
                        }); 
                    });
                }else{
                    
                    animatePulse('red', $('li#enterLink'));
                    console.error('Adding channel failed (ID:'+channelID+').');
                }
            }); 
            
        });
        
    });
    
}

function removeChannel(channelID){
    
    chrome.storage.getYLinks(function(ylinks){
        
        if(!ylinks || subsContain(ylinks.subscriptions, channelID) == false) return;
        
        ylinks.subscriptions.splice(ylinks.subscriptions.findIndex(s => s.id === channelID), 1);
        
        adjustStorage(ylinks, function(retcode){
           
            if(retcode === 0){
                
                removeOldSub(channelID, function(){
                    console.log('Channel removed successfully (ID:'+channelID+').');
                    
                    if(ylinks.subscriptions.length <= 0){
                        
                        insertDummySub(function(){
                            console.log('Inserted dummy sub successfully.')
                        });
                    }
                });
            }else{
                console.error('Removal of channel failed (ID:'+channelID+').')
            }
            
        });
        
    });
    
}

function getChannelInfo(channelID, channelType, onInfoGET){
    
    var infoRequest;
    var gapiPath = 'https://www.googleapis.com/youtube/v3/channels';
    var gapiPart = 'snippet';
    
    if(channelID.length <= 0 || channelType == 'unknown'){
        
        console.error('GET channelInfo failed (ID:'+channelID+').');
        onInfoGET(undefined);
        return;
        
    }if(channelType == 'channel'){
    
        infoRequest = gapi.client.request({
            'path': gapiPath,
            'params': {
              'part': gapiPart,
              'id': channelID
            }
        });
        
    }else if(channelType == 'user'){
        
        infoRequest = gapi.client.request({
            'path': gapiPath,
            'params': {
              'part': gapiPart,
              'forUsername': channelID
            }
        });
    }
    
    if(infoRequest){
    
        infoRequest.execute(function(data){
            if(data.error || data.items.length == 0){
                console.error('GET channelInfo failed (ID:'+channelID+').');
                onInfoGET(undefined);
            }else{
                console.log('GET channelInfo was successfull (ID:'+channelID+').');
                onInfoGET(data.items[0]);
            }
        });
    
    }
}

function updateChannelInfos(onFinish){
    
    chrome.storage.getYLinks(function(ylinks){
        
        if(!ylinks || !ylinks.subscriptions){
            console.error('Updating channel infos failed.');
            onFinish();
            return;
        }else if(ylinks.subscriptions.length == 0){
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
    
    getChannelInfo(subscriptions[i].id, 'channel', function(info){

         if(!info){
             console.error('Updating channel infos failed at "'+subscriptions[i].id+'".');
             
             errorOccured = true;
             warnings += 1;
         }
        
         if(!errorOccured){

             if(subscriptions[i].info.title != info.snippet.title){
                 subscriptions[i].info.title = info.snippet.title;
                 changesMade = true;
             }

             if(subscriptions[i].info.thumbnail != info.snippet.thumbnails.default.url){
                 subscriptions[i].info.thumbnail = info.snippet.thumbnails.default.url;
                 changesMade = true;
             }
             
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

function getVideos(ylinks, i, warnings, onComplete) {
    
    var errorOccured = false;
    
    var requestPlaylist = gapi.client.request({
        'path': 'https://www.googleapis.com/youtube/v3/search',
        'params': {
          'part': 'snippet',
          'channelId': ylinks.subscriptions[i].id,
          'maxResults': 10,
          'type': 'video',
          'order': 'date'
        }
    });

    requestPlaylist.execute(function(data){
        
        //Got Error
        if(data.error || !data.items){
            console.error('GET videos at "'+ylinks.subscriptions[i].id+'" failed.');
            errorOccured = true; 
            warnings += 1;
        }
        
        if(!errorOccured && data.items && data.items.length > 0){
            
            //Fill local links
            var storageLinkIndex = ylinks.links.findIndex(l => l.channelID == ylinks.subscriptions[i].id);

            $.each(data.items, function(i, videoEntry){
                if(storageLinkIndex >= 0){
                    ylinks.links[storageLinkIndex].videoLinks.push(videoEntry.id.videoId);
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

function clearCopyHistory(){
    
    chrome.storage.getYLinks(function(ylinks){
       
        if(!ylinks || !ylinks.copyHistory){
            console.error('Clearing Copy History failed.');
            return;
        }
        
        ylinks.copyHistory = [];
        
        chrome.storage.updateYLinks(ylinks, function(retcode){
            if(retcode != 0){
                console.error('Clearing Copy History failed.');
            }
        });
        
    });
}
  
function getSubByID(subscriptions, id){
    return subscriptions.find( sub => sub.id === id );
}

function subsContain(subscriptions, id){
    return getSubByID(subscriptions, id) != undefined;
}