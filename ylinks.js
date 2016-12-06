
var apikey = "AIzaSyCkR8GNk7w464UkHX9afFc412bTn1uC0Jo";

function init(){
    
    initStorage(function(){
        adjustStorage();
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