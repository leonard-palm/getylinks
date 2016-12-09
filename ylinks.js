
var apikey = "AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo";

function init(){
    
    //Set my custom YouTube-API Key
    gapi.client.setApiKey(apikey);
    
    //Load YouTube-API
    gapi.client.load("youtube", "v3", function(){
        
        //Initialize Storage Object's and Array's
        initStorage(function(retcode){
            
            //Display Subscriptions on Popup
            chrome.storage.getYLinks(function(ylinks){
                displaySubscriptions(ylinks.subscriptions);
            });

            //Scan for new Videos published by my Subscriptions
            //scan(function(){});
        
        });
        
    });
}

function scan(onCompleteScan){
    
    var storageLinkIndex;
    
    chrome.storage.getYLinks(function(ylinks){
        
        if(!ylinks){
            onCompleteScan(1);
            return;
        }else if(ylinks.subscriptions.length <= 0){
            onCompleteScan(0);
            return;
        } 
        
        getVideos(ylinks.subscriptions, 0, ylinks.subscriptions[0].id, ylinks.links , function(retcode, links){
        
            if(retcode === 0){
                chrome.storage.updateYLinks(ylinks, function(retcode){
                    if(retcode === 0){
                        console.log('Scanning finished successfull.');
                        onCompleteScan();
                    }else{
                        console.error('Scanning failed.');
                    }
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
    }
    
    channelID = channelLink.substring(channelLink.lastIndexOf('/')+1, channelLink.length);
    
    chrome.storage.getYLinks(function(ylinks){
       
        if(!ylinks || subsContain(ylinks.subscriptions, channelID) ) return;
        
        getChannelInfo(channelID, channelType, function(info){
            
            var newSub = {'id'  : info.id,
                          'info': {'title': info.snippet.title,
                                   'thumbnail': info.snippet.thumbnails.default.url}};
            
            ylinks.subscriptions.push(newSub);
                    
            adjustStorage(ylinks, function(retcode){

                if(retcode == 0){
                    console.log('Added channel successfully (ID:'+channelID+').');
                    
                    removeDummySub();
                    toggleadd(function(){
                        insertNewSub(newSub); 
                    });
                }else{
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
    
    if(channelType == 'channel'){
    
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
    
    infoRequest.execute(function(data){
        if(data.error){
            console.error('GET channelinfo failed (ID:'+channelID+').');
            console.error(data.error);
        }else{
            console.log('GET channelinfo was successfull (ID:'+channelID+').');
            onInfoGET(data.items[0]);
        }
    });
}

function getVideos(subscriptions, i, channelID, links, onComplete) {
    
    var requestPlaylist = gapi.client.request({
        'path': 'https://www.googleapis.com/youtube/v3/search',
        'params': {
          'part': 'snippet',
          'channelId': channelID,
          'maxResults': 10,
          'order': 'date'
        }
    });

    requestPlaylist.execute(function(data){
        
        //Got Error
        if(data.error){
            console.error('GET videos at "'+channelID+'" failed.');
            onComplete(1, links);   
        }
        
        //Fill local links
        var storageLinkIndex = links.findIndex(link => link.channelID == channelID);

        $.each(data.items, function(i, videoEntry){
            if(storageLinkIndex >= 0){
                links[storageLinkIndex].videoLinks.push(videoEntry.id.videoId);
            }
        });
        
        //Next channel
        if( (i+1) < subscriptions.length ){
            getVideos(subscriptions, (i+1), subscriptions[(i+1)].id, links, onComplete);
        }else{
            console.log('GET videos finished successfully.');
            onComplete(0, links);
        }
    });
    
};
  
function getSubByID(subscriptions, id){
    return subscriptions.find( sub => sub.id === id );
}

function subsContain(subscriptions, id){
    return getSubByID(subscriptions, id) != undefined;
}