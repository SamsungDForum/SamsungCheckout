// Samsung Checkout

// your application ID
var appId = "3201810017071"; // Please replace your appId registered.
var widgetName = "SamsungCheckout";
var uniqueId = "";

//requestProductsList
var productsList = null;

var serverDpiUrlList = {
	'DUMMY': 'https://sbox-dpiapi.samsungcloudsolution.com/openapi',
	'DEV': 'https://sbox-dpiapi.samsungcloudsolution.com/openapi',
	'PRD': 'https://dpiapi.samsungcloudsolution.com/openapi'
};

// securityKey issued by DPI Portal
var securityKey = "HkMnzyl6U4H5hWwiXaw/KMk4MOi4EBjMlLxasoa5Zgw="; // Please replace your securityKey issued by DPI Portal.
var serverName = "DUMMY";
var urlDPI = serverDpiUrlList[serverName];

var countryCode = "";

//requestPurchasesList
var purchasesList = [];
var activatedSubscriptionList = [];

// initialization
function initialization() {
	try {
		// get Uid value from TV
		uniqueId = webapis.sso.getLoginUid();
	} catch(e) {
		log('webapis.sso.getLoginUid Error : ' + e.message);
		
		// If not login status, Show samsung account UI 
		if(webapis.sso.getLoginStatus() == 0) { // SSO_NOT_LOGIN : 0 / SSO_LOGIN : 1 
			webapis.sso.showAccountView(widgetName, function(data) {
				log('Current Status is ' + data.status);
				log('Show Samsung account UI for login');
			}, function(e) {
				log('webapis.sso.showAccountView Error : ' + e.message);
			});
		}
	}
		
	// get country code value from TV
	countryCode = webapis.productinfo.getSystemConfig(webapis.productinfo.ProductInfoConfigKey.CONFIG_KEY_SERVICE_COUNTRY);
			
	log('uniqueId : ' + uniqueId + ', countryCode : ' + countryCode);
}

function requestPurchasesList(successCB) {
	// configure required property for detail object
	log("request Purchase List");
	
	var detail = {};
	detail.AppID = appId;
	detail.CustomID = uniqueId;
	detail.CountryCode = countryCode;
	detail.ItemType = "2"; // "1" : NON-CONSUMABLE / "2" : ALL
	detail.PageNumber = 1;

	// generate detail.CheckValue for last required property
	var hashData = CryptoJS.HmacSHA256(detail.AppID + detail.CustomID + detail.CountryCode + detail.ItemType + detail.PageNumber, securityKey);
	detail.CheckValue = CryptoJS.enc.Base64.stringify(hashData);

	var paymentDetails = JSON.stringify(detail);

	$.ajax({
		url: urlDPI + "/invoice/list",
		type: "POST",
		dataType: "JSON",
		data: paymentDetails,
		timeout: 10000,
		success: function(res) {
			log("requestPurchasesList success");
			HighlightPurchaseList(res);
			ParsingPurchaseListData(res);
			successCB();
		},
		error: function(jqXHR, ajaxOptions, thrownError, request, error) {
			log("requestPurchasesList [Error] thrownError: " + thrownError + "/ error : " + error + ", [Message] : " + jqXHR.responseText);
		},
		complete: function() {
			console.log("requestPurchasesList complete");
		},
		failure: function() {
			console.log("requestPurchasesList failure");
		}
	});
}

function HighlightPurchaseList(res)
{
	var stringOfInvoiceDetails = JSON.stringify(res.InvoiceDetails);
	stringOfInvoiceDetails = stringOfInvoiceDetails.replace(/"ItemID"/gi, '<a style="color:red;">"ItemID"</a>');
	stringOfInvoiceDetails = stringOfInvoiceDetails.replace(/"SubsEndTime"/gi, '<a style="color:red;">"SubsEndTime"</a>');
	result = "User Purchase List : <br>" + stringOfInvoiceDetails;
	if(res.InvoiceDetails.length == 0)
		result += "<br>There is no any Purchase List";
	log(result);	
}

function ParsingPurchaseListData(res)
{
	purchasesList = res;
	activatedSubscriptionList = [];
	for(var key in purchasesList.InvoiceDetails) {
		if(purchasesList.InvoiceDetails.hasOwnProperty(key)) {
			var purchaseItem = purchasesList.InvoiceDetails[key];			
			
			if(purchaseItem.hasOwnProperty("SubscriptionInfo") && IsSubscriptionActivated(purchaseItem.SubscriptionInfo.SubsEndTime, purchaseItem.InvoiceID))
			{
				activatedSubscriptionList.push(purchaseItem);
			}
		}
	}
}

