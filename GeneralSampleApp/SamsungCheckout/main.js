var useKeyList = ["0","1","2","3","4","5","6","7"];

var selectedServerEl = {};

// when body onload is called
function main() {
    log('onload');
    
    try {
	    tizen.tvinputdevice.registerKeyBatch(useKeyList, function() {
	    	log('success to register Keys');
	    }, function(e) {
	    	log('registerKeyBatch Error : ' + e.message);
	    });
    } catch(e) {
    	log('registerKeyBatch Exception : ' + e.message);
    } 
    
    selectedServerEl = document.getElementById('selected_server');
    selectServerType("DUMMY");

    document.addEventListener('visibilitychange', function() {
        if(document.hidden){
            log('hidden');
        }
        else {
            log('visible');
        }
    });
    
    document.addEventListener('click', function(event) {
    	var item = event.target;
    	switch (item.id) {
		case 'DUMMY':
			selectServerType("DUMMY");
			break;
		case 'DEV':
			selectServerType("DEV");
			break;
		case 'PRD':
			selectServerType("PRD");
			break;
		default:
			break;
		}
    });
}

function initButtonSiblingStyle(item) {
	var buttonList = item.parentNode.children;
	for(var i=0;i<buttonList.length;i++) {
		if(buttonList[i].nodeName !== "BUTTON") break;
		buttonList[i].style.backgroundColor = '#ffffff';
	}
}

function selectServerType(name) {
	serverName = name;
	var selectedItem = document.getElementById(name);
	initButtonSiblingStyle(selectedItem);
	selectedItem.style.backgroundColor = '#99ff99';
	urlDPI = serverDpiUrlList[name];
	selectedServerEl.innerHTML = name;
}

// when key is clicked
function handleKeydown(event) {
	console.log(event.keyCode);
    switch(event.keyCode) {
        case 37:
        	// ArrowLeft
        	selectServerType("DUMMY");
        break;
        case 38:
        	// ArrowUp
			selectServerType("DEV");
        break;
        case 39:
        	// ArrowRight
			selectServerType("PRD");
        break;
        case 49:
        	// 1
        	initialization();
        break;
		case 50:
			// 2
			requestPurchasesList();
		break;
		case 51:
			// 3
			requestProductsList();
		break;
		case 52:
			// 4
			requestVerifyPurchase();
	    break;
	    case 53:
	    	// 5
	    	requestApplyProduct();
	    break;
	    case 54:
	    	// 6
	    	requestCancelSubscription();
	    break;
	    case 55:
	    	// 7
	    	requestBuyItem();
	    break;
	    case 48:
	    	// 0
	    	clearLog();
	    break;
        case 10009:
        	// Return
        	tizen.application.getCurrentApplication().hide();
        break;
        default:
        break;
    }
}

// for printing log
function log(string) {
	var tmp = '[SamsungCheckout] : ' + string; 
	console.log(tmp);
    result = tmp +' <br> ' + result;
    document.getElementById('result').innerHTML = result;
}

//for clearing log
function clearLog() {
    result = '';
    document.getElementById('result').innerHTML = '';
}
