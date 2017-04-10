// Samsung Checkout

// your application ID
var appId = "3201508004443"; // Please replace your appId registered.
var widgetName = "SamsungCheckout";
var loginUid = "";

var serverDpiUrlList = {
	'DUMMY': 'https://sbox-dpiapi.samsungcloudsolution.com/openapi',
	'DEV': 'https://sbox-dpiapi.samsungcloudsolution.com/openapi',
	'PRD': 'https://dpiapi.samsungcloudsolution.com/openapi'
};

// securityKey issued by DPI Portal
var securityKey = "rCvi9+aOAYxlzBZgTlGe/ajDHWo6GF4W+JiHWn8Uuzc="; // Please replace your securityKey issued by DPI Portal.
var serverName = "DUMMY";
var urlDPI = serverDpiUrlList[serverName];

var countryCode = "";

// initialization
function initialization() {
	try {
		// get Uid value from TV
		loginUid = webapis.sso.getLoginUid();
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
			
	log('loginUid : ' + loginUid + ', countryCode : ' + countryCode);
}

// requestPurchasesList
var canceledItems = [];
var unCanceledItems = [];
var readyToCancelItems = [];
var purchasesList = [];

function requestPurchasesList() {
	// configure required property for detail object
	var detail = {};
	detail.AppID = appId;
	detail.CustomID = loginUid;
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
			purchasesList = res;

			for(var key in purchasesList.InvoiceDetails) {
				if(purchasesList.InvoiceDetails.hasOwnProperty(key)) {
					var purchaseItem = purchasesList.InvoiceDetails[key];

					for(var property in purchaseItem) {
						if(purchaseItem.hasOwnProperty(property)) {
							if(property == "CancelStatus") {
								if(purchaseItem.CancelStatus == true) {
									canceledItems.push(purchaseItem);
								}
								else {
									unCanceledItems.push(purchaseItem);
								}
							}
							
							if(property == "SubscriptionInfo") {
								if(purchaseItem.SubscriptionInfo.SubsStatus == "00") { // 00: Active
									readyToCancelItems.push(purchaseItem);
								}
							}
						}
					}
				}
			}
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

// requestProductsList
var productsList = null;

function requestProductsList() {
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
			log("requestProductsList success : " + JSON.stringify(res));
			productsList = res;
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

// requestVerifyPurchase
var verifiedItems = [];
var verifyPurchase = {};

function requestVerifyPurchase() {
	for(var key in unCanceledItems) {
		var unCanceledItem = unCanceledItems[key];
		if(unCanceledItem.hasOwnProperty("InvoiceID")) {
			log("invoiceID : " + unCanceledItem.InvoiceID);

			// configure required property for detail object
			var detail = {};
			detail.AppID = appId;
			detail.InvoiceID = unCanceledItem.InvoiceID; //issued by requestPurchasesList
			detail.CustomID = loginUid;
			detail.CountryCode = countryCode;

			var paymentDetails = JSON.stringify(detail);

			$.ajax({
				url: urlDPI + "/invoice/verify",
				type: "POST",
				dataType: "JSON",
				data: paymentDetails,
				timeout: 10000,
				success: function(res) {
					console.log("requestVerifyPurchase success");
					verifyPurchase = res;

					if(verifyPurchase.InvoiceID) {
						verifiedItems.push(verifyPurchase.InvoiceID);
					}
				},
				error: function(jqXHR, ajaxOptions, thrownError, request, error) {
					console.log("requestVerifyPurchase [Error] thrownError: " + thrownError + "/ error : " + error + ", [Message] : " + jqXHR.responseText);
				},
				complete: function() {
					console.log("requestVerifyPurchase complete");
				},
				failure: function() {
					console.log("requestVerifyPurchase failure");
				}
			});
		}
	}
}

// requestApplyProduct
var applyProduct = {};

function requestApplyProduct() {
	for(var key in verifiedItems) {
		if(verifiedItems.hasOwnProperty(key)) {
			var verifiedItem = verifiedItems[key];
			log("Applying InvoiceID : " + verifiedItem);

			// configure required property for detail object
			var detail = {};
			detail.AppID = appId;
			detail.InvoiceID = verifiedItem; //issued by requestVerifyPurchase
			detail.CustomID = loginUid;
			detail.CountryCode = countryCode;

			var paymentDetails = JSON.stringify(detail);

			$.ajax({
				url: urlDPI + "/invoice/apply",
				type: "POST",
				dataType: "JSON",
				data: paymentDetails,
				timeout: 10000,
				success: function(res) {
					console.log("requestApplyProduct success");
					applyProduct = res;
				},
				error: function(jqXHR, ajaxOptions, thrownError, request, error) {
					console.log("requestApplyProduct [Error] thrownError: " + thrownError + "/ error : " + error + ", [Message] : " + jqXHR.responseText);
				},
				complete: function() {
					console.log("requestApplyProduct complete");
				},
				failure: function() {
					console.log("requestApplyProduct failure");
				}
			});
		}
	}
}

// requestCancelSubscription
var canceledProduct = {};

function requestCancelSubscription() {
	// configure required property for detail object
	if(readyToCancelItems.length == 0) {
	    log("There is no Cancelable item.");
		return;
	}
	
	for(var key in readyToCancelItems) {
		if(readyToCancelItems.hasOwnProperty(key)) {
			var cancelableItem = readyToCancelItems[key];
			log("Applying InvoiceID : " + cancelableItem.InvoiceID);
			
			var detail = {};
			detail.AppID = appId;
			detail.InvoiceID = cancelableItem.InvoiceID; //issued by requestPurchasesList
			detail.CustomID = loginUid;
			detail.CountryCode = countryCode;
		
			var paymentDetails = JSON.stringify(detail);
		
			$.ajax({
				url: urlDPI + "/subscription/cancel",
				type: "POST",
				dataType: "JSON",
				data: paymentDetails,
				timeout: 10000,
				success: function(res) {
					log("requestCancelSubscription success");
					canceledProduct = res;
				},
				error: function(jqXHR, ajaxOptions, thrownError, request, error) {
					log("requestCancelSubscription [Error] thrownError: " + thrownError + "/ error : " + error + ", [Message] : " + jqXHR.responseText);
				},
				complete: function() {
					console.log("requestCancelSubscription complete");
				},
				failure: function() {
					console.log("requestCancelSubscription failure");
				}
			});
		}
	}
	
	readyToCancelItems = []; // clear Array
}

// buyItem
function requestBuyItem() {
	if(productsList) {
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
		detail.OrderCustomID = loginUid;
	
		var paymentDetails = JSON.stringify(detail);
	
		try {
			webapis.billing.buyItem(appId, serverName, paymentDetails,
			function(data) {
				log("requestBuyItem success");
				log("[payResult] : " + data.payResult + ", [payDetail] : " + data.payDetail);
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