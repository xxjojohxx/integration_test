﻿
let clientId = "41273936-c772-4859-8562-223ec9d13cc9";
let tenant = "joannahajne.onmicrosoft.com";
let authority = "https://login.microsoftonline.com/" + tenant;
let reportId = "36e69c6c-deaa-4477-8296-8bd77a6a9dd8"

const msalConfig = {
  auth: {
    clientId: clientId,
    authority: authority,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: true,
    asyncPopups: true
  }
};

const loginScopes = {
  scopes: [
    "openid",
    "profile",
    "email",
    "https://analysis.windows.net/powerbi/api/Report.Read.All",
  ]
};

const requestScopes = {
  scopes: [
    "https://analysis.windows.net/powerbi/api/Report.Read.All",
  ]
};

$(async function () {

  const params = new URLSearchParams(window.location.search)
  let reportId = params.get("36e69c6c-deaa-4477-8296-8bd77a6a9dd8");
  "filter"

  if (!reportId) {
    DisplayError("Hello! The report is not configured with a valid report ID.");
    return;
  }

  let aadApplication = new msal.PublicClientApplication(msalConfig);

  // check if there is a cached identity for user
  const currentAccounts = aadApplication.getAllAccounts();
  if (currentAccounts.length > 0) {
    // user identity found - get access token and embed report
    accountId = currentAccounts[0].homeAccountId;
    let tokenRequest = requestScopes;
    tokenRequest.account = accountId;
    let tokenResponse = await aadApplication.acquireTokenSilent(tokenRequest);
    EmbedReport(tokenResponse.accessToken, reportId);
  }
  else {
    // user identity not found - show Sign-in button
    $("#signin").click(async function () {
      let aadApplication = new msal.PublicClientApplication(msalConfig);
      aadApplication.loginPopup(loginScopes)
        .then(function (response) {
          EmbedReport(response.accessToken, reportId);
        })
        .catch(function (error) {
          DisplayError("User login was not successful. Please try again.");
        });
      
    });
    $("#toolbar").show();
  }


});

let EmbedReport = function (token, reportId) {

  $("#toolbar").hide();
  $("#error-panel").hide();


  let padding = 8;
  $("#report-container")
    .width(window.innerWidth - padding)
    .height(window.innerHeight - padding);

  $("#loading")
    .width(window.innerWidth - padding)
    .height(window.innerHeight - padding)
    .show();

  let models = window["powerbi-client"].models;

  reportLoadConfig = {
    type: "report",
    id: reportId,
    embedUrl: "https://app.powerbi.com/reportEmbed?reportId=36e69c6c-deaa-4477-8296-8bd77a6a9dd8",
    accessToken: token,
    tokenType: models.TokenType.Aad,
    settings: {
      panes: {
        filters: { expanded: false, visible: false },
        pageNavigation: { visible: false }
      }
    }
  };

  let reportContainer = document.getElementById("report-container");
  let report = powerbi.embed(reportContainer, reportLoadConfig);

  report.on("loaded", function () {
    $("#loading").hide();
    $("#report-container").show();
  });

  report.on("error", function (error) {
    console.log(error.detail.detailedMessage);
    DisplayError(error.detail.detailedMessage);
    $("#loading").hide();
  });

}

let DisplayError = function (msg) {
  $("#error-panel")
    .text("Error: " + msg)
    .show();

}




