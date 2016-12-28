/*
 * mogul.io
 *
 * author: Clifton Roberts
 * date: 17 November 2016
 *
 * Scrapes Regions' mobile banking site to get my balance.
 */
var fs = require("fs");
var cred = require("cred.json");
var casper = require("casper").create({
    verbose: true,
    logLevel: "info"
});

/*
 * Flag which, if set to true, will allow script to write balance to output.txt.
 */
var writeBalanceToFile = false;

/*
 * Casper Event Listeners
 *
 * These are essential for debugging.
 */
casper.on("resource.requested", function(request) {
    casper.log("Requested: " + request.method + " " + request.url, "debug");
});

casper.on("resource.received", function(resource) {
    casper.log("Received: " + resource.url, "debug");
})

casper.on("navigation.requested", function(url, navigationType, navigationLocked, isMainFrame) {
    casper.log("Navigation: " + navigationType + " to " + url, "debug");
});

casper.on("wait.start", function() {
    casper.log("Started waiting", "debug");
});

casper.on("wait.done", function() {
    casper.log("Finished waiting", "debug");
});

casper.on("waitFor.timeout", function(timeout, details) {
    casper.log("Timed out waiting for " + details.selector, "debug");
});

casper.on("step.timeout", function(step, timeout) {
    casper.log("Timed out waiting for " + step, "debug");
});

casper.on("error", function(msg, backtrace) {
    casper.log("Uncaught error: " + msg + " Trace: " + backtrace, "debug");
});

casper.on("step.error", function(err) {
    casper.log("Step failed: " + err, "debug");
});

casper.on("complete.error", function(err) {
    casper.log("Complete callback failed: " + err, "debug");
});

casper.on("run.complete", function() {
    casper.log("Casper completed successfully", "debug");
});

/*
 * Start adding to Casper's queue by going to the service's homepage.
 * Viewport must be set to at least 768w to access desktop layout.
 */
casper.start();
casper.userAgent("mogul.io/Personal Regions Scraper by Jenuma. See https://github.com/Jenuma/mogul.io for more information.");
casper.viewport(768, 300);
casper.thenOpen(cred.url, function() {
    casper.log("Opened " + cred.url, "info");
});

/*
 * Login to the service.
 */
casper.then(function() {
    casper.waitForSelector("form.regions-olb-login-form", login, loginTimeout);
});

/*
 * Callback for when the login form loads.
 */
function login() {
    casper.log("Inside login() function", "debug");
    if(casper.exists("input[name='UserName']") &&
       casper.exists("input[name='OnlineID']") && 
       casper.exists("input[name='Password']")) {
            casper.log("Login form input fields exist", "debug");
            casper.fillSelectors("form.regions-olb-login-form", {
                "input[name='UserName']": cred.username,
                "input[name='OnlineID']": cred.username,
                "input[name='Password']": cred.password
                }, true);
            casper.log("Filled login form and submitted", "debug");    
    } else {
        casper.log("Login form seems invalid", "error");
        casper.capture("error-invalid-login-form.png");
        exit(1);
    }
}

/*
 * Callback for when the login form takes to long to load or doesn't exist.
 */
function loginTimeout() {
    casper.log("Inside loginTimeout() function", "debug");
    console.log("Timed out waiting for login form", "error");
    casper.capture("error-login-form-timeout.png");
    exit(1);
}

/*
 * Wait for login.
 */
casper.then(function() {
    if(casper.exists("form.regions-olb-login-form")) {
        casper.waitWhileVisible("form.regions-olb-login-form", function() {
            casper.log("Login form no longer visible", "debug");
        }, function() {
            casper.log("Timed out waiting for login response.", "error");
            casper.capture("error-login-submit-timeout.png");
            exit(1);
        });
    } else {
        casper.log("Login form not visible", "debug");
    }
});

/*
 * Answer security question, if prompted.
 */
casper.then(function() {
    if(casper.exists("label[for='Answer']")) {
        casper.log("Security question form exists", "debug");
        
        var question = casper.fetchText("label[for='Answer']");
        var answer;
        
        if(question == cred.secQuestion1) {
            casper.log("Getting asked security question 1", "info");
            answer = cred.secAnswer1;
        } else if(question == cred.secQuestion2) {
            casper.log("Getting asked security quesiton 2", "info");
            answer = cred.secAnswer2;
        } else if(question == cred.secQuestion3) {
            casper.log("Getting asked security quesiton 3", "info");
            answer = cred.secAnswer3;
        } else {
            casper.log("Security question seems invalid.", "error");
            casper.capture("error-sec-question-invalid.png");
            exit(1);
        }
        
        if(casper.exists("input[name='Answer']")) {
            casper.log("Security answer input field exists", "debug");
            casper.fillSelectors("form", {
                "input[name='Answer']": answer
                }, true);
        } else {
            casper.log("Security answer input seems invalid", "error");
            casper.capture("error-sec-answer-invalid.png");
            exit(1);
        }
    } else {
        casper.log("Security question form doesn't exist", "debug");
    }
});

/*
 * Get balance.
 */
casper.then(function() {
    if(casper.exists(".value")) {
        casper.log("Balance value exists", "debug");
        
        var balanceValue = casper.fetchText(".value");
        balanceValue = balanceValue.match(/\$(?:,?\d{0,3})*\.\d\d/);
        
        casper.log("Value: " + balanceValue, "info");
        
        if(writeBalanceToFile) {
            fs.write("output.txt", balanceValue, "w");
        }
    } else {
        casper.log("Balance value seems invalid.", "error");
        casper.capture("error-balance-invalid");
        exit(1);
    }
});

/*
 * Log out of the service.
 */
casper.thenOpen("https://onlinebanking.regions.com/authentication/signedout", function() {
    casper.log("Signed out", "info");
});

/*
 * Run the script and exit when finished.
 */
casper.run(function() {
    exit(0);
});

/*
 * Exits both CasperJS and PhantomJS processes.
 */
function exit(status) {
    casper.exit();
    phantom.exit(status);
}
