
var apikey = "AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo";

function init(){
    
    initStorage(function(){
        adjustStorage();
    });
    
}

function scan(){
    
    chrome.storage.sync.get("links", function(dataLinks){
        
        var links = dataLinks.links;
    
        chrome.storage.sync.get("copyHistory", function(dataHistory){
            
            var copyHistory = dataHistory.copyHistory;

            chrome.storage.sync.get("subscriptions", function(dataSubs){

                if(!dataSubs.subscriptions){
                    return;
                }

                $.each(dataSubs.subscriptions, function(i, sub){

                    getVideos(sub, function(videos){

                        var subHistory = copyHistory.find( a => a.channelid == sub);
                        var channellinks = links.find( l => l.channelid == sub );
                        
                        //Handle no channellinks 
                        
                        $.each(videos, function(i, video){
                            if(subHistory){
                                 if(subHistory.videolinks.indexOf(video.id.videoID) == -1){
                                    channellinks.videolinks.push(video.id.videoID);
                                 }
                            }else{
                                channellinks.videolinks.push(video.id.videoID); 
                            }
                        });
                    }); 
                });
            });
        });
    });
}

function initgapi(){
    
    gapi.client.setApiKey("AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo");
    gapi.client.load("youtube", "v3", function(){
        onGapiLoad();
    });
}

function addChannel(id){
    
    getChannelSnippet(id, function(snippet){

        if( snippet != null ){
            console.log("Found Channel.");
            console.log(snippet)
        }else{
            console.log("No Channel found.")
        }
    });
    
}

function scan(){
    
}

function getChannelSnippet(id, callback){
    
    var snippetRequest = gapi.client.request({
        'path': 'https://www.googleapis.com/youtube/v3/channels',
        'params': {
          'part': 'snippet',
          'id': id,
        }
    });
    
    snippetRequest.execute(function(data){
        callback( (data.items.length > 0) ? data.items[0].snippet : null);
    });
}

function getVideos(id, callback) {
    
    var requestPlaylist = gapi.client.request({
        'path': 'https://www.googleapis.com/youtube/v3/search',
        'params': {
          'part': 'snippet',
          'channelId': id,
          'maxResults': 10,
          'order': 'date'
        }
    });

    requestPlaylist.execute(function(data){
        callback(data.items);
    });
    
};