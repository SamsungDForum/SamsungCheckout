var btnIndex;
var useKeyList = ["0","1","2","3","4","5","6","7"];
var liList;
var guideImage;

function main() {
    log('onload');
    
    initialization();

    RegisterKey("1");
    
    guideImage = $('img')[0];
    ChangeGuideImage(0);
}

function handleKeydown(event) {
	console.log(event.keyCode);
    switch(event.keyCode) {

    case 49:
    	// 1
    	ChangeGuideImage(1);
    	requestPurchasesList(CheckSilverMembershipActivated);
    break;
	case 50:
		// 2
		ChangeGuideImage(2);
		requestProductsList(ProductListReady);
	break;
	case 51:
		// 3
		ChangeGuideImage(3);
		requestBuyItem(OnBillingClientClosed);
	break;
	case 52:
		// 4
		ChangeGuideImage(4);
		requestPurchasesList(CheckSilverMembershipActivatedAfterBuyItem);
    break;
	case 38:
		//UP
		ScrollUp();
		break;
	case 40:
		//Down
		ScrollDown();
		break;
    case 10009:
    	// Return
    	tizen.application.getCurrentApplication().hide();
    break;
    default:
    break;
    }
}

function CheckSilverMembershipActivatedAfterBuyItem()
{
	if(IsSilverMembershipActivated())
	{
		guide("As we have time before the SubsEndTime from now, SilverMembership is activated!");
		MembershipIsActivated();
		UnregisterAllKey();
		ChangeGuideImage(5);
	}
	else
	{
		guide("SilverMembership is not activated yet... Please retry buyItem.\nPlease press 3 button.");
		document.getElementById('subscriptionStatus').innerHTML = "Not Activated!";
		RegisterKey("3");
	}
}

function OnBillingClientClosed()
{
	guide("Billing Client is closed. but, You may have result as SUCCESSFUL/FAIL or CANCEL, however It is recommended to confirm through DPI server.\n Check it by using cont/list api. Please press button 4 to request api")
	RegisterKey("4");
}

function ProductListReady()
{
	guide("The product information list is ready. ItemID, ItemTitle, Price and CurrencyID will be used to call buyItem api.\nSo, now, use buyItem api with the product information your resceived. \nPlease press button 3 to call BuyItem api")
	RegisterKey("3");
}

function CheckSilverMembershipActivated()
{
	if(IsSilverMembershipActivated())
	{
		guide("You can confirm that this subscription item is activated if Activation remaining time(SubsEndTime - currentTime) is bigger than 0.");
		YouAlreadySubscribe();
		UnregisterAllKey();
		ChangeGuideImage(5);
	}
	else
	{
		guide("SilverMembership is not activated! Let's subscribe the silver membership.\n Before we buyItem, We need the product data of silver membership. you can get it by using product/list api. Please press button 2 to request api");
		document.getElementById('subscriptionStatus').innerHTML = "Not Activated!";
		RegisterKey("2");
		
	}
}

function IsSilverMembershipActivated()
{
	var ret = false;
	
	for(var index in activatedSubscriptionList)
	{
		if(activatedSubscriptionList[index].ItemID == "DP111000005448")
		{
			ret = true;
			break;
		}
	}
	
	return ret;
}

function RegisterKey(registerKey)
{
    try {
	    tizen.tvinputdevice.unregisterKeyBatch(useKeyList, function() {
	    	tizen.tvinputdevice.registerKey(registerKey);	
	    }, function(e) {
	    	log('registerKeyBatch Error : ' + e.message);
	    });
    } catch(e) {
    	log('Exception : ' + e.message);
    } 
}

function UnregisterAllKey()
{
	try{
		tizen.tvinputdevice.unregisterKeyBatch(useKeyList);
	} catch(e)
	{
		log('Exception : ' + e.message);
	}
}

function guide(string)
{
	document.getElementById('guide').innerHTML = string;
}

function log(string) {
	var tmp = '[SamsungCheckout] : ' + string; 
	console.log(tmp);
    result = tmp +' <br><br>';
    document.getElementById('result').innerHTML = result + document.getElementById('result').innerHTML;
}

function ScrollUp(){
	var div = document.getElementById('result');
	var now = div.scrollTop;
	if(now > 0)
	{
		if(now < 10)
		{
			div.scrollTop = 0;
		}
		else
		{
			div.scrollTop -= 10;
		}
	}
}

function ScrollDown(){
	var div = document.getElementById('result');
	var now = div.scrollTop;
	if(now < div.scrollHeight)
		{
			if(div.scrollHeight-10 < now){
				div.scrollTop = div.scrollHeight; 
			}
			else{
				div.scrollTop += 10;
			}
		}
}
function ChangeGuideImage(index)
{
	var fileName = "capture" + index + ".png";
	guideImage["src"] = 'images/' + fileName;
}

function MembershipIsActivated()
{
	var sampleTitle = document.getElementById('title');
	var sampleContent1 = document.getElementById('content1');
	var sampleContent2 = document.getElementById('content2');
	var sampleButtonText = document.getElementById('subscriptionStatus');
	
	sampleTitle.innerHTML = "Thank you!";
	sampleContent1.innerHTML = "Your Silver membership is activated. Enjoy the Movie!";
	sampleContent2.innerHTML = "";
	sampleButtonText.innerHTML = "WATCH NOW";
}

function YouAlreadySubscribe()
{
	var sampleTitle = document.getElementById('title');
	var sampleContent1 = document.getElementById('content1');
	var sampleContent2 = document.getElementById('content2');
	var sampleButtonText = document.getElementById('subscriptionStatus');
	
	sampleTitle.innerHTML = "Welcome back!";
	sampleContent1.innerHTML = "You are already registered as Silver membership. Enjoy the Movie!";
	sampleContent2.innerHTML = "";
	sampleButtonText.innerHTML = "WATCH NOW";
}