# mogul.io
System of components for tracking my finances.

## Dependencies

Requires CasperJS (which requires PhantomJS). This is NOT a node module.

## Running Locally
Install PhantomJS.
Install CasperJS globally: `npm install casperjs -g`
Add directories for both PhantomJS and CasperJS to PATH.
Navigate to the directory containing mogul.io and run `casperjs mogul.io.js`
Data will be written to `output.txt` in the same directory.

## Limitations
This script was written for my personal use. You are free to try to use it, but you
will almost certainly have to repurpose it for your needs. It requires a
`cred.json` file to run which contains account information used to log into the
service of your choice. Mine is not included for obvious reasons. Here is a sample:

```
{
    "url":"https://www.yourbankingservicehere.com",
    "username":"your_username_here",
    "password":"your_password_here",
    "secAnswer1":"your_security_question_1_answer_here",
    "secAnswer2":"your_security_question_2_answer_here"
}
```
