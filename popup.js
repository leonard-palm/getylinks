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
    
    $.each(subscriptions, function(i, sub){
        var element = $("<li class = 'item'><ul class = 'containersub'><li class = 'itemsub'>Pic</li><li class = 'itemsub'>Desc</li><li class = 'itemsub'>But</li></ul></li>");
        
        container.prepend(element);
    });
}

function insertDummySub(container){
    
    container.prepend( $('<li/>',{
        text    : 'No Subscriptions',
        'class' : 'item',
        'id'    : 'dummySubscription'
    })); 
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