function requestProductsList(successCB) {
	log("Request Products List");
	
	productsList = null;
	
	// configure required property for detail object
	var detail = {};
	detail.AppID = appId;
	detail.CountryCode = countryCode;
	detail.PageSize = 100;
	detail.PageNumber = 1;

	// generate detail.CheckValue for last required property
	var hashData = CryptoJS.HmacSHA256(detail.AppID + detail.CountryCode, securityKey);
	detail.CheckValue = CryptoJS.enc.Base64.stringify(hashData);

	var paymentDetails = JSON.stringify(detail);

	$.ajax({
		url: urlDPI + "/cont/list",
		type: "POST",
		dataType: "JSON",
		data: paymentDetails,
		timeout: 10000,
		success: function(res) {
			HighlightProductList(res);
			productsList = res;
			if(productsList.TotalCount >= 1)
			{
				successCB();
			}
		},
		error: function(jqXHR, ajaxOptions, thrownError, request, error) {
			log("requestProductsList [Error] thrownError: " + thrownError + "/ error : " + error + ", [Message] : " + jqXHR.responseText);
		},
		complete: function() {
			console.log("requestProductsList complete");
		},
		failure: function() {
			console.log("requestProductsList failure");
		}
	});
}

function HighlightProductList(res)
{
	console.log(res);
	
	var stringOfServerResponse = JSON.stringify(res);
	stringOfServerResponse = stringOfServerResponse.replace(/"ItemDetails"/gi, '<a style="color:red;">"ItemDetails"');
	stringOfServerResponse += "</a>";
	log(stringOfServerResponse);
}

// buyItem
function requestBuyItem(OnBillingClientClosedCB) {
	if(productsList) {
		log("Request Buy Item");
		
		// Only for display id of buyable Items. It depends on your implementation.
		for(var i=0; i<productsList.TotalCount; i++) {
			log('buyable item[' + i + '] ' + productsList.ItemDetails[i].ItemID);
		}
		
		// On this sample, buy first item of productsList
		var selectedItemDetails = productsList.ItemDetails[0];
		
		// configure required property for detail object
		var detail = {};
		detail.OrderItemID = selectedItemDetails.ItemID; //issued by requestProductsList
		detail.OrderTitle = selectedItemDetails.ItemTitle; //issued by requestProductsList
		detail.OrderTotal = selectedItemDetails.Price.toString(); //issued by requestProductsList
		detail.OrderCurrencyID = selectedItemDetails.CurrencyID; //issued by requestProductsList
		detail.OrderCustomID = uniqueId;
	
		var paymentDetails = JSON.stringify(detail);
	
		try {
			webapis.billing.buyItem(appId, serverName, paymentDetails,
			function(data) {
				log("requestBuyItem success");
				log("[payResult] : " + data.payResult + ", [payDetail] : " + data.payDetail);
				OnBillingClientClosedCB();
			}, function(e) {
				log("requestBuyItem error : " + e.message);
			});
		} catch(e) {
			log('webapis.billing.buyItem Exception : ' + e.message);
		}
	} else {
		log('It is required to call "initialization" , "requestProductsList" for getting productsList.');
	}
}

function IsSubscriptionActivated(endTime, invoiceID)
{
	var subsEndTime = new Date(endTime.substr(0,4), endTime.substr(4,2), endTime.substr(6,2), endTime.substr(8,2), endTime.substr(10,2), endTime.substr(12,2));

	var now = new Date();
	var nowTime = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
	
	var subsEndLog = "<br>End subscription Day:" + subsEndTime.getFullYear()+"/"+ subsEndTime.getMonth()+"/"+ subsEndTime.getDate()+"/"+ subsEndTime.getHours()+"/"+ subsEndTime.getMinutes()+"/"+ subsEndTime.getSeconds()+"/"+ subsEndTime.getMilliseconds();
	var todayLog = "Today :" + nowTime.getFullYear()+"/"+ nowTime.getMonth()+"/"+ nowTime.getDate()+"/"+ nowTime.getHours()+"/"+ nowTime.getMinutes()+"/"+ nowTime.getSeconds()+"/"+ nowTime.getMilliseconds();
	
	log("Subscription End Time of " + invoiceID + "\n" + subsEndLog + "<br>" + todayLog);
	
	console.log('now is : ' + nowTime.getTime());
	console.log('subsendTime is : ' + subsEndTime.getTime());
	
	if(nowTime.getTime() < subsEndTime.getTime())
	{
		log('<a style="color:red;">' + invoiceID + " is activated</a>");
		return true;
	}
	else {
		log(invoiceID + " is not activated");
		return false;
	}
}