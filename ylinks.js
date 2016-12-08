
var apikey = "AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo";

function init(){
    
    //Set my custom YouTube-API Key
    gapi.client.setApiKey(apikey);
    
    //Load YouTube-API
    gapi.client.load("youtube", "v3", function(){
        
        //Initialize Storage Object's and Array's
        initStorage(function(retcode){
            
            if(retcode == 1){
                console.out("Failed to initialize Storage.");
            }else{
                
                //Display Subscriptions on Popup
                chrome.storage.getYLinks(function(ylinks){
                    displaySubscriptions(ylinks.subscriptions)
                });
                    
                //Scan for new Videos published by my Subscriptions
                //scan(function(retcode){
                    
                    //console.out("Scanning Subs finished with return code " + retcode + ".");
                //});
                
            }
        
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
        
        getVideos(ylinks.subscriptions, 0, ylinks.subscriptions[0], ylinks.links , function(retcode, links){
        
            if(retcode == 0){
                chrome.storage.updateYLinks(ylinks, function(retcode){
                    onCompleteScan(retcode);
                });
            }else{
                onCompleteScan(1);
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
       
        if(!ylinks || ylinks.subscriptions.indexOf(channelID) >= 0) return;
        
        getChannelInfo(channelID, channelType, function(info){

            ylinks.subscriptions.push(info.id);

            chrome.storage.updateYLinks(ylinks, function(retcode){
                
                if(retcode > 0) return;
                    
                adjustStorage(ylinks, function(retcode){

                    if(retcode == 0){
                        console.out("Added channel to storage and adjusted it successfully.");
                        displaySubscriptions(ylinks.subscriptions);
                    }else{
                        console.out("Failed to adjust new Storage.")
                    }
                }); 
                
            });  
            
        });
        
    });
    
}

function removeChannel(channelID){
    
    chrome.storage.getYLinks(function(ylinks){
        
        if(!ylinks) return;
        
        ylinks.splice( ylinks.subscriptions.indexOf(channelID), 1);
        
        adjustStorage(ylinks, function(retcode){
           
            if(retcode === 0){
                console.log("Removed channel successfully.");
            }else{
                console.error("Failed to remove channel.")
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
            console.out(data.error);
        }else if(data.items.length <= 0){
            console.log("No channel info found.");
        }else{
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
        if(data.error) onComplete(1, links);
        
        //Fill local links
        var storageLinkIndex = links.findIndex(link => link.channelID == channelID);

        $.each(data.items, function(i, videoEntry){
            if(storageLinkIndex >= 0){
                links[storageLinkIndex].videoLinks.push(videoEntry.id.videoId);
            }
        });
        
        //Next channel
        if( (i+1) < subscriptions.length ){
            getVideos(subscriptions, (i+1), subscriptions[(i+1)], links, onComplete);
        }else{
            onComplete(0, links);
        }
    });
    
};
                            
                            

                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            