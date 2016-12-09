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

function displaySubscriptions(subscriptions){
    
    var container = $("ul#subscriptionContainer");
    
    if(!subscriptions || subscriptions.length == 0){
        insertDummySub(container);
        return;
    }
    
    $.each(subscriptions, function(i, subEntry){
        var element = $("<li class = 'item'><ul class = 'containersub'><li class = 'itemsub channelThumbnail'><img src = '"+subEntry.info.thumbnails.default+"'></li><li class = 'itemsub channelDescription'>"+subEntry.info.localized.title+"</li><li class = 'itemsub buttonClipboard'><i class='material-icons md-36'>filter_1</i></li></ul></li>");
        
        container.prepend(element);
    });
}

function insertNewSub(sub){
    
    if(!sub){
        console.error('Insertion of new sub failed (sub undefined).');
        return;
    }
    
    var element = $("<li class = 'item'><ul class = 'containersub'><li class = 'itemsub channelThumbnail'><img src = '"+sub.info.thumbnails.default+"'></li><li class = 'itemsub channelDescription'>"+sub.info.localized.title+"</li><li class = 'itemsub buttonClipboard'><i class='material-icons md-36'>filter_1</i></li></ul></li>");
    
    $("ul#subscriptionContainer").prepend(element);
    
    console.info(sub.info.thumbnails.default);
    
    console.log('Inserted new sub successfully.');
}

function insertDummySub(container){
    
    container.prepend( $('<li/>',{
        text    : 'No Subscriptions',
        'class' : 'item',
        'id'    : 'dummySubscription'
    })); 
}

function removeDummySub(){
    
    $('li#dummySubscription').remove();
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
