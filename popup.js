$(document).ready(function(){
    
    chrome.storage.sync.set({"copyHistory": [{"channelID": 'channel/UCXvSeBDvzmPO05k-0RyB34w',
                                              "videolinks": ['5Tq3ahL0JAs','R5xzM9RZN3o']
                                            }] }, function(){
        
        chrome.storage.sync.set({"subscriptions": ['channel/UCXvSeBDvzmPO05k-0RyB34w', 
                                               'user/SelectedBase']}, function(){
            
            chrome.storage.sync.set({"links": [{"channelID": 'channel/UCXvSeBDvzmPO05k-0RyB34w',
                                                "videoLinks": [] },
                                              {"channelID": 'channel/UCXvSeBDvz',
                                                "videoLinks": ["uhsegkjhsjkdg","uzbasedl"] }]}, function(){

                // Init storage
                init();
            });

        });
                                     
    });
    
    // Set Listener's
    $("#toggleadd").click(function(){
        console.log("clicked"); 
        toggleadd();
    });
    
    $("button#buttonadd").click(function(){
        addChannel($("input#channelid").val());
    });
    
});

function onGapiLoad(){
    
    //getVideos('UCFZ75Bg73NJnJgmeUX9l62g', function(videos){
        //console.info(videos);
        //$.each(videos, function(i, video){
           //console.info(video); 
        //});
    //});
    
}

function toggleadd(){
    
    var $buttonadd = $("li#toggleadd");
    var $enterid = $("li#enterid");
    
    if( $enterid.css("display") == "none" ){
        $buttonadd.text("Cancel");  
    }else{
        $buttonadd.text("Add Channel");
    }
    
    $("#enterid").slideToggle(500, function(){
        $("input#channelid").val("");
    });
}
