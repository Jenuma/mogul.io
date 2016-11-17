var casper = require("casper").create();
var fs = require("fs");
var cred = require("cred.json");

casper.on("resource.requested", function(request) {
    console.log("Requested: " + request.method + " " + request.url);
});

casper.on("resource.received", function(resource) {
    console.log("Received: " + resource.url);
})

casper.on("navigation.requested", function(url, navigationType, navigationLocked, isMainFrame) {
    console.log("Navigation: " + navigationType + " to " + url);
});

casper.on("wait.start", function() {
    console.log("Started waiting...");
});

casper.on("wait.done", function() {
    console.log("Finished waiting...");
});

casper.on("waitFor.timeout", function(timeout, details) {
    console.log("Timed out waiting for " + details.selector);
});

casper.on("step.timeout", function(step, timeout) {
    console.log("Timed out waiting for " + step);
});

casper.on("error", function(msg, backtrace) {
    console.log("Uncaught error: " + msg + " Trace: " + backtrace);
});

casper.on("step.error", function(err) {
    console.log("Step failed: " + err);
});

casper.on("complete.error", function(err) {
    console.log("Complete callback failed: " + err);
});

casper.on("run.complete", function() {
    console.log("Casper completed successfully.");
});

/*
 * Start adding to Casper's queue by going to the service's homepage.
 * Viewport must be set to at least 768w to access desktop layout.
 */
casper.start();
casper.viewport(768, 300);
casper.thenOpen(cred.url);

/*
 * Login to the service.
 */
casper.then(function() {
    console.log(casper.getTitle());
    
    console.log("Waiting for login form to load...");
    casper.waitForSelector("form.regions-olb-login-form", login, loginTimeout);
});

/*
 * Callback for when the login form loads.
 */
function login() {
    console.log("Inside login() function...");
    if(casper.exists("input[name='UserName']") &&
       casper.exists("input[name='OnlineID']") && 
       casper.exists("input[name='Password']")) {
            console.log("Login form input fields exist...");
            casper.fillSelectors("form.regions-olb-login-form", {
                "input[name='UserName']": cred.username,
                "input[name='OnlineID']": cred.username,
                "input[name='Password']": cred.password
                }, true);
            console.log("Filled login form and submitted...");    
    } else {
        console.log("ERROR: Login form seems invalid.");
        casper.capture("error-invalid-login-form.png");
        exit(1);
    }
}

/*
 * Callback for when the login form takes to long to load or doesn't exist.
 */
function loginTimeout() {
    console.log("Inside loginTimeout() function...");
    console.log("ERROR: Timed out waiting for login form.");
    casper.capture("error-login-form-timeout.png");
    exit(1);
}

/*
 * Wait for login.
 */
casper.then(function() {
    console.log("Waiting for login response...");
    
    if(casper.exists("form.regions-olb-login-form")) {
        casper.waitWhileVisible("form.regions-olb-login-form", function() {
            console.log("Login form no longer visible.");
        }, function() {
            console.log("ERROR: Timed out waiting for login response.");
            casper.capture("error-login-submit-timeout.png");
            exit(1);
        });
    } else {
        console.log("Login form not visible...");
        casper.capture();
    }
});

/*
 * Answer security question, if prompted.
 */
casper.then(function() {
    console.log(casper.getTitle());
    
    if(casper.exists("label[for='Answer']")) {
        console.log("Security question form exists...");
        
        var question = casper.fetchText("label[for='Answer']");
        var answer;
        
        if(question == cred.secQuestion1) {
            console.log("Getting asked security question 1...");
            answer = cred.secAnswer1;
        } else if(question == cred.secQuestion2) {
            console.log("Getting asked security quesiton 2...");
            answer = cred.secAnswer2;
        } else if(question == cred.secQuestion3) {
            console.log("Getting asked security quesiton 3...");
            answer = cred.secAnswer3;
        } else {
            console.log("ERROR: Security question seems invalid.");
            casper.capture("error-sec-question-invalid.png");
            exit(1);
        }
        
        if(casper.exists("input[name='Answer']")) {
            console.log("Security answer input field exists...");
            casper.fillSelectors("form", {
                "input[name='Answer']": answer
                }, true);
        } else {
            console.log("ERROR: Security answer input seems invalid.");
            casper.capture("error-sec-answer-invalid.png");
            exit(1);
        }
    } else {
        console.log("Security question form doesn't exist...");
    }
});

/*
 * Get balance.
 */
casper.then(function() {
    if(casper.exists(".value")) {
        console.log("Balance value exists...");
        
        var balanceValue = casper.fetchText(".value");
        balanceValue = balanceValue.match(/\$(?:,?\d{0,3})*\.\d\d/);
        
        console.log("Value: " + balanceValue);
    } else {
        console.log("ERROR: Balance value seems invalid.");
        casper.capture("error-balance-invalid");
        exit(1);
    }
});

/*
 * Log out of the service.
 */
casper.thenOpen("https://onlinebanking.regions.com/authentication/signedout");

/*
 * Run the script and exit when finished.
 */
casper.run(function() {
    console.log("Casper script finished...");
    exit(0);
});

function exit(status) {
    console.log("Exit called...");
    //casper.exit();
    //phantom.exit(status);
}

/*
 * Writes the passed text to the output file.
 */
function write(text) {
    fs.write("output.txt", text + "\n", "a/+");
}
