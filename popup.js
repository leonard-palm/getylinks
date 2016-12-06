$(document).ready(function(){
    
    // Set Listener's
    $("li#toggleAdd").click(function(){
        console.log("clicked"); 
        toggleadd();
    });
    
    $("li#buttonAddContainer").click(function(){
        addChannel($("input#linkInput").val());
    });
    
    
    
});

function onGapiLoad(){
    
    getChannelInfo('UCXvSeBDvzmPO05k-0RyB34w', function(info){
        console.log(info);
    });
    
}

function getChannelInfo(id, callback){
    
    var snippetRequest = gapi.client.request({
        'path': 'https://www.googleapis.com/youtube/v3/channels',
        'params': {
          'part': 'snippet',
          'id': id,
        }
    });
    
    snippetRequest.execute(function(data){
        callback(data);
    });
}

function toggleadd(){
    
    var $buttonadd = $("li#toggleAdd");
    var $enterLink = $("li#enterLink");
    
    if( $enterLink.css("display") == "none" ){
        $buttonadd.text("Cancel");  
    }else{
        $buttonadd.text("Add Channel");
    }
    
    $enterLink.slideToggle(500, function(){
        $("input#linkInput").val("");
    });
}
