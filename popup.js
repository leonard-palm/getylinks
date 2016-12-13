$(document).ready(function(){
    
    // Set Listener's
    $("li#toggleAdd").click(function(){
        toggleadd(function(){
            console.log("Insert block toggled successfully.")
        });
    });
    
    $("li#buttonAddContainer").click(function(){
        addChannel($("input#linkInput").val());
    });
    
});

function displaySubscriptions(subscriptions){
    
    var subElements = $();
    
    if(!subscriptions || subscriptions.length == 0){
        insertDummySub(function(){
            return; 
        });
    }
    
    $.each(subscriptions, function(i, subEntry){
        var element = $("<li class = 'item' subID = '"+subEntry.id+"' style = 'display:none;'><ul class = 'containersub'><li class = 'itemsub channelThumbnail'><img src = '"+subEntry.info.thumbnail+"'></li><li class = 'itemsub channelDescription'>"+subEntry.info.title+"<div class='closeButton'><i class='material-icons md-18'>delete_forever</i></div></li><li class = 'itemsub buttonClipboard'><i class='material-icons md-36 white'>filter_1</i></li></ul></li>");
        
        subElements = subElements.add(element);
    });
    
    $("ul#subscriptionContainer").prepend(subElements);
    
    $("li.item").filter(function(){return $(this).attr("subID") != undefined}).slideToggle(500, function(){
        
        console.log('Displayed sub [ID:'+$(this).attr("subID")+'] successfully.');
        
        $(this).find('div.closeButton').click(removeSub);
    });
}

function insertNewSub(sub){
    
    var domElement;
    
    if(!sub){
        console.error('Insertion of new sub failed (sub undefined).');
        return;
    }
    
    var element = $("<li class = 'item' subID = '"+sub.id+"' style = 'display:none;'><ul class = 'containersub'><li class = 'itemsub channelThumbnail'><img src = '"+sub.info.thumbnail+"'></li><li class = 'itemsub channelDescription'>"+sub.info.title+"<div class='closeButton'><i class='material-icons md-18'>delete_forever</i></div></li><li class = 'itemsub buttonClipboard'><i class='material-icons md-36 white'>filter_1</i></li></ul></li>");
    
    element.insertBefore($("li#enterLink"));
    domElement = $("li[subID = '"+sub.id+"']");
    
    domElement.find('div.closeButton').click(removeSub);
    
    domElement.slideToggle(500, function(){
        console.log('Inserted new sub [ID:'+sub.id+'] successfully.');
        animatePulse('green', domElement);
    });
}

function removeOldSub(channelID, onFinish){
    
    var oldSub = $("li[subID = '"+channelID+"']");
    
    oldSub.slideToggle(500, function(){
        oldSub.remove();
        onFinish();
    });
}

function insertDummySub(onFinish){
    
    $("ul#subscriptionContainer").prepend( $('<li/>',{
        text    : 'No Subscriptions',
        'class' : 'item',
        'id'    : 'dummySubscription',
        'style' : 'display:none;'
    })); 
    
    $("li#dummySubscription").slideToggle(500, function(){
        onFinish();
    });
}

function removeDummySub(onFinish){
    
    var dummySub = $('li#dummySubscription');
    
    if(dummySub == undefined){
        onFinish();
    }else{
        dummySub.slideToggle(500, function(){
            dummySub.remove();
            onFinish();
        });
    }
}

function toggleadd(onFinish){
    
    var $buttonadd = $("li#toggleAdd");
    var $enterLink = $("li#enterLink");
    
    if( $enterLink.css("display") == "none" ){
        $buttonadd.text("Cancel");  
    }else{
        $buttonadd.text("Add Channel");
    }
    
    $enterLink.slideToggle(500, function(){
        $("input#linkInput").val("");
        onFinish();
    });
}

function animatePulse(color, element){

    var className;
    
    if(!element) return;
    
    if(color == 'red'){
        className = 'animatedPulseRed';
    }else if(color == 'green'){
        className = 'animatedPulseGreen';
    }else{
        return;
    }
    
    element.addClass(className);
    
    setTimeout(function(){
        element.removeClass(className);
    }, 1000);
}


var removeSub = function(){
    console.log($(this).parents('li.item').attr('subID'));
}
