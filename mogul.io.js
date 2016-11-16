var casper = require("casper").create();
var fs = require("fs");
var cred = require("cred.json");

/*
 * Start adding to Casper's queue by going to the service's homepage.
 */
casper.start();

casper.viewport(768, 300);

casper.thenOpen(cred.url);

casper.then(function() {
    console.log(casper.getTitle());
    casper.capture("debug-1-login.png");
    
    console.log("Waiting for login form to load...");
    casper.waitForSelector("form.regions-olb-login-form", login, loginTimeout);
});

function login() {
    console.log("Inside login() function...");
    if(casper.exists("input[name='OnlineID']") && casper.exists("input[name='Password']")) {
        console.log("Login form input fields exist...");
        casper.fillSelectors("form.regions-olb-login-form", {
            "input[name='OnlineID']": cred.username,
            "input[name='Password']": cred.password
            }, false);
        casper.click("button.regions-olb-login-button");
        console.log("Filled login form and submitted...");    
    } else {
        console.log("ERROR: Login form seems invalid.");
        casper.capture("error-invalid-login-form.png");
        exit(1);
    }
}

function loginTimeout() {
    console.log("Inside loginTimeout() function...");
    console.log("ERROR: Timed out waiting for login form.");
    casper.capture("error-login-form-timeout.png");
    exit(1);
}

casper.then(function() {
    console.log("Waiting for login response...");
    casper.capture("what-are-you-waiting-on.png");
    casper.waitWhileVisibile("form.regions-olb-login-form", function() {
            console.log("Login form no longer visible.");
        }, function() {
            console.log("ERROR: Timed out waiting for login response.");
            casper.capture("error-login-submit-timeout.png");
            exit(1);
        });
});

casper.then(function() {
    console.log(casper.getTitle());
    casper.capture("debug-2-sec-question.png");
    
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
            casper.fillSelector("form", {
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

casper.then(function() {
    console.log(this.getTitle());
    casper.capture("debug-3-balance.png");
    
    if(casper.exists(".value")) {
        console.log("Balance value exists...");
        console.log("Value: " + casper.fetchText(".value"));
    } else {
        console.log("ERROR: Balance value seems invalid.");
        casper.capture("error-balance-invalid");
        exit(1);
    }
});

casper.then(function() {
    if(casper.exists("a")) {
        console.log("There are links on the balance page...");
        if(casper.fetchText("a").includes("Log Out")) {
            console.log("There is a log out link on the balance page...");
            this.clickLabel("Log Out", "a");
        } else {
            console.log("ERROR: No log out links found.");
            casper.capture("error-balance-no-log-out-link.png");
            exit(1);
        }
    } else {
        console.log("ERROR: No links found.");
        casper.capture("error-balance-no-links-found.png");
        exit(1);
    }
});

/*
 * Run the script and exit when finished.
 */
casper.run(function() {
    console.log("Casper script finished...");
    exit(0);
});

function exit(status) {
    console.log("Exit called...");
    casper.exit();
    phantom.exit(status);
}

/*
 * Writes the passed text to the output file.
 */
function write(text) {
    fs.write("output.txt", text + "\n", "a/+");
}
